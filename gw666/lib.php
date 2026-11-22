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
  return in_array(sms_provider(), ['aliyun', 'smsbao', 'tencent'], true);
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
  $res = sms_http('https://dypnsapi.aliyuncs.com/', $all);
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
    $templateParam = json_encode(['code' => '##code##'], JSON_UNESCAPED_UNICODE);
    $r = sms_aliyun_rpc('SendSmsVerifyCode', [
      'PhoneNumber' => $phone,
      'SignName' => setting('aliyun_sign_name'),
      'TemplateCode' => setting('aliyun_template_code'),
      'TemplateParam' => $templateParam,
      'CodeLength' => 6,
      'ValidTime' => 300,
    ]);
    if (!$r['ok']) {
      return ['ok' => false, 'error' => '阿里云发送失败：' . (($r['json']['Message'] ?? '') ?: substr((string)$r['raw'], 0, 120))];
    }
    db()->prepare('INSERT INTO sms_codes (phone, scene, code, expires_at, used, attempts, created_at) VALUES (?, ?, NULL, ?, 0, 0, NOW())')
      ->execute([$phone, $scene, $expires]);
    return ['ok' => true, 'aliyun' => true];
  }

  if ($provider === 'smsbao') {
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