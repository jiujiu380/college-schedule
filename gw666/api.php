<?php
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  exit;
}

$action = $_GET['action'] ?? '';

try {
  ensure_schema();
  switch ($action) {
    case 'site':
      json_out([
        'name' => setting('site_name', '知酷课程表'),
        'desc' => setting('site_desc'),
        'logo' => setting('logo'),
        'download' => setting('download_url'),
        'contact' => [
          'email' => setting('contact_email'),
          'qq' => setting('contact_qq'),
          'wechat' => setting('contact_wechat'),
          'site' => setting('contact_site'),
        ],
        'captcha' => [
          'enabled' => captcha_enabled(),
          'id' => setting('captcha_id'),
        ],
        'sms' => [
          'enabled' => sms_enabled(),
          'provider' => sms_provider(),
        ],
        'email' => [
          'enabled' => email_verification_enabled(),
        ],
      ]);

    case 'announcements':
      $rows = db()->query('SELECT id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 20')->fetchAll();
      json_out(['items' => $rows]);

    case 'update':
      $row = db()->query("SELECT version, url, notes, is_force, created_at FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetch();
      if ($row) {
        $row['force'] = (int)$row['is_force'];
        unset($row['is_force']);
      }
      json_out(['update' => $row ?: null]);

    case 'tickets':
      $device = trim($_GET['device_id'] ?? '');
      if ($device === '') json_out(['items' => []]);
      $st = db()->prepare('SELECT id, title, content, status, reply, created_at, updated_at FROM tickets WHERE device_id = ? ORDER BY id DESC LIMIT 30');
      $st->execute([$device]);
      json_out(['items' => $st->fetchAll()]);

    case 'ticket_create':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $device = trim((string)($input['device_id'] ?? ''));
      $title = trim((string)($input['title'] ?? ''));
      $content = trim((string)($input['content'] ?? ''));
      $contact = trim((string)($input['contact'] ?? ''));
      if ($title === '' || $content === '') json_out(['error' => '标题和内容不能为空'], 422);
      $st = db()->prepare('INSERT INTO tickets (device_id, contact, title, content, status, created_at) VALUES (?, ?, ?, ?, "open", NOW())');
      $st->execute([$device, $contact, mb_substr($title, 0, 200), mb_substr($content, 0, 5000)]);
      json_out(['ok' => true, 'id' => (int)db()->lastInsertId()]);

    case 'send_email_code':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $email = trim((string)($input['email'] ?? ''));
      $scene = (string)($input['scene'] ?? 'register');
      if (!in_array($scene, ['register', 'login', 'reset'], true)) json_out(['error' => '场景不正确'], 422);
      $r = email_send_code($email, $scene);
      if (!$r['ok']) json_out(['error' => $r['error']], 429);
      json_out(['ok' => true, 'cooldown' => 60]);

    case 'send_sms':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $phone = sms_phone((string)($input['phone'] ?? ''));
      $scene = (string)($input['scene'] ?? 'register');
      if (!in_array($scene, ['register', 'login', 'reset'], true)) json_out(['error' => '场景不正确'], 422);
      $r = sms_send_code($phone, $scene);
      if (!$r['ok']) json_out(['error' => $r['error']], 429);
      json_out(['ok' => true, 'cooldown' => 60]);

    case 'user_register':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $u = trim((string)($input['username'] ?? ''));
      $p = (string)($input['password'] ?? '');
      $email = trim((string)($input['email'] ?? ''));
      $qq = trim((string)($input['qq'] ?? ''));
      $wechat = trim((string)($input['wechat'] ?? ''));
      $email = trim((string)($input['email'] ?? ''));
      if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['error' => '邮箱格式不正确'], 422);
      if (strlen($u) < 3 || strlen($u) > 24 || !preg_match('/^[A-Za-z0-9_\x{4e00}-\x{9fa5}]+$/u', $u)) {
        json_out(['error' => '用户名需 3-24 位，仅限字母、数字、下划线或中文'], 422);
      }
      if (strlen($p) < 6) json_out(['error' => '密码至少 6 位'], 422);
      $cap = verify_captcha($input['captcha'] ?? []);
      if (!$cap['ok']) json_out(['error' => $cap['error']], 422);
      if ($email !== '') {
        $exists = db()->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
        $exists->execute([$u, $email]);
      } else {
        $exists = db()->prepare('SELECT id FROM users WHERE username = ?');
        $exists->execute([$u]);
      }
      if ($exists->fetch()) json_out(['error' => '用户名已被注册'], 409);
      $st = db()->prepare('INSERT INTO users (username, password_hash, email, qq, wechat, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, "active", NOW(), NOW())');
      $st->execute([$u, password_hash($p, PASSWORD_DEFAULT), $email, $qq, $wechat]);
      $id = (int)db()->lastInsertId();
      $token = bin2hex(random_bytes(24));
      db()->prepare('UPDATE users SET token = ?, last_login = NOW() WHERE id = ?')->execute([$token, $id]);
      $row = db()->prepare('SELECT * FROM users WHERE id = ?');
      $row->execute([$id]);
      $user = $row->fetch();
      json_out(['ok' => true, 'id' => $id, 'token' => $token, 'user' => public_user($user)]);

    case 'user_login':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $u = trim((string)($input['username'] ?? ''));
      $p = (string)($input['password'] ?? '');
      $cap = verify_captcha($input['captcha'] ?? []);
      if (!$cap['ok']) json_out(['error' => $cap['error']], 422);
      $st = db()->prepare('SELECT * FROM users WHERE username = ?');
      $st->execute([$u]);
      $user = $st->fetch();
      if (!$user || !password_verify($p, $user['password_hash'])) json_out(['error' => '用户名或密码错误'], 401);
      if (($user['status'] ?? 'active') !== 'active') json_out(['error' => '账号已被停用，请联系客服'], 403);
      $token = bin2hex(random_bytes(24));
      db()->prepare('UPDATE users SET token = ?, last_login = NOW() WHERE id = ?')->execute([$token, $user['id']]);
      $user['token'] = $token;
      $user['last_login'] = date('Y-m-d H:i:s');
      json_out(['ok' => true, 'token' => $token, 'user' => public_user($user)]);

    case 'user_me':
      $token = trim((string)($_GET['token'] ?? ''));
      if ($token === '') json_out(['error' => '未登录'], 401);
      $st = db()->prepare('SELECT * FROM users WHERE token = ?');
      $st->execute([$token]);
      $user = $st->fetch();
      if (!$user) json_out(['error' => '登录已失效'], 401);
      json_out(['user' => public_user($user)]);

    case 'sync_save':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $token = trim((string)($input['token'] ?? ''));
      $st = db()->prepare('SELECT id FROM users WHERE token = ?');
      $st->execute([$token]);
      $uid = $st->fetchColumn();
      if (!$uid) json_out(['error' => '登录已失效'], 401);
      $payload = json_encode($input['data'] ?? null, JSON_UNESCAPED_UNICODE);
      if ($payload === false || strlen($payload) > 8 * 1024 * 1024) json_out(['error' => '数据过大或格式错误'], 422);
      db()->prepare('INSERT INTO user_data (user_id, payload, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = VALUES(updated_at)')
        ->execute([(int)$uid, $payload]);
      json_out(['ok' => true, 'size' => strlen($payload)]);

    case 'sync_load':
      $token = trim((string)($_GET['token'] ?? ''));
      $st = db()->prepare('SELECT id FROM users WHERE token = ?');
      $st->execute([$token]);
      $uid = $st->fetchColumn();
      if (!$uid) json_out(['error' => '登录已失效'], 401);
      $row = db()->prepare('SELECT payload, updated_at FROM user_data WHERE user_id = ?');
      $row->execute([(int)$uid]);
      $data = $row->fetch();
      if (!$data) json_out(['data' => null]);
      json_out(['data' => json_decode($data['payload'], true), 'updated_at' => $data['updated_at']]);

    case 'user_login_phone':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $phone = sms_phone((string)($input['phone'] ?? ''));
      $code = trim((string)($input['sms_code'] ?? ''));
      if (!sms_enabled()) json_out(['error' => '管理员尚未配置短信服务'], 503);
      $v = sms_verify_code($phone, $code, 'login');
      if (!$v['ok']) json_out(['error' => $v['error']], 422);
      $st = db()->prepare('SELECT * FROM users WHERE phone = ?');
      $st->execute([$phone]);
      $user = $st->fetch();
      if (!$user) json_out(['error' => '该手机号尚未注册'], 404);
      if (($user['status'] ?? 'active') !== 'active') json_out(['error' => '账号已被停用，请联系客服'], 403);
      $token = bin2hex(random_bytes(24));
      db()->prepare('UPDATE users SET token = ?, last_login = NOW() WHERE id = ?')->execute([$token, $user['id']]);
      $user['token'] = $token;
      $user['last_login'] = date('Y-m-d H:i:s');
      json_out(['ok' => true, 'token' => $token, 'user' => public_user($user)]);

    case 'user_reset_password':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $phone = sms_phone((string)($input['phone'] ?? ''));
      $code = trim((string)($input['sms_code'] ?? ''));
      $p = (string)($input['password'] ?? '');
      if (!sms_enabled()) json_out(['error' => '管理员尚未配置短信服务'], 503);
      if (strlen($p) < 6) json_out(['error' => '密码至少 6 位'], 422);
      $v = sms_verify_code($phone, $code, 'reset');
      if (!$v['ok']) json_out(['error' => $v['error']], 422);
      $st = db()->prepare('SELECT id FROM users WHERE phone = ?');
      $st->execute([$phone]);
      $id = $st->fetchColumn();
      if (!$id) json_out(['error' => '该手机号尚未注册'], 404);
      db()->prepare('UPDATE users SET password_hash = ?, token = NULL, updated_at = NOW() WHERE id = ?')
        ->execute([password_hash($p, PASSWORD_DEFAULT), (int)$id]);
      json_out(['ok' => true]);

    case 'user_login_email':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $email = trim((string)($input['email'] ?? ''));
      $code = trim((string)($input['email_code'] ?? ''));
      if (!email_verification_enabled()) json_out(['error' => '管理员尚未配置 SMTP'], 503);
      $v = email_verify_code($email, $code, 'login');
      if (!$v['ok']) json_out(['error' => $v['error']], 422);
      $st = db()->prepare('SELECT * FROM users WHERE email = ? ORDER BY id ASC LIMIT 1');
      $st->execute([$email]);
      $user = $st->fetch();
      if (!$user) json_out(['error' => '该邮箱尚未注册'], 404);
      if (($user['status'] ?? 'active') !== 'active') json_out(['error' => '账号已被停用，请联系客服'], 403);
      $token = bin2hex(random_bytes(24));
      db()->prepare('UPDATE users SET token = ?, last_login = NOW() WHERE id = ?')->execute([$token, $user['id']]);
      $user['token'] = $token;
      $user['last_login'] = date('Y-m-d H:i:s');
      json_out(['ok' => true, 'token' => $token, 'user' => public_user($user)]);

    case 'user_reset_password_email':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $email = trim((string)($input['email'] ?? ''));
      $code = trim((string)($input['email_code'] ?? ''));
      $p = (string)($input['password'] ?? '');
      if (!email_verification_enabled()) json_out(['error' => '管理员尚未配置 SMTP'], 503);
      if (strlen($p) < 6) json_out(['error' => '密码至少 6 位'], 422);
      $v = email_verify_code($email, $code, 'reset');
      if (!$v['ok']) json_out(['error' => $v['error']], 422);
      $st = db()->prepare('SELECT id FROM users WHERE email = ? ORDER BY id ASC LIMIT 1');
      $st->execute([$email]);
      $id = $st->fetchColumn();
      if (!$id) json_out(['error' => '该邮箱尚未注册'], 404);
      db()->prepare('UPDATE users SET password_hash = ?, token = NULL, updated_at = NOW() WHERE id = ?')
        ->execute([password_hash($p, PASSWORD_DEFAULT), (int)$id]);
      json_out(['ok' => true]);

    case 'update_profile':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $token = trim((string)($input['token'] ?? ''));
      $st = db()->prepare('SELECT * FROM users WHERE token = ?');
      $st->execute([$token]);
      $user = $st->fetch();
      if (!$user) json_out(['error' => '登录已失效'], 401);
      $nickname = trim((string)($input['nickname'] ?? ''));
      if (mb_strlen($nickname) > 20) json_out(['error' => '昵称最多 20 个字'], 422);
      $avatar = $user['avatar'] ?? null;
      $raw = (string)($input['avatar_base64'] ?? '');
      if ($raw !== '') {
        if (!preg_match('#^data:image/(png|jpeg|jpg|webp);base64,#', $raw, $m)) json_out(['error' => '头像格式不支持'], 422);
        $bin = base64_decode(substr($raw, strlen($m[0])), true);
        if ($bin === false || strlen($bin) > 2 * 1024 * 1024) json_out(['error' => '头像需小于 2MB'], 422);
        $ext = $m[1] === 'jpeg' ? 'jpg' : $m[1];
        $dir = __DIR__ . '/uploads/avatars';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $name = 'u' . (int)$user['id'] . '_' . time() . '.' . $ext;
        if (file_put_contents($dir . '/' . $name, $bin) === false) json_out(['error' => '头像保存失败'], 500);
        $avatar = 'uploads/avatars/' . $name;
      }
      db()->prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = NOW() WHERE id = ?')->execute([$nickname, $avatar, $user['id']]);
      $user['nickname'] = $nickname;
      $user['avatar'] = $avatar;
      json_out(['ok' => true, 'user' => public_user($user)]);

    case 'user_logout':
      $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
      $token = trim((string)($input['token'] ?? ''));
      if ($token !== '') db()->prepare('UPDATE users SET token = NULL WHERE token = ?')->execute([$token]);
      json_out(['ok' => true]);

    default:
      json_out(['error' => 'unknown action'], 404);
  }
} catch (Throwable $e) {
  json_out(['error' => 'server error'], 500);
}