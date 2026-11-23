<?php
require __DIR__ . '/lib.php';

$name = setting('site_name', '知酷课程表');
$desc = setting('site_desc', '完全离线的课表工具，支持网页/文件导入、桌面小组件、上课提醒与云同步。');
$logo = setting('logo');
$logoText = setting('logo_text') ?: mb_substr($name, 0, 1);
$download = setting('download_url');
$winDownload = setting('download_windows_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/zhiku-desktop-win64.zip';
$keywords = setting('seo_keywords');
$seoDesc = setting('seo_description');
$email = setting('contact_email');
$qq = setting('contact_qq');
$wechat = setting('contact_wechat');
$latestVersion = db()->query("SELECT version FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetchColumn() ?: '1.3.3';
$anns = db()->query('SELECT id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 2')->fetchAll();
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?= e($name) ?> · 清爽好用的离线课表</title>
<meta name="keywords" content="<?= e($keywords) ?>">
<meta name="description" content="<?= e($seoDesc) ?>">
<meta property="og:title" content="<?= e($name) ?>">
<meta property="og:description" content="<?= e($seoDesc) ?>">
<meta property="og:image" content="assets/shots/home.png?v=20261123b">
<style>
:root{--blue:#1a6dff;--blue-dark:#0b4fc7;--blue-soft:#eef4ff;--ink:#16233b;--muted:#5c6b85;--faint:#8a98b0;--line:#e6ecf6;--bg:#fff;--r:18px}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#fff;color:var(--ink);font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.wrap{max-width:1140px;margin:0 auto;padding:0 24px}
/* nav */
header.site{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.9);backdrop-filter:blur(14px);border-bottom:1px solid rgba(230,236,246,.8)}
.nav{height:70px;display:flex;align-items:center;gap:10px}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;font-size:16px;letter-spacing:-.2px}
.brand img{width:34px;height:34px;border-radius:9px;object-fit:cover}
.brand .mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(145deg,#3b82f6,#1a6dff);color:#fff;display:grid;place-items:center;font-weight:800;font-size:15px}
.navlinks{margin-left:auto;display:flex;align-items:center;gap:6px}
.navlinks a{font-size:14px;color:var(--muted);padding:9px 14px;border-radius:10px;font-weight:500}
.navlinks a:hover{color:var(--blue);background:var(--blue-soft)}
.navlinks .cta{background:var(--blue);color:#fff;padding:10px 18px;border-radius:11px;font-weight:650;margin-left:6px}
.navlinks .cta:hover{background:var(--blue-dark);color:#fff}
/* hero */
.hero{padding:78px 0 64px;background:radial-gradient(900px 420px at 88% -10%,rgba(26,109,255,.10),transparent 60%),radial-gradient(700px 380px at 0% 100%,rgba(26,109,255,.06),transparent 60%),#fff}
.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.badge{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;background:var(--blue-soft);color:var(--blue);font-size:13px;font-weight:650}
.badge i{width:7px;height:7px;border-radius:50%;background:#21b26a;display:inline-block}
h1{font-size:clamp(34px,4.8vw,54px);line-height:1.16;letter-spacing:-1.2px;margin:20px 0 16px;font-weight:800}
h1 em{font-style:normal;color:var(--blue)}
.lede{font-size:16px;line-height:1.9;color:var(--muted);max-width:540px;margin:0 0 26px}
.actions{display:flex;gap:12px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:12px;font-weight:650;font-size:15px;transition:transform .15s,background .15s}
.btn:hover{transform:translateY(-2px)}
.btn.primary{background:var(--blue);color:#fff;box-shadow:0 10px 24px rgba(26,109,255,.24)}
.btn.primary:hover{background:var(--blue-dark)}
.btn.outline{background:#fff;color:var(--ink);border:1px solid #dbe4f3}
.btn.outline:hover{border-color:var(--blue);color:var(--blue)}
.stats{display:flex;gap:34px;margin-top:34px;flex-wrap:wrap}
.stat b{display:block;font-size:22px;font-weight:800;line-height:1.3}
.stat span{font-size:12px;color:var(--faint)}
/* phone */
.phone-wrap{display:flex;justify-content:center;position:relative}
.phone{width:300px;height:600px;border-radius:44px;padding:10px;background:linear-gradient(160deg,#dbe6fb,#f4f8ff);box-shadow:0 30px 70px rgba(16,51,120,.18),inset 0 0 0 2px #fff;position:relative;animation:float 6s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.phone:before{content:"";position:absolute;top:20px;left:50%;transform:translateX(-50%);width:82px;height:20px;border-radius:11px;background:#16233b;z-index:3;opacity:.9}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:34px;display:block}
.chip{position:absolute;background:#fff;border:1px solid var(--line);border-radius:13px;padding:10px 14px;box-shadow:0 14px 34px rgba(16,51,120,.12);font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px;color:var(--ink)}
.chip.one{left:-6px;top:90px}
.chip.two{right:-14px;bottom:110px}
.chip .dot{width:8px;height:8px;border-radius:50%;background:#21b26a}
/* sections */
.section{padding:76px 0}
.tint{background:linear-gradient(180deg,#f7faff,#fff)}
.kicker{color:var(--blue);font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase}
.sec-title{font-size:clamp(26px,3.4vw,36px);font-weight:800;letter-spacing:-.6px;margin:10px 0 8px}
.sec-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0 0 30px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;transition:transform .15s,box-shadow .15s}
.card:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(16,51,120,.07)}
.tile{width:48px;height:48px;border-radius:13px;background:var(--blue-soft);display:grid;place-items:center;margin-bottom:14px}
.tile svg{width:22px;height:22px;stroke:var(--blue);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.card h3{font-size:15px;margin:0 0 7px;letter-spacing:-.2px}
.card p{font-size:12.8px;line-height:1.85;color:var(--muted);margin:0}
/* shots */
.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.shot{background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px;box-shadow:0 8px 30px rgba(16,51,120,.04)}
.shot img{width:100%;display:block;border-radius:12px}
/* steps */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.step{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px}
.step .no{width:30px;height:30px;border-radius:9px;background:var(--blue);color:#fff;display:grid;place-items:center;font-size:13px;font-weight:700;margin-bottom:12px}
.step h3{font-size:14px;margin:0 0 6px}
.step p{font-size:12px;line-height:1.8;color:var(--muted);margin:0}
/* downloads */
.platforms{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.plat{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;transition:transform .15s,box-shadow .15s}
.plat:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(16,51,120,.07)}
.plat .pic{width:50px;height:50px;border-radius:14px;background:var(--blue-soft);display:grid;place-items:center;flex:none}
.plat h3{font-size:15px;margin:0 0 4px}
.plat p{font-size:11.8px;color:var(--faint);margin:0}
.plat .arrow{margin-left:auto;color:var(--blue);font-size:18px}
/* faq */
.faq{display:grid;grid-template-columns:1fr 1fr;gap:12px}
details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px}
summary{cursor:pointer;font-size:13.5px;font-weight:650;list-style:none;display:flex;justify-content:space-between;gap:12px}
summary:after{content:"+";color:var(--blue);font-weight:600}
details[open] summary:after{content:"−"}
details p{font-size:12.5px;line-height:1.85;color:var(--muted);margin:10px 0 0}
/* cta */
.cta{background:linear-gradient(135deg,#1a6dff,#4f8cff);border-radius:24px;color:#fff;padding:44px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;box-shadow:0 24px 60px rgba(26,109,255,.24)}
.cta h2{font-size:28px;letter-spacing:-.6px;margin:0 0 8px}
.cta p{margin:0;font-size:13.5px;opacity:.85}
.cta .btn{background:#fff;color:var(--blue)}
/* footer */
footer{border-top:1px solid var(--line);margin-top:70px;background:#fff}
.foot{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:28px;padding:42px 0 26px}
.foot .brand{margin-bottom:10px}
.foot p{font-size:12px;color:var(--faint);line-height:1.9;margin:0}
.foot h4{font-size:12px;margin:2px 0 12px;color:var(--ink)}
.foot a{display:block;font-size:12px;color:var(--muted);margin-bottom:9px}
.foot a:hover{color:var(--blue)}
.bottom{border-top:1px solid var(--line);padding:16px 0;font-size:11.5px;color:var(--faint);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:960px){.hero-grid{grid-template-columns:1fr;gap:28px}.phone-wrap{order:2}.grid3,.steps{grid-template-columns:1fr 1fr}.shots{grid-template-columns:1fr}.foot{grid-template-columns:1fr 1fr}.navlinks a:not(.cta){display:none}}
@media(max-width:620px){.wrap{padding:0 16px}.hero{padding:48px 0 40px}.grid3,.steps,.platforms,.faq{grid-template-columns:1fr}.phone{width:260px;height:520px}.chip.one{left:-2px}.chip.two{right:-2px}.cta{padding:30px 24px}.cta h2{font-size:24px}.section{padding:52px 0}.nav{height:62px}}
</style></head><body>

<header class="site"><div class="wrap"><div class="nav">
  <a class="brand" href="/">
    <?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?>
    <span><?= e($name) ?></span>
  </a>
  <nav class="navlinks">
    <a href="#features">功能</a>
    <a href="#shots">界面</a>
    <a href="downloads.php">下载</a>
    <a href="#faq">常见问题</a>
    <a class="cta" href="downloads.php">免费下载</a>
  </nav>
</div></div></header>

<section class="hero"><div class="wrap"><div class="hero-grid">
  <div>
    <span class="badge"><i></i> v<?= e($latestVersion) ?> 正式版 · Windows / Android</span>
    <h1>把课表<br><em>装进每一天</em></h1>
    <p class="lede"><?= e($desc) ?></p>
    <div class="actions">
      <a class="btn primary" href="<?= e($download) ?>">下载安卓客户端</a>
      <a class="btn outline" href="downloads.php">Windows 版</a>
    </div>
    <div class="stats">
      <div class="stat"><b>双端</b><span>账号云端同步</span></div>
      <div class="stat"><b>离线</b><span>数据保存在本机</span></div>
      <div class="stat"><b>免费</b><span>无广告、无内购</span></div>
    </div>
  </div>
  <div class="phone-wrap">
    <div class="phone"><img src="assets/shots/home.png?v=20261123b" alt="知酷课程表主站"></div>
    <div class="chip one"><span class="dot"></span> 今日 3 节课</div>
    <div class="chip two">第 12 周 · 周三</div>
  </div>
</div></div></section>

<section class="section tint" id="features"><div class="wrap">
  <div class="kicker">Platform</div>
  <h2 class="sec-title">围绕课表，做好每一件小事</h2>
  <p class="sec-sub">从导入、查看、提醒到换设备恢复，覆盖每天上课会用到的场景。</p>
  <div class="grid3">
    <div class="card"><div class="tile"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></div><h3>单节周课表</h3><p>逐节排列，跨节课程整块显示；非本周课程淡化，时间冲突自动并排。</p></div>
    <div class="card"><div class="tile"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg></div><h3>多种导入方式</h3><p>网页教务系统识别、粘贴源码、Excel / CSV / JSON 文件，导入前可逐条修改。</p></div>
    <div class="card"><div class="tile"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></div><h3>上课提醒</h3><p>本地通知，提前 5 / 10 / 15 / 30 分钟可选，支持后台保活与开机自启。</p></div>
    <div class="card"><div class="tile"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.2-1-1.7-1-2.8 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3Z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="15" cy="8" r="1"/></svg></div><h3>8 套主题配色</h3><p>主题色全局生效，行高、圆角、透明度、深色模式都可以自己调。</p></div>
    <div class="card"><div class="tile"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg></div><h3>工具与桌面小组件</h3><p>天气、日历、备忘录、每日新闻，以及今日课程 / 周课表小组件。</p></div>
    <div class="card"><div class="tile"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><h3>账号与云同步</h3><p>手机与 Windows 共用官网账号，课表、备忘录、日程可云端备份与恢复。</p></div>
  </div>
</div></section>

<section class="section" id="shots"><div class="wrap">
  <div class="kicker">Screens</div>
  <h2 class="sec-title">真正的界面</h2>
  <p class="sec-sub">干净、扁平，信息密度刚好；深浅色都耐看。</p>
  <div class="shots">
    <div class="shot"><img src="assets/shots/schedule.png?v=20261123b" alt="周课表"></div>
    <div class="shot"><img src="assets/shots/calendar.png?v=20261123b" alt="日历"></div>
    <div class="shot"><img src="assets/shots/tools.png?v=20261123b" alt="工具"></div>
  </div>
</div></section>

<section class="section tint"><div class="wrap">
  <div class="kicker">Quick start</div>
  <h2 class="sec-title">四步开始用</h2>
  <p class="sec-sub">安装完成后，一分钟就能看到自己的课表。</p>
  <div class="steps">
    <div class="step"><div class="no">1</div><h3>下载安装</h3><p>从下载页获取 APK 或 Windows 便携版，按提示完成安装。</p></div>
    <div class="step"><div class="no">2</div><h3>登录账号</h3><p>注册或登录官网账号，手机与电脑使用同一个账号。</p></div>
    <div class="step"><div class="no">3</div><h3>导入课表</h3><p>网页识别、源码、Excel / CSV / JSON 都可以，导入前可预览修改。</p></div>
    <div class="step"><div class="no">4</div><h3>开启提醒</h3><p>在「我的」里打开上课提醒与后台保活，剩下的交给 App。</p></div>
  </div>
</div></section>

<section class="section" id="download"><div class="wrap">
  <div class="kicker">Download</div>
  <h2 class="sec-title">选择你的平台</h2>
  <p class="sec-sub">Android 与 Windows 使用同一个官网账号，数据互通。</p>
  <div class="platforms">
    <a class="plat" href="downloads.php">
      <div class="pic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a6dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg></div>
      <div><h3>Android</h3><p>APK · 小组件与通知</p></div>
      <span class="arrow">→</span>
    </a>
    <a class="plat" href="downloads.php">
      <div class="pic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a6dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></div>
      <div><h3>Windows</h3><p>便携版 exe · 与手机同步</p></div>
      <span class="arrow">→</span>
    </a>
  </div>
</div></section>

<section class="section tint" id="faq"><div class="wrap">
  <div class="kicker">FAQ</div>
  <h2 class="sec-title">常见问题</h2>
  <p class="sec-sub">还有问题可以到「联系作者」或工单反馈。</p>
  <div class="faq">
    <details open><summary>课表数据会上传到服务器吗？</summary><p>课表默认只保存在本机。登录账号后，可以手动或自动把课表、备忘录、日程同步到官网数据库，方便换设备恢复。</p></details>
    <details><summary>Windows 版需要安装吗？</summary><p>不需要。下载 ZIP 解压后双击「知酷课程表.exe」即可运行，不写注册表，删除文件夹就卸载。</p></details>
    <details><summary>换手机后怎么恢复课表？</summary><p>登录同一账号，在「账号 → 从云端恢复」选择云端备份即可；建议换机前先在旧设备点一次「上传当前数据」。</p></details>
    <details><summary>提醒不准时怎么办？</summary><p>在系统设置里允许通知，并在「我的 → 后台保活」中关闭电池优化、允许自启动；部分品牌还需要锁定后台。</p></details>
  </div>
</div></section>

<?php if ($anns): ?>
<section class="section"><div class="wrap">
  <div class="kicker">News</div>
  <h2 class="sec-title">最新公告</h2>
  <div class="grid3">
    <?php foreach ($anns as $a): ?>
      <div class="card">
        <p style="font-size:11px;color:#8a98b0;margin-bottom:8px"><?= e($a['created_at']) ?><?= $a['pinned'] ? ' · 置顶' : '' ?></p>
        <h3><?= e($a['title']) ?></h3>
        <p><?= e(mb_substr(strip_tags($a['content']), 0, 90)) ?></p>
      </div>
    <?php endforeach; ?>
  </div>
</div></section>
<?php endif; ?>

<section class="section"><div class="wrap">
  <div class="cta">
    <div><h2>现在，把课表装进口袋</h2><p>Android APK + Windows 便携版 · 免费 · 离线可用 · 双端同步</p></div>
    <a class="btn" href="downloads.php">立即下载</a>
  </div>
</div></section>

<footer><div class="wrap">
  <div class="foot">
    <div>
      <div class="brand"><?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?><span><?= e($name) ?></span></div>
      <p>面向大学生的离线课表工具。<br>由个人开发者独立维护。</p>
    </div>
    <div><h4>产品</h4><a href="#features">功能特性</a><a href="#shots">界面截图</a><a href="downloads.php">下载客户端</a></div>
    <div><h4>支持</h4><a href="#faq">常见问题</a><a href="mailto:<?= e($email) ?>">联系作者</a><a href="downloads.php">安装说明</a></div>
    <div><h4>联系</h4><a href="mailto:<?= e($email) ?>"><?= e($email) ?></a><a href="#">QQ <?= e($qq) ?></a><a href="#">微信 <?= e($wechat) ?></a></div>
  </div>
  <div class="bottom"><span>© <?= date('Y') ?> <?= e($name) ?> · 非官方学生作品</span><span>Made with PHP · 数据以学校教务系统为准</span></div>
</div></footer>
</body></html>