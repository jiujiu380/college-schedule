<?php
declare(strict_types=1);
session_start();

function cfg(): array {
  static $c = null;
  if ($c === null) {
    $file = __DIR__ . '/config.php';
    $c = file_exists($file) ? require $file : require __DIR__ . '/config.sample.php';
  }
  return $c;
}

function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $c = cfg();
    $dsn = "mysql:host={$c['db_host']};dbname={$c['db_name']};charset=utf8mb4";
    $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  }
  return $pdo;
}

function setting(string $key, string $default = ''): string {
  $st = db()->prepare('SELECT v FROM settings WHERE k = ?');
  $st->execute([$key]);
  $v = $st->fetchColumn();
  return $v === false ? $default : (string)$v;
}

function set_setting(string $key, string $value): void {
  $st = db()->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
  $st->execute([$key, $value]);
}

function e(string $s): string {
  return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

function base_url(): string {
  $c = cfg();
  return rtrim($c['base_url'] ?? '', '/');
}

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function current_admin(): ?array {
  return $_SESSION['admin'] ?? null;
}

function require_admin(): void {
  if (!current_admin()) {
    header('Location: login.php');
    exit;
  }
}

function csrf_token(): string {
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
  return $_SESSION['csrf'];
}

function check_csrf(): void {
  $t = $_POST['csrf'] ?? '';
  if (!$t || !hash_equals($_SESSION['csrf'] ?? '', $t)) {
    http_response_code(400);
    exit('CSRF token 无效');
  }
}

/** 兼容旧部署：自动补建用户表 */
function ensure_schema(): void {
  db()->exec("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE,
    password_hash VARCHAR(255),
    email VARCHAR(120),
    qq VARCHAR(64),
    wechat VARCHAR(64),
    token VARCHAR(64),
    status VARCHAR(16) DEFAULT 'active',
    created_at DATETIME,
    updated_at DATETIME,
    last_login DATETIME
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  db()->exec("CREATE TABLE IF NOT EXISTS user_data (
    user_id INT PRIMARY KEY,
    payload LONGTEXT,
    updated_at DATETIME
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  db()->exec("CREATE TABLE IF NOT EXISTS email_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(160) NOT NULL,
    scene VARCHAR(16) NOT NULL,
    code VARCHAR(8) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT DEFAULT 0,
    attempts INT DEFAULT 0,
    created_at DATETIME NOT NULL,
    INDEX idx_email (email),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  db()->exec("CREATE TABLE IF NOT EXISTS sms_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    scene VARCHAR(16) NOT NULL,
    code VARCHAR(8) NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT DEFAULT 0,
    attempts INT DEFAULT 0,
    created_at DATETIME NOT NULL,
    INDEX idx_phone (phone),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  foreach ([
    'ALTER TABLE users ADD COLUMN nickname VARCHAR(64) NULL',
    'ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL',
    'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL',
  ] as $alter) {
    try { db()->exec($alter); } catch (Throwable $e) { /* 列已存在 */ }
  }
}

function captcha_enabled(): bool {
  return setting('captcha_enabled', '1') === '1'
    && setting('captcha_id') !== ''
    && setting('captcha_key') !== '';
}

function verify_captcha(array $c): array {
  if (!captcha_enabled()) return ['ok' => true];
  $lot = trim((string)($c['lot_number'] ?? ''));
  $output = trim((string)($c['captcha_output'] ?? ''));
  $pass = trim((string)($c['pass_token'] ?? ''));
  $gen = trim((string)($c['gen_time'] ?? ''));
  if ($lot === '' || $output === '' || $pass === '' || $gen === '') {
    return ['ok' => false, 'error' => '请先完成极验验证'];
  }
  $sign = hash_hmac('sha256', $lot, setting('captcha_key'));
  $body = http_build_query([
    'lot_number' => $lot,
    'captcha_output' => $output,
    'pass_token' => $pass,
    'gen_time' => $gen,
    'sign_token' => $sign,
  ]);
  $ch = curl_init('https://gcaptcha4.geetest.com/validate?captcha_id=' . urlencode(setting('captcha_id')));
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
  ]);
  $raw = curl_exec($ch);
  $err = curl_error($ch);
  curl_close($ch);
  if ($raw === false) return ['ok' => false, 'error' => '验证码服务连接失败：' . $err];
  $json = json_decode((string)$raw, true);
  if (($json['result'] ?? '') === 'success') return ['ok' => true];
  return ['ok' => false, 'error' => '验证码校验失败，请重试'];
}



/* ================= 短信验证码 ================= */

function sms_provider(): string {
  return setting('sms_provider', 'none');
}

function sms_enabled(): bool {
  return in_array(sms_provider(), ['aliyun', 'aliyun_sms', 'smsbao', 'tencent'], true);
}

function sms_phone(string $p): string {
  return preg_replace('/\D/', '', $p);
}

function sms_valid_phone(string $p): bool {
  return (bool)preg_match('/^1[3-9]\d{9}$/', $p);
}

function sms_http(string $url, array $post = [], array $headers = []): array {
  $ch = curl_init($url);
  $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12, CURLOPT_SSL_VERIFYPEER => true];
  if ($post) {
    $opts[CURLOPT_POST] = true;
    $opts[CURLOPT_POSTFIELDS] = is_array($post) ? http_build_query($post) : $post;
  }
  if ($headers) $opts[CURLOPT_HTTPHEADER] = $headers;
  curl_setopt_array($ch, $opts);
  $body = curl_exec($ch);
  $err = curl_error($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['body' => $body === false ? '' : (string)$body, 'error' => $err, 'http' => $code];
}

/** 阿里云 RPC 签名（dypnsapi） */
function sms_aliyun_rpc(string $action, array $params): array {
  $conf = [
    'AccessKeyId' => setting('aliyun_access_key_id'),
    'Action' => $action,
    'Format' => 'JSON',
    'RegionId' => setting('aliyun_region', 'cn-hangzhou'),
    'SignatureMethod' => 'HMAC-SHA1',
    'SignatureNonce' => bin2hex(random_bytes(8)),
    'SignatureVersion' => '1.0',
    'Timestamp' => gmdate('Y-m-d\\TH:i:s\\Z'),
    'Version' => '2017-05-25',
  ];
  $all = array_merge($conf, $params);
  ksort($all);
  $pairs = [];
  foreach ($all as $k => $v) {
    $pairs[] = rawurlencode((string)$k) . '=' . rawurlencode((string)$v);
  }
  $canonical = implode('&', $pairs);
  $stringToSign = 'POST&%2F&' . rawurlencode($canonical);
  $sig = base64_encode(hash_hmac('sha1', $stringToSign, setting('aliyun_access_key_secret') . '&', true));
  $all['Signature'] = $sig;
  $res = sms_http('https://' . $domain . '/', $all);
  $json = json_decode($res['body'], true);
  return ['ok' => ($json['Code'] ?? '') === 'OK', 'raw' => $res['body'], 'json' => $json];
}

/** 腾讯云 TC3 签名 SendSms */
function sms_tencent_send(string $phone, string $code): array {
  $secretId = setting('tencent_secret_id');
  $secretKey = setting('tencent_secret_key');
  $appId = setting('tencent_sms_app_id');
  $sign = setting('tencent_sign_name');
  $tpl = setting('tencent_template_id');
  $host = 'sms.tencentcloudapi.com';
  $service = 'sms';
  $action = 'SendSms';
  $version = '2021-01-11';
  $region = setting('tencent_region', 'ap-guangzhou');
  $payload = json_encode([
    'PhoneNumberSet' => ['+86' . $phone],
    'SmsSdkAppId' => $appId,
    'SignName' => $sign,
    'TemplateId' => $tpl,
    'TemplateParamSet' => [$code, '5'],
  ], JSON_UNESCAPED_UNICODE);
  $timestamp = time();
  $date = gmdate('Y-m-d', $timestamp);
  $hashedPayload = hash('sha256', $payload);
  $canonicalHeaders = "content-type:application/json; charset=utf-8\nhost:" . $host . "\n";
  $signedHeaders = 'content-type;host';
  $canonicalRequest = "POST\n/\n\n" . $canonicalHeaders . "\n" . $signedHeaders . "\n" . $hashedPayload;
  $scope = $date . '/' . $service . '/tc3_request';
  $stringToSign = "TC3-HMAC-SHA256\n" . $timestamp . "\n" . $scope . "\n" . hash('sha256', $canonicalRequest);
  $kDate = hash_hmac('sha256', $date, 'TC3' . $secretKey, true);
  $kService = hash_hmac('sha256', $service, $kDate, true);
  $kSigning = hash_hmac('sha256', 'tc3_request', $kService, true);
  $signature = hash_hmac('sha256', $stringToSign, $kSigning);
  $authorization = 'TC3-HMAC-SHA256 Credential=' . $secretId . '/' . $scope . ', SignedHeaders=' . $signedHeaders . ', Signature=' . $signature;
  $res = sms_http('https://' . $host . '/', $payload, [
    'Authorization: ' . $authorization,
    'Content-Type: application/json; charset=utf-8',
    'Host: ' . $host,
    'X-TC-Action: ' . $action,
    'X-TC-Version: ' . $version,
    'X-TC-Timestamp: ' . $timestamp,
    'X-TC-Region: ' . $region,
  ]);
  $json = json_decode($res['body'], true);
  $status = $json['Response']['SendStatusSet'][0]['Code'] ?? '';
  return ['ok' => $status === 'Ok', 'raw' => $res['body'], 'json' => $json];
}

function sms_send_code(string $phone, string $scene): array {
  $provider = sms_provider();
  if (!$provider || $provider === 'none') return ['ok' => false, 'error' => '管理员尚未配置短信服务'];
  if (!sms_valid_phone($phone)) return ['ok' => false, 'error' => '手机号格式不正确'];

  $last = db()->prepare('SELECT created_at FROM sms_codes WHERE phone = ? ORDER BY id DESC LIMIT 1');
  $last->execute([$phone]);
  $lastAt = $last->fetchColumn();
  if ($lastAt && strtotime($lastAt) > time() - 60) return ['ok' => false, 'error' => '发送太频繁，请 60 秒后再试'];
  $count = db()->prepare('SELECT COUNT(*) FROM sms_codes WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)');
  $count->execute([$phone]);
  if ((int)$count->fetchColumn() >= 10) return ['ok' => false, 'error' => '今日验证码次数已达上限'];

  $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $expires = date('Y-m-d H:i:s', time() + 300);

  if ($provider === 'aliyun') {
    $paramName = setting('aliyun_template_param', 'code') ?: 'code';
    $params = [
      'PhoneNumber' => $phone,
      'CountryCode' => '86',
      'SignName' => setting('aliyun_sign_name'),
      'TemplateCode' => setting('aliyun_template_code'),
      'TemplateParam' => json_encode([$paramName => '##code##'], JSON_UNESCAPED_UNICODE),
      'CodeLength' => 6,
      'ValidTime' => 300,
      'CodeType' => 1,
    ];
    if (setting('aliyun_scheme_name') !== '') $params['SchemeName'] = setting('aliyun_scheme_name');
    $r = sms_aliyun_rpc('SendSmsVerifyCode', $params);
    if (!$r['ok']) {
      return ['ok' => false, 'error' => sms_aliyun_hint((array)$r['json'], '阿里云发送失败')];
    }
    db()->prepare('INSERT INTO sms_codes (phone, scene, code, expires_at, used, attempts, created_at) VALUES (?, ?, NULL, ?, 0, 0, NOW())')
      ->execute([$phone, $scene, $expires]);
    return ['ok' => true, 'aliyun' => true];
  }

  if ($provider === 'aliyun_sms') {
    $paramName = setting('aliyun_template_param', 'code') ?: 'code';
    $r = sms_aliyun_rpc('SendSms', [
      'PhoneNumbers' => $phone,
      'SignName' => setting('aliyun_sign_name'),
      'TemplateCode' => setting('aliyun_template_code'),
      'TemplateParam' => json_encode([$paramName => $code], JSON_UNESCAPED_UNICODE),
    ], '2017-05-25', 'dysmsapi.aliyuncs.com');
    if (!$r['ok']) {
      return ['ok' => false, 'error' => sms_aliyun_hint((array)$r['json'], '阿里云短信发送失败')];
    }
  } elseif ($provider === 'smsbao') {
    $content = str_replace('{code}', $code, setting('smsbao_content', '【知酷课程表】验证码{code}，5分钟内有效'));
    $url = 'https://api.smsbao.com/sms?u=' . urlencode(setting('smsbao_user')) . '&p=' . md5(setting('smsbao_pass')) . '&m=' . urlencode($phone) . '&c=' . urlencode($content);
    $res = sms_http($url);
    if (trim($res['body']) !== '0') return ['ok' => false, 'error' => '短信宝发送失败：' . trim($res['body'])];
  } else {
    $r = sms_tencent_send($phone, $code);
    if (!$r['ok']) return ['ok' => false, 'error' => '腾讯云发送失败：' . (($r['json']['Response']['Error']['Message'] ?? '') ?: '请检查配置')];
  }

  db()->prepare('INSERT INTO sms_codes (phone, scene, code, expires_at, used, attempts, created_at) VALUES (?, ?, ?, ?, 0, 0, NOW())')
    ->execute([$phone, $scene, $code, $expires]);
  return ['ok' => true];
}

function sms_verify_code(string $phone, string $code, string $scene): array {
  $st = db()->prepare('SELECT * FROM sms_codes WHERE phone = ? AND scene = ? AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1');
  $st->execute([$phone, $scene]);
  $row = $st->fetch();
  if (!$row) return ['ok' => false, 'error' => '验证码已过期，请重新获取'];
  if ((int)$row['attempts'] >= 5) return ['ok' => false, 'error' => '尝试次数过多，请重新获取'];

  $ok = false;
  if (sms_provider() === 'aliyun') {
    $r = sms_aliyun_rpc('CheckSmsVerifyCode', ['PhoneNumber' => $phone, 'VerifyCode' => $code]);
    $ok = $r['ok'] && strtoupper((string)($r['json']['Model']['VerifyResult'] ?? '')) === 'PASS';
  } else {
    $ok = hash_equals((string)$row['code'], $code);
  }

  if (!$ok) {
    db()->prepare('UPDATE sms_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
    return ['ok' => false, 'error' => '验证码不正确'];
  }
  db()->prepare('UPDATE sms_codes SET used = 1 WHERE id = ?')->execute([$row['id']]);
  return ['ok' => true];
}



/* ================= 邮箱验证码 ================= */

function email_verification_enabled(): bool {
  return setting('smtp_enabled', '0') === '1' && setting('smtp_host') !== '' && setting('smtp_user') !== '';
}

function smtp_read($fp): string {
  $data = '';
  while (!feof($fp)) {
    $line = fgets($fp, 1024);
    if ($line === false) break;
    $data .= $line;
    if (strlen($line) >= 4 && $line[3] === ' ') break;
  }
  return $data;
}

function smtp_cmd($fp, string $cmd, array $expect = [250]): array {
  fwrite($fp, $cmd . "\r\n");
  $resp = smtp_read($fp);
  $code = (int)substr($resp, 0, 3);
  return ['ok' => in_array($code, $expect, true), 'code' => $code, 'resp' => $resp];
}

function smtp_send_mail(string $to, string $subject, string $html): array {
  $host = setting('smtp_host');
  $port = (int)setting('smtp_port', '465');
  $secure = setting('smtp_secure', 'ssl');
  $user = setting('smtp_user');
  $pass = setting('smtp_pass');
  $from = setting('smtp_from') ?: $user;
  $fromName = setting('smtp_from_name', setting('site_name', '知酷课程表'));
  if (!$host || !$user || !$pass) return ['ok' => false, 'error' => 'SMTP 未配置完整'];

  $target = ($secure === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
  $fp = @fsockopen($target, $port, $errno, $errstr, 15);
  if (!$fp) return ['ok' => false, 'error' => '连接 SMTP 失败：' . $errstr];
  stream_set_timeout($fp, 15);
  $banner = smtp_read($fp);
  if ((int)substr($banner, 0, 3) !== 220) { fclose($fp); return ['ok' => false, 'error' => 'SMTP 握手失败']; }

  $ehlo = smtp_cmd($fp, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
  if (!$ehlo['ok']) { fclose($fp); return ['ok' => false, 'error' => 'EHLO 失败']; }

  if ($secure === 'tls') {
    $start = smtp_cmd($fp, 'STARTTLS', [220]);
    if (!$start['ok'] || !stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
      fclose($fp);
      return ['ok' => false, 'error' => 'STARTTLS 失败'];
    }
    smtp_cmd($fp, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), [250]);
  }

  $auth = smtp_cmd($fp, 'AUTH LOGIN', [334]);
  if (!$auth['ok']) { fclose($fp); return ['ok' => false, 'error' => 'AUTH LOGIN 不支持']; }
  smtp_cmd($fp, base64_encode($user), [334]);
  $login = smtp_cmd($fp, base64_encode($pass), [235]);
  if (!$login['ok']) { fclose($fp); return ['ok' => false, 'error' => 'SMTP 账号或授权码错误']; }

  $mailFrom = smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', [250]);
  if (!$mailFrom['ok']) { fclose($fp); return ['ok' => false, 'error' => '发件地址被拒绝']; }
  $rcpt = smtp_cmd($fp, 'RCPT TO:<' . $to . '>', [250, 251]);
  if (!$rcpt['ok']) { fclose($fp); return ['ok' => false, 'error' => '收件地址被拒绝']; }
  if (!smtp_cmd($fp, 'DATA', [354])['ok']) { fclose($fp); return ['ok' => false, 'error' => 'DATA 被拒绝']; }

  $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
  $encodedName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
  $headers = [
    'From: ' . $encodedName . ' <' . $from . '>',
    'To: <' . $to . '>',
    'Subject: ' . $encodedSubject,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    'Date: ' . date('r'),
  ];
  $body = chunk_split(base64_encode($html));
  fwrite($fp, implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n");
  $sent = smtp_read($fp);
  fclose($fp);
  return ['ok' => (int)substr($sent, 0, 3) === 250, 'error' => (int)substr($sent, 0, 3) === 250 ? '' : '邮件被服务器拒绝：' . trim($sent)];
}

function email_send_code(string $email, string $scene): array {
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return ['ok' => false, 'error' => '邮箱格式不正确'];
  if (!email_verification_enabled()) return ['ok' => false, 'error' => '管理员尚未配置 SMTP 邮件服务'];

  $last = db()->prepare('SELECT created_at FROM email_codes WHERE email = ? ORDER BY id DESC LIMIT 1');
  $last->execute([$email]);
  $lastAt = $last->fetchColumn();
  if ($lastAt && strtotime($lastAt) > time() - 60) return ['ok' => false, 'error' => '发送太频繁，请 60 秒后再试'];
  $count = db()->prepare('SELECT COUNT(*) FROM email_codes WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)');
  $count->execute([$email]);
  if ((int)$count->fetchColumn() >= 10) return ['ok' => false, 'error' => '今日验证码次数已达上限'];

  $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $expires = date('Y-m-d H:i:s', time() + 600);
  $name = setting('site_name', '知酷课程表');
  $html = '<div style="font-family:-apple-system,Segoe UI,PingFang SC,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0b1220">'
    . '<h2 style="margin:0 0 12px">' . htmlspecialchars($name) . ' 验证码</h2>'
    . '<p style="color:#5b6474;font-size:14px;line-height:1.8">你的验证码是：</p>'
    . '<p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#2563eb;margin:12px 0">' . $code . '</p>'
    . '<p style="color:#8b93a3;font-size:12px;line-height:1.8">10 分钟内有效，请勿转发给他人。若非本人操作请忽略。</p></div>';
  $res = smtp_send_mail($email, $name . ' 验证码', $html);
  if (!$res['ok']) return ['ok' => false, 'error' => $res['error']];

  db()->prepare('INSERT INTO email_codes (email, scene, code, expires_at, used, attempts, created_at) VALUES (?, ?, ?, ?, 0, 0, NOW())')
    ->execute([$email, $scene, $code, $expires]);
  return ['ok' => true];
}

function email_verify_code(string $email, string $code, string $scene): array {
  $st = db()->prepare('SELECT * FROM email_codes WHERE email = ? AND scene = ? AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1');
  $st->execute([$email, $scene]);
  $row = $st->fetch();
  if (!$row) return ['ok' => false, 'error' => '验证码已过期，请重新获取'];
  if ((int)$row['attempts'] >= 5) return ['ok' => false, 'error' => '尝试次数过多，请重新获取'];
  if (!hash_equals((string)$row['code'], $code)) {
    db()->prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
    return ['ok' => false, 'error' => '验证码不正确'];
  }
  db()->prepare('UPDATE email_codes SET used = 1 WHERE id = ?')->execute([$row['id']]);
  return ['ok' => true];
}

function public_user(array $u): array {
  return [
    'id' => (int)$u['id'],
    'username' => $u['username'],
    'phone' => $u['phone'] ?? null,
    'nickname' => $u['nickname'] ?? null,
    'avatar' => $u['avatar'] ?? null,
    'email' => $u['email'],
    'qq' => $u['qq'],
    'wechat' => $u['wechat'],
    'status' => $u['status'],
    'created_at' => $u['created_at'],
    'last_login' => $u['last_login'],
  ];
}