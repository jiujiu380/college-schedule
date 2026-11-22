<?php
$admin = current_admin();
$page = basename($_SERVER['PHP_SELF']);
$nav = [
  'index.php' => '概览',
  'settings.php' => '网站设置',
  'announcements.php' => '公告管理',
  'update.php' => '版本更新',
  'users.php' => '用户管理',
  'sms_test.php' => '短信测试',
  'email_test.php' => '邮件测试',
  'tickets.php' => '工单',
];
?>
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= e($title ?? '管理后台') ?></title><link rel="stylesheet" href="../assets/admin.css"></head>
<body>
<div class="shell">
  <aside class="side">
    <div class="logo">知酷课程表</div>
    <nav>
      <?php foreach ($nav as $file => $label): ?>
        <a class="<?= $page === $file ? 'active' : '' ?>" href="<?= $file ?>"><?= e($label) ?></a>
      <?php endforeach; ?>
    </nav>
    <div class="side-foot">
      <div><?= e($admin['username'] ?? '') ?></div>
      <a href="logout.php">退出登录</a>
    </div>
  </aside>
  <main class="main">
    <div class="topbar"><h1><?= e($title ?? '') ?></h1></div>