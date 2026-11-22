<?php
require __DIR__ . '/lib.php';

$name = setting('site_name', '知酷课程表');
$desc = setting('site_desc');
$logo = setting('logo');
$download = setting('download_url');
$keywords = setting('seo_keywords');
$seoDesc = setting('seo_description');
$anns = db()->query('SELECT id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 10')->fetchAll();
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= e($name) ?></title>
<meta name="keywords" content="<?= e($keywords) ?>">
<meta name="description" content="<?= e($seoDesc) ?>">
<style>
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:#f5f7fb;color:#0f172a}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
header{padding:26px 0}
.brand{display:flex;align-items:center;gap:12px}
.brand img{width:46px;height:46px;border-radius:12px;object-fit:cover}
.brand b{font-size:18px}
.hero{display:flex;gap:40px;align-items:center;padding:60px 0 40px;flex-wrap:wrap}
.hero .txt{flex:1 1 380px}
.hero h1{font-size:40px;line-height:1.2;margin:0 0 16px;letter-spacing:-1px}
.hero p{font-size:15px;line-height:1.9;color:#475569;margin:0 0 28px}
.btn{display:inline-flex;align-items:center;gap:8px;background:#2f5bff;color:#fff;text-decoration:none;padding:14px 26px;border-radius:12px;font-weight:600;font-size:15px}
.btn.secondary{background:#fff;color:#2f5bff;border:1px solid #c7d2fe}
.phone{width:280px;flex:0 0 280px;border-radius:28px;background:#0f172a;padding:10px;box-shadow:0 30px 60px rgba(15,23,42,.18)}
.phone img{width:100%;border-radius:20px;display:block}
.section{padding:24px 0}
.section h2{font-size:20px;margin:0 0 14px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px;margin-bottom:12px}
.card h3{font-size:15px;margin:0 0 8px}
.card .meta{font-size:12px;color:#94a3b8;margin-bottom:8px}
.card .content{font-size:14px;line-height:1.85;color:#334155}
footer{border-top:1px solid #e5e7eb;margin-top:40px;padding:24px 0;color:#94a3b8;font-size:12px}
footer a{color:#64748b;text-decoration:none;margin-right:14px}
@media(max-width:720px){.hero{padding-top:30px}.hero h1{font-size:30px}.phone{display:none}}
</style></head><body>
<div class="wrap">
<header><div class="brand">
<?php if ($logo): ?><img src="<?= e($logo) ?>" alt="<?= e($name) ?>"><?php endif; ?>
<b><?= e($name) ?></b>
</div></header>

<div class="hero">
  <div class="txt">
    <h1>课表，就该<br>清爽又好用</h1>
    <p><?= e($desc) ?></p>
    <a class="btn" href="<?= e($download ?: '#') ?>">下载 Android 版</a>
    <a class="btn secondary" href="admin/login.php" style="margin-left:10px">管理后台</a>
  </div>
  <div class="phone"><img src="<?= e($logo ?: 'https://class.zcoow.cn/assets/app.png') ?>" alt=""></div>
</div>

<div class="section">
  <h2>最新公告</h2>
  <?php if (!$anns): ?><div class="card"><div class="content">暂无公告</div></div><?php endif; ?>
  <?php foreach ($anns as $a): ?>
    <div class="card">
      <h3><?= e($a['title']) ?></h3>
      <div class="meta"><?= e($a['created_at']) ?></div>
      <div class="content"><?= $a['content'] ?></div>
    </div>
  <?php endforeach; ?>
</div>

<footer>
  <a href="admin/login.php">管理后台</a>
  <a href="api.php?action=site">API</a>
  <span>© <?= date('Y') ?> <?= e($name) ?></span>
</footer>
</div></body></html>
