<?php
require __DIR__ . '/lib.php';

$done = false;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $host = trim($_POST['db_host'] ?? '');
  $name = trim($_POST['db_name'] ?? '');
  $user = trim($_POST['db_user'] ?? '');
  $pass = (string)($_POST['db_pass'] ?? '');
  $adminUser = trim($_POST['admin_user'] ?? '');
  $adminPass = (string)($_POST['admin_pass'] ?? '');
  $baseUrl = rtrim(trim($_POST['base_url'] ?? ''), '/');

  if (!$host || !$name || !$user || !$adminUser || strlen($adminPass) < 6) {
    $error = '请填写数据库信息，管理员密码至少 6 位';
  } else {
    try {
      $pdo = new PDO("mysql:host={$host};dbname={$name};charset=utf8mb4", $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
      $sql = file_get_contents(__DIR__ . '/install.sql');
      foreach (array_filter(array_map('trim', explode(';', $sql))) as $stmt) {
        if ($stmt !== '') $pdo->exec($stmt);
      }
      $st = $pdo->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)');
      $st->execute([$adminUser, password_hash($adminPass, PASSWORD_DEFAULT)]);

      $defaults = [
        'site_name' => '知酷课程表',
        'site_desc' => '完全离线的课表工具，支持多课表、桌面小组件与上课提醒',
        'seo_keywords' => '课表,知酷课程表,大学课表,课程表App',
        'seo_description' => '知酷课程表：离线课表、桌面小组件、上课提醒、多课表管理',
        'logo' => '',
        'download_url' => $baseUrl . '/downloads/zhiku.apk',
        'contact_email' => 'xbhlkj@163.com',
        'contact_qq' => '3073323538',
        'contact_wechat' => 'xbhlkj',
        'contact_site' => 'https://class.zcoow.cn',
      ];
      $ins = $pdo->prepare('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
      foreach ($defaults as $k => $v) $ins->execute([$k, $v]);

      $config = "<?php\nreturn " . var_export([
        'db_host' => $host,
        'db_name' => $name,
        'db_user' => $user,
        'db_pass' => $pass,
        'base_url' => $baseUrl,
      ], true) . ";\n";
      file_put_contents(__DIR__ . '/config.php', $config);
      $done = true;
    } catch (Throwable $ex) {
      $error = '安装失败：' . $ex->getMessage();
    }
  }
}
?>
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>安装 · 知酷课程表官网</title>
<style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f5f7fb;color:#111827;margin:0;padding:40px 16px}
.box{max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:24px}
h1{font-size:20px;margin:0 0 6px}p.sub{color:#6b7280;font-size:13px;margin:0 0 18px}
label{display:block;font-size:12px;color:#6b7280;margin:12px 0 6px}
input{width:100%;height:40px;border:1px solid #d1d5db;border-radius:8px;padding:0 10px;font-size:14px}
button{margin-top:18px;width:100%;height:44px;border:0;border-radius:8px;background:#2f5bff;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
.err{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:8px;padding:10px;font-size:13px;margin-bottom:10px}
.ok{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:8px;padding:14px;font-size:14px;line-height:1.7}
code{background:#f3f4f6;padding:2px 6px;border-radius:4px}</style></head><body>
<div class="box">
<h1>知酷课程表官网 · 安装</h1>
<p class="sub">安装完成后请删除 install.php，并修改管理员密码。</p>
<?php if ($error): ?><div class="err"><?= e($error) ?></div><?php endif; ?>
<?php if ($done): ?>
  <div class="ok">安装成功！<br>后台地址：<code><?= e(base_url()) ?>/admin/login.php</code><br>请立即删除 <code>install.php</code>。</div>
<?php else: ?>
<form method="post">
  <label>数据库地址</label><input name="db_host" value="127.0.0.1" required>
  <label>数据库名</label><input name="db_name" value="gw666" required>
  <label>数据库用户</label><input name="db_user" value="root" required>
  <label>数据库密码</label><input name="db_pass" type="password">
  <label>管理员账号</label><input name="admin_user" value="admin" required>
  <label>管理员密码（至少 6 位）</label><input name="admin_pass" type="password" required>
  <label>网站地址（不带结尾斜杠）</label><input name="base_url" value="https://class.zcoow.cn" required>
  <button type="submit">开始安装</button>
</form>
<?php endif; ?>
</div></body></html>
