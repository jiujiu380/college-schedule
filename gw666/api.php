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

    default:
      json_out(['error' => 'unknown action'], 404);
  }
} catch (Throwable $e) {
  json_out(['error' => 'server error'], 500);
}
