<?php
require __DIR__ . '/lib.php';

$name = setting('site_name', '知酷课程表');
$desc = setting('site_desc');
$logo = setting('logo');
$logoText = setting('logo_text') ?: mb_substr($name, 0, 1);
$download = setting('download_url');
$winDownload = setting('download_windows_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/zhiku-desktop-win64.zip';
$keywords = setting('seo_keywords');
$seoDesc = setting('seo_description');
$email = setting('contact_email');
$qq = setting('contact_qq');
$wechat = setting('contact_wechat');
$latestVersion = db()->query("SELECT version FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetchColumn() ?: '1.3.2';
$anns = db()->query('SELECT id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 4')->fetchAll();
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?= e($name) ?> · 清爽好用的离线课表</title>
<meta name="keywords" content="<?= e($keywords) ?>">
<meta name="description" content="<?= e($seoDesc) ?>">
<meta property="og:title" content="<?= e($name) ?>">
<meta property="og:description" content="<?= e($seoDesc) ?>">
<meta property="og:image" content="assets/shots/home.png">
<style>
:root{--blue:#2563eb;--indigo:#4f46e5;--ink:#0a0f1c;--muted:#5f6776;--faint:#8d95a5;--line:#e8eaf0;--bg:#f5f6f9;--card:#fff;--r:22px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
nav{position:sticky;top:14px;z-index:60}
.nav-inner{height:64px;display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.86);backdrop-filter:saturate(180%) blur(18px);border:1px solid rgba(232,234,240,.9);border-radius:20px;padding:0 18px;box-shadow:0 12px 36px rgba(10,15,28,.06)}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;letter-spacing:-.2px;font-size:15px}
.brand img{width:34px;height:34px;border-radius:10px;object-fit:cover}
.brand .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(145deg,#3b82f6,#1d4ed8);color:#fff;display:grid;place-items:center;font-size:15px;font-weight:800;box-shadow:0 6px 16px rgba(37,99,235,.3)}
.nav-links{margin-left:auto;display:flex;align-items:center;gap:28px;font-size:13.5px;color:var(--muted)}
.nav-links a:hover{color:var(--ink)}
.nav-dl{background:var(--ink);color:#fff !important;padding:9px 16px;border-radius:11px;font-weight:600;font-size:13px}
.hero{padding:34px 0 30px}
.hero-panel{position:relative;overflow:hidden;border-radius:32px;background:#0a0f1c;color:#fff;padding:58px 54px;display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;box-shadow:0 30px 80px rgba(10,15,28,.22)}
.hero-panel:before{content:"";position:absolute;width:640px;height:640px;right:-180px;top:-300px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,.55),transparent 62%)}
.hero-panel:after{content:"";position:absolute;width:460px;height:460px;left:-220px;bottom:-260px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.35),transparent 65%)}
.hero-copy{position:relative;z-index:2}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#bcd2ff;background:rgba(37,99,235,.18);border:1px solid rgba(120,160,255,.22);padding:8px 13px;border-radius:999px}
.eyebrow i{width:6px;height:6px;border-radius:50%;background:#34d399;display:inline-block}
h1{font-size:56px;line-height:1.05;letter-spacing:-2.6px;margin:22px 0 18px;font-weight:800}
h1 em{font-style:normal;background:linear-gradient(95deg,#7aa7ff,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}
.lede{font-size:15px;line-height:1.95;color:rgba(255,255,255,.68);max-width:440px;margin:0 0 28px}
.actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 22px;border-radius:12px;font-weight:650;font-size:14.5px;transition:transform .15s}
.btn:hover{transform:translateY(-2px)}
.btn-primary{background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;box-shadow:0 12px 28px rgba(37,99,235,.35)}
.btn-ghost{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#fff}
.btn-light{background:#fff;color:#0a0f1c}
.hero-devices{position:relative;z-index:2;height:420px;display:flex;justify-content:center;align-items:center}
.dev{position:absolute;width:214px;border-radius:32px;background:#11151f;padding:8px;box-shadow:0 30px 60px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.08)}
.dev img{width:100%;display:block;border-radius:25px}
.dev.one{transform:translate(-58px,-12px) rotate(-6deg);z-index:1}
.dev.two{transform:translate(62px,26px) rotate(5deg);z-index:2}
.hero-meta{position:relative;z-index:2;display:flex;gap:18px;margin-top:24px;font-size:11.5px;color:rgba(255,255,255,.5);flex-wrap:wrap}
.hero-meta span{display:flex;align-items:center;gap:5px}
.hero-meta b{color:rgba(255,255,255,.8);font-weight:600}
.section{padding:64px 0 20px}
.sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
.sec-head h2{font-size:32px;letter-spacing:-1.2px;margin:0;font-weight:800}
.sec-head p{margin:8px 0 0;color:var(--muted);font-size:13.5px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px}
.icon{width:40px;height:40px;border-radius:12px;background:#eef3ff;display:grid;place-items:center;margin-bottom:14px}
.icon svg{width:20px;height:20px;stroke:#2563eb;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.card h3{font-size:14.5px;margin:0 0 7px;letter-spacing:-.2px}
.card p{font-size:12.5px;line-height:1.8;color:var(--muted);margin:0}
.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.shot{background:#fff;border:1px solid var(--line);border-radius:22px;padding:14px}
.shot img{width:100%;border-radius:14px;display:block}
.platforms{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.plat{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px;transition:transform .15s}
.plat:hover{transform:translateY(-3px)}
.plat .pic{width:48px;height:48px;border-radius:14px;background:#f0f4ff;display:grid;place-items:center}
.plat h3{font-size:15px;margin:0 0 4px}
.plat p{font-size:11.5px;color:var(--faint);margin:0}
.plat .arrow{margin-left:auto;color:var(--blue);font-size:20px}
.news{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.news a{display:block}
.news .date{font-size:11px;color:var(--faint);margin-bottom:8px}
.news h3{font-size:14px;margin:0 0 6px}
.news p{font-size:12px;line-height:1.8;color:var(--muted);margin:0;max-height:78px;overflow:hidden}
.cta{margin:56px 0 20px;border-radius:26px;background:#fff;border:1px solid var(--line);padding:40px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.cta h2{font-size:28px;letter-spacing:-.8px;margin:0 0 8px}
.cta p{margin:0;color:var(--muted);font-size:13px}
footer{border-top:1px solid var(--line);margin-top:40px;background:#fff}
.foot{display:flex;justify-content:space-between;gap:20px;padding:30px 0;flex-wrap:wrap;font-size:12px;color:var(--faint)}
.foot a{color:var(--muted);margin-right:16px}
@media(max-width:980px){
 h1{font-size:42px;letter-spacing:-1.8px}
 .hero-panel{grid-template-columns:1fr;padding:34px 26px;gap:10px}
 .hero-devices{height:330px;margin-top:8px}
 .dev{width:190px}
 .grid3,.shots{grid-template-columns:1fr 1fr}
 .platforms{grid-template-columns:1fr}
 .nav-links a:not(.nav-dl){display:none}
}
@media(max-width:620px){
 .wrap{padding:0 16px}
 h1{font-size:34px}
 .hero-panel{border-radius:24px;padding:26px 20px}
 .hero-devices{height:290px}
 .dev{width:168px}
 .grid3,.shots,.news{grid-template-columns:1fr}
 .section{padding:44px 0 12px}
 .sec-head h2{font-size:26px}
}
</style></head><body>

<nav><div class="wrap"><div class="nav-inner">
  <a class="brand" href="/">
    <?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?>
    <span><?= e($name) ?></span>
  </a>
  <div class="nav-links">
    <a href="#features">功能</a>
    <a href="#shots">界面</a>
    <a href="downloads.php">下载</a>
    <a href="#news">公告</a>
    <a class="nav-dl" href="downloads.php">下载 App</a>
  </div>
</div></div></nav>

<header class="hero"><div class="wrap">
  <div class="hero-panel">
    <div class="hero-copy">
      <span class="eyebrow"><i></i> v<?= e($latestVersion) ?> · Windows / Android 同步</span>
      <h1>把课表<br>装进<em>每一天</em></h1>
      <p class="lede"><?= e($desc) ?></p>
      <div class="actions">
        <a class="btn btn-primary" href="downloads.php">下载客户端</a>
        <a class="btn btn-ghost" href="#features">了解功能</a>
      </div>
      <div class="hero-meta">
        <span><b>离线可用</b> 数据存在本机</span>
        <span><b>双端同步</b> 账号互通</span>
        <span><b>无广告</b> 个人维护</span>
      </div>
    </div>
    <div class="hero-devices">
      <div class="dev one"><img src="assets/shots/home.png" alt="主站"></div>
      <div class="dev two"><img src="assets/shots/schedule.png" alt="课表"></div>
    </div>
  </div>
</div></header>

<section class="section" id="features"><div class="wrap">
  <div class="sec-head"><div><h2>为每天上课的人设计</h2><p>看课、改课、提醒，每一步都尽量少操作。</p></div></div>
  <div class="grid3">
    <div class="card"><div class="icon"><svg viewBox="0 0 24 24"><path d="M8 3v4M16 3v4"/><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18"/></svg></div><h3>单节周课表</h3><p>逐节排列，跨节课程整块显示；非本周淡化，冲突自动并排。</p></div>
    <div class="card"><div class="icon"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg></div><h3>多种导入</h3><p>网页识别、源码粘贴、Excel / CSV / JSON，导入前可逐条编辑。</p></div>
    <div class="card"><div class="icon"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></div><h3>上课提醒</h3><p>本地通知，提前 5/10/15/30 分钟可选，支持后台保活设置。</p></div>
    <div class="card"><div class="icon"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.2-1-1.7-1-2.8 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3Z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="15" cy="8" r="1"/></svg></div><h3>8 套配色</h3><p>主题色全局生效，行高、圆角、透明度、深色模式都能调。</p></div>
    <div class="card"><div class="icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg></div><h3>工具与桌面小组件</h3><p>天气、日历、备忘录、新闻，以及周课表 / 今日课程小组件。</p></div>
    <div class="card"><div class="icon"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><h3>账号与云同步</h3><p>手机与 Windows 共用官网账号，课表、备忘录、日程可云端恢复。</p></div>
  </div>
</div></section>

<section class="section" id="shots"><div class="wrap">
  <div class="sec-head"><div><h2>真正的界面</h2><p>干净、扁平，信息密度刚好。</p></div></div>
  <div class="shots">
    <div class="shot"><img src="assets/shots/schedule.png" alt="周课表"></div>
    <div class="shot"><img src="assets/shots/calendar.png" alt="日历"></div>
    <div class="shot"><img src="assets/shots/tools.png" alt="工具"></div>
  </div>
</div></section>

<section class="section" id="download"><div class="wrap">
  <div class="sec-head"><div><h2>选择你的平台</h2><p>Android 与 Windows 使用同一个账号体系。</p></div></div>
  <div class="platforms">
    <a class="plat" href="downloads.php">
      <div class="pic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg></div>
      <div><h3>Android</h3><p>APK · 支持小组件与通知</p></div>
      <span class="arrow">→</span>
    </a>
    <a class="plat" href="downloads.php">
      <div class="pic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></div>
      <div><h3>Windows</h3><p>便携版 exe · 与手机同步</p></div>
      <span class="arrow">→</span>
    </a>
  </div>
</div></section>

<?php if ($anns): ?>
<section class="section" id="news"><div class="wrap">
  <div class="sec-head"><div><h2>最新公告</h2><p>版本更新与使用说明。</p></div></div>
  <div class="news">
    <?php foreach ($anns as $a): ?>
      <a class="card" href="#news">
        <div class="date"><?= e($a['created_at']) ?><?= $a['pinned'] ? ' · 置顶' : '' ?></div>
        <h3><?= e($a['title']) ?></h3>
        <p><?= $a['content'] ?></p>
      </a>
    <?php endforeach; ?>
  </div>
</div></section>
<?php endif; ?>

<section class="section"><div class="wrap">
  <div class="cta">
    <div><h2>现在就把课表装进口袋</h2><p>Android APK + Windows 便携版 · 完全免费 · 离线可用</p></div>
    <a class="btn btn-primary" href="downloads.php">立即下载</a>
  </div>
</div></section>

<footer><div class="wrap foot">
  <div>© <?= date('Y') ?> <?= e($name) ?> · 由个人开发者独立维护</div>
  <div>
    <a href="downloads.php">下载</a>
    <a href="mailto:<?= e($email) ?>">邮箱</a>
    <span>QQ <?= e($qq) ?></span>
  </div>
</div></footer>
</body></html>
