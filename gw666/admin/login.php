<?php
require dirname(__DIR__) . '/lib.php';
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $u = trim($_POST['username'] ?? '');
  $p = (string)($_POST['password'] ?? '');
  $st = db()->prepare('SELECT * FROM admins WHERE username = ?');
  $st->execute([$u]);
  $admin = $st->fetch();
  if ($admin && password_verify($p, $admin['password_hash'])) {
    $_SESSION['admin'] = ['id' => (int)$admin['id'], 'username' => $admin['username']];
    header('Location: index.php');
    exit;
  }
  $error = '账号或密码错误';
}
?>
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>管理员登录</title><link rel="stylesheet" href="../assets/admin.css"></head>
<body class="login-body">
<form class="login-card" method="post">
  <h1>管理后台</h1>
  <p class="muted">知酷课程表官网</p>
  <?php if ($error): ?><div class="alert"><?= e($error) ?></div><?php endif; ?>
  <label>账号</label><input name="username" required>
  <label>密码</label><input name="password" type="password" required>
  <button type="submit">登录</button>
</form>
</body></html>
