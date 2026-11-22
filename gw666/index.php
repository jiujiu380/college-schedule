<?php
require __DIR__ . '/lib.php';

$name = setting('site_name', '知酷课程表');
$desc = setting('site_desc');
$logo = setting('logo');
$download = setting('download_url');
$keywords = setting('seo_keywords');
$seoDesc = setting('seo_description');
$email = setting('contact_email');
$qq = setting('contact_qq');
$wechat = setting('contact_wechat');
$anns = db()->query('SELECT id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 6')->fetchAll();
$shot = 'assets/shots/schedule.png';
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?= e($name) ?> · 清爽好用的离线课表</title>
<meta name="keywords" content="<?= e($keywords) ?>">
<meta name="description" content="<?= e($seoDesc) ?>">
<meta property="og:title" content="<?= e($name) ?>">
<meta property="og:description" content="<?= e($seoDesc) ?>">
<meta property="og:image" content="<?= e($logo ?: $shot) ?>">
<style>
:root{--blue:#2563eb;--blue-soft:#eef3ff;--ink:#0b1220;--muted:#5b6474;--faint:#8b93a3;--line:#e8eaf0;--bg:#f7f8fb;--card:#fff;--radius:20px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
nav{position:sticky;top:0;z-index:20;background:rgba(247,248,251,.82);backdrop-filter:saturate(180%) blur(18px);border-bottom:1px solid rgba(232,234,240,.9)}
.nav-inner{display:flex;align-items:center;gap:12px;height:66px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:-.2px}
.brand img{width:34px;height:34px;border-radius:9px;object-fit:cover}
.brand .mark{width:34px;height:34px;border-radius:9px;background:var(--blue);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800}
.nav-links{margin-left:auto;display:flex;align-items:center;gap:26px;font-size:14px;color:var(--muted)}
.nav-links a:hover{color:var(--ink)}
.nav-cta{background:var(--blue);color:#fff !important;padding:9px 16px;border-radius:10px;font-weight:600}
.hero{padding:72px 0 40px;display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.eyebrow{display:inline-flex;align-items:center;gap:7px;background:var(--blue-soft);color:var(--blue);font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:999px}
h1{font-size:58px;line-height:1.06;letter-spacing:-2.4px;margin:22px 0 18px;font-weight:800}
h1 em{font-style:normal;color:var(--blue)}
.lede{font-size:16px;line-height:1.9;color:var(--muted);max-width:470px;margin:0 0 30px}
.actions{display:flex;gap:12px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:12px;font-weight:650;font-size:15px;transition:transform .15s ease,box-shadow .15s ease}
.btn:hover{transform:translateY(-1px)}
.btn-primary{background:var(--blue);color:#fff;box-shadow:0 10px 24px rgba(37,99,235,.22)}
.btn-secondary{background:#fff;border:1px solid var(--line);color:var(--ink)}
.meta{display:flex;gap:18px;margin-top:26px;font-size:12.5px;color:var(--faint);flex-wrap:wrap}
.meta span{display:flex;align-items:center;gap:6px}
.dot{width:5px;height:5px;border-radius:50%;background:#22c55e}
.phone-wrap{position:relative;display:flex;justify-content:center}
.phone-wrap:before{content:"";position:absolute;inset:8% 4% 6%;background:radial-gradient(60% 60% at 50% 30%,rgba(37,99,235,.16),transparent 70%);filter:blur(10px)}
.phone{position:relative;width:302px;border-radius:44px;background:#0b0f19;padding:11px;box-shadow:0 40px 80px rgba(11,18,32,.20)}
.phone img{display:block;width:100%;border-radius:34px}
.phone .notch{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:92px;height:24px;background:#0b0f19;border-radius:999px;z-index:2}
.features{padding:64px 0 20px}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:26px}
.section-head h2{font-size:30px;letter-spacing:-1px;margin:0}
.section-head p{margin:8px 0 0;color:var(--muted);font-size:14px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:22px;transition:transform .18s ease,box-shadow .18s ease}
.card:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(11,18,32,.06)}
.icon{width:42px;height:42px;border-radius:12px;background:var(--blue-soft);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:16px}
.card h3{font-size:15px;margin:0 0 8px;letter-spacing:-.2px}
.card p{font-size:13px;line-height:1.8;color:var(--muted);margin:0}
.shots{padding:56px 0 10px}
.shot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.shot{background:#fff;border:1px solid var(--line);border-radius:24px;padding:14px;display:flex;justify-content:center}
.shot img{width:100%;max-width:240px;border-radius:16px;display:block}
.cta{margin:56px 0 20px;background:linear-gradient(135deg,#1d4ed8,#2563eb 55%,#3b82f6);border-radius:28px;padding:48px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:24px}
.cta h2{margin:0 0 10px;font-size:30px;letter-spacing:-.8px}
.cta p{margin:0;color:rgba(255,255,255,.82);font-size:14px;line-height:1.8}
.cta .btn{background:#fff;color:#1d4ed8;box-shadow:none}
.news{padding:52px 0 10px}
.news .card p{white-space:pre-line}
.news .meta-line{font-size:12px;color:var(--faint);margin-bottom:10px;display:flex;gap:10px;align-items:center}
.pin{background:#fff4ed;color:#c2410c;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
footer{border-top:1px solid var(--line);margin-top:52px;padding:34px 0 46px;color:var(--faint);font-size:13px}
.foot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
.foot a{color:var(--muted);margin-right:18px}
.foot a:hover{color:var(--ink)}
@media (max-width:900px){
 .hero{grid-template-columns:1fr;gap:36px;padding-top:40px}
 h1{font-size:40px;letter-spacing:-1.5px}
 .phone-wrap{order:-1}
 .grid,.shot-grid{grid-template-columns:1fr 1fr}
 .cta{flex-direction:column;align-items:flex-start;padding:32px}
 .nav-links a:not(.nav-cta){display:none}
}
@media (max-width:600px){
 .grid,.shot-grid{grid-template-columns:1fr}
 .phone{width:262px}
 h1{font-size:34px}
 .wrap{padding:0 18px}
}
</style></head><body>

<nav><div class="wrap nav-inner">
  <a class="brand" href="/">
    <?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark">知</span><?php endif; ?>
    <span><?= e($name) ?></span>
  </a>
  <div class="nav-links">
    <a href="#features">功能</a>
    <a href="#shots">界面</a>
    <a href="#news">公告</a>
    <a class="nav-cta" href="<?= e($download ?: '#') ?>">下载 App</a>
  </div>
</div></nav>

<main class="wrap">
  <section class="hero">
    <div>
      <span class="eyebrow"><span class="dot"></span> 完全离线 · 无账号 · 无广告</span>
      <h1>课表，<br>就该<em>清爽</em>又好用</h1>
      <p class="lede"><?= e($desc) ?></p>
      <div class="actions">
        <a class="btn btn-primary" href="<?= e($download ?: '#') ?>">下载 Android 版</a>
        <a class="btn btn-secondary" href="#features">看看功能</a>
      </div>
      <div class="meta">
        <span><span class="dot"></span> 数据只存在本机</span>
        <span>支持桌面小组件</span>
        <span>8 套配色</span>
      </div>
    </div>
    <div class="phone-wrap">
      <div class="phone"><div class="notch"></div><img src="<?= e($shot) ?>" alt="课表界面"></div>
    </div>
  </section>

  <section class="features" id="features">
    <div class="section-head">
      <div>
        <h2>把课表做得更顺手</h2>
        <p>从导入到上课提醒，每一步都尽量少操作。</p>
      </div>
    </div>
    <div class="grid">
      <div class="card"><div class="icon">📥</div><h3>多种导入方式</h3><p>网页识别、源码粘贴、Excel / CSV / JSON 文件导入，导入前还能逐条改。</p></div>
      <div class="card"><div class="icon">🗓️</div><h3>单节清晰排列</h3><p>第 1 节到第 10 节逐节显示，跨节课程整块展示，非本周课程淡化并可用气泡查看。</p></div>
      <div class="card"><div class="icon">⏰</div><h3>上课提醒</h3><p>本地通知，提前 5/10/15/30 分钟可调，不依赖后台常驻。</p></div>
      <div class="card"><div class="icon">🎨</div><h3>8 套配色</h3><p>经典蓝、薄荷绿、暖阳橙等，行高、圆角、透明度、深色模式都能调。</p></div>
      <div class="card"><div class="icon">🧩</div><h3>桌面小组件</h3><p>周课表与今日课程两种小组件，点击直接进入应用。</p></div>
      <div class="card"><div class="icon">📝</div><h3>备忘录与日历</h3><p>富文本 + 手绘备忘录，课程与日程在一个月视图里看全。</p></div>
    </div>
  </section>

  <section class="shots" id="shots">
    <div class="section-head">
      <div><h2>界面预览</h2><p>干净、扁平，信息密度刚刚好。</p></div>
    </div>
    <div class="shot-grid">
      <div class="shot"><img src="assets/shots/schedule.png" alt="周课表"></div>
      <div class="shot"><img src="assets/shots/calendar.png" alt="日历"></div>
      <div class="shot"><img src="assets/shots/tools.png" alt="工具"></div>
    </div>
  </section>

  <?php if ($anns): ?>
  <section class="news" id="news">
    <div class="section-head">
      <div><h2>最新公告</h2><p>版本更新与使用说明会发在这里。</p></div>
    </div>
    <div class="grid">
      <?php foreach ($anns as $a): ?>
        <div class="card">
          <div class="meta-line"><?= e($a['created_at']) ?><?= $a['pinned'] ? '<span class="pin">置顶</span>' : '' ?></div>
          <h3><?= e($a['title']) ?></h3>
          <p><?= $a['content'] ?></p>
        </div>
      <?php endforeach; ?>
    </div>
  </section>
  <?php endif; ?>

  <section class="cta">
    <div>
      <h2>现在就把课表装进口袋</h2>
      <p>Android APK · 完全免费 · 无需登录 · 离线可用</p>
    </div>
    <a class="btn" href="<?= e($download ?: '#') ?>">立即下载</a>
  </section>
</main>

<footer><div class="wrap foot">
  <div>© <?= date('Y') ?> <?= e($name) ?> · 由个人开发者独立维护</div>
  <div>
    <?php if ($email): ?><a href="mailto:<?= e($email) ?>">邮箱</a><?php endif; ?>
    <?php if ($qq): ?><span style="margin-right:18px">QQ <?= e($qq) ?></span><?php endif; ?>
    <?php if ($wechat): ?><span>微信 <?= e($wechat) ?></span><?php endif; ?>
  </div>
</div></footer>
</body></html>
