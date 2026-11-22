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

function public_user(array $u): array {
  return [
    'id' => (int)$u['id'],
    'username' => $u['username'],
    'email' => $u['email'],
    'qq' => $u['qq'],
    'wechat' => $u['wechat'],
    'status' => $u['status'],
    'created_at' => $u['created_at'],
    'last_login' => $u['last_login'],
  ];
}