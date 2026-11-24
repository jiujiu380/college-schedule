<?php
require __DIR__ . '/lib.php';

$name = setting('site_name', '知酷课程表');
$desc = setting('site_desc', '为大学生打造的离线课表工具：单节课表、作业 DDL、考试倒计时、上课提醒、课表分享与双端云同步。');
$logo = setting('logo');
$logoText = setting('logo_text') ?: mb_substr($name, 0, 1);
$android = setting('download_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/app-release.apk';
$windows = setting('download_windows_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/zhiku-desktop-win64.zip';
$keywords = setting('seo_keywords');
$seoDesc = setting('seo_description') ?: $desc;
$email = setting('contact_email');
$qq = setting('contact_qq');
$wechat = setting('contact_wechat');
$latestVersion = db()->query("SELECT version FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetchColumn() ?: '1.3.8';
$anns = db()->query('SELECT id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 2')->fetchAll();
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?= e($name) ?> · 大学生课表与学习管理</title>
<meta name="keywords" content="<?= e($keywords) ?>">
<meta name="description" content="<?= e($seoDesc) ?>">
<meta property="og:title" content="<?= e($name) ?>">
<meta property="og:description" content="<?= e($seoDesc) ?>">
<meta property="og:image" content="assets/shots/home.png?v=20261124c">
<style>
:root{
  --ink:#0B1220;--muted:#5B6577;--faint:#8B95A7;--line:#E7EAF1;--bg:#F7F8FB;--card:#FFFFFF;
  --blue:#2563EB;--blue2:#4F46E5;--soft:#EEF3FF;--dark:#080D18;
  --r:20px;--shadow:0 18px 50px rgba(13,25,55,.08);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased;line-height:1.5}
a{color:inherit;text-decoration:none}
img{max-width:100%}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
/* nav */
.nav-shell{position:sticky;top:12px;z-index:80}
.nav{height:66px;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.9);backdrop-filter:saturate(180%) blur(20px);border:1px solid rgba(231,234,241,.9);border-radius:18px;padding:0 18px;box-shadow:0 10px 30px rgba(13,25,55,.06)}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;font-size:15.5px;letter-spacing:-.2px}
.brand img{width:34px;height:34px;border-radius:10px;object-fit:cover}
.brand .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(145deg,#3B82F6,#1D4ED8);color:#fff;display:grid;place-items:center;font-weight:800;font-size:15px;box-shadow:0 6px 16px rgba(37,99,235,.28)}
.nav-links{margin-left:auto;display:flex;align-items:center;gap:4px}
.nav-links a{font-size:13.5px;color:var(--muted);padding:9px 13px;border-radius:9px;font-weight:500}
.nav-links a:hover{color:var(--blue);background:var(--soft)}
.nav-cta{background:var(--ink)!important;color:#fff!important;padding:10px 17px!important;border-radius:10px!important;font-weight:650!important;margin-left:6px}
/* hero */
.hero{padding:26px 0 0}
.hero-card{position:relative;overflow:hidden;border-radius:32px;background:var(--dark);color:#fff;padding:62px 58px 54px;display:grid;grid-template-columns:1.04fr .96fr;gap:30px;align-items:center;box-shadow:0 40px 100px rgba(8,13,24,.28)}
.hero-card:before{content:"";position:absolute;width:720px;height:720px;right:-240px;top:-380px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,.55),transparent 64%)}
.hero-card:after{content:"";position:absolute;width:560px;height:560px;left:-300px;bottom:-340px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.38),transparent 66%)}
.hero-copy{position:relative;z-index:2}
.eyebrow{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border-radius:999px;background:rgba(37,99,235,.16);border:1px solid rgba(122,162,255,.2);color:#C7D8FF;font-size:12px;font-weight:600}
.eyebrow i{width:6px;height:6px;border-radius:50%;background:#34D399;display:inline-block}
h1{font-size:clamp(36px,4.6vw,58px);line-height:1.08;letter-spacing:-2.2px;margin:22px 0 18px;font-weight:820}
h1 em{font-style:normal;background:linear-gradient(95deg,#8FB6FF,#B69CFF);-webkit-background-clip:text;background-clip:text;color:transparent}
.lede{font-size:15px;line-height:1.95;color:rgba(255,255,255,.66);max-width:470px;margin:0 0 26px}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 22px;border-radius:11px;font-weight:650;font-size:14.5px;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}
.btn:hover{transform:translateY(-2px)}
.btn.blue{background:linear-gradient(135deg,#2563EB,#4F46E5);color:#fff;box-shadow:0 14px 30px rgba(37,99,235,.38)}
.btn.glass{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#fff}
.btn.ghost{background:#fff;border:1px solid var(--line);color:var(--ink)}
.btn.dark{background:var(--ink);color:#fff}
.hero-points{display:flex;gap:20px;flex-wrap:wrap;margin-top:26px;font-size:11.5px;color:rgba(255,255,255,.48)}
.hero-points span{display:flex;align-items:center;gap:6px}
.hero-points b{color:rgba(255,255,255,.82);font-weight:600}
.hero-visual{position:relative;z-index:2;min-height:470px;display:flex;align-items:center;justify-content:center}
.phone{position:relative;width:270px;height:560px;border-radius:42px;padding:9px;background:linear-gradient(160deg,#DCE7FB,#F5F8FF);box-shadow:0 34px 80px rgba(0,0,0,.45),inset 0 0 0 2px #fff;transform:rotate(-3deg);animation:float 7s ease-in-out infinite}
@keyframes float{0%,100%{transform:rotate(-3deg) translateY(0)}50%{transform:rotate(-3deg) translateY(-10px)}}
.phone:before{content:"";position:absolute;top:19px;left:50%;transform:translateX(-50%);width:76px;height:19px;border-radius:10px;background:#0B1220;z-index:3;opacity:.92}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:34px;display:block}
.float-card{position:absolute;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);color:var(--ink);border-radius:13px;padding:11px 14px;box-shadow:0 16px 40px rgba(0,0,0,.25);font-size:11px;display:flex;align-items:center;gap:9px;border:1px solid rgba(255,255,255,.7)}
.float-card b{display:block;font-size:11.5px;font-weight:700}
.float-card span{display:block;font-size:9.5px;color:var(--faint);margin-top:2px}
.fc-one{left:-26px;top:72px;transform:rotate(2deg)}
.fc-two{right:-34px;top:230px;transform:rotate(-2deg)}
.fc-three{left:-14px;bottom:78px;transform:rotate(1.5deg)}
.fc-icon{width:30px;height:30px;border-radius:9px;background:var(--soft);display:grid;place-items:center;flex:none}
.fc-icon svg{width:16px;height:16px;stroke:var(--blue);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
/* trust */
.trust{margin-top:16px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--muted)}
.trust b{font-size:14px;color:var(--ink);font-weight:800;margin-right:5px}
.trust div{display:flex;align-items:center;gap:6px}
/* sections */
.section{padding:76px 0 0}
.kicker{font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--blue)}
h2{font-size:clamp(26px,3.2vw,38px);line-height:1.18;letter-spacing:-1px;margin:12px 0 10px;font-weight:800}
.sec-sub{font-size:13.5px;line-height:1.9;color:var(--muted);max-width:620px;margin:0 0 28px}
/* bento */
.bento{display:grid;grid-template-columns:repeat(12,1fr);gap:14px}
.b{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:22px;position:relative;overflow:hidden}
.b.large{grid-column:span 12;padding:34px;display:grid;grid-template-columns:1.05fr .95fr;gap:20px;align-items:center;overflow:hidden;min-height:560px}
.b.medium{grid-column:span 3}
.b.small{grid-column:span 3}
.b.share{grid-column:span 4}
.b.tall{grid-column:span 4}
.b-head{padding:22px 24px 0}
.b h3{font-size:15px;margin:0 0 7px;letter-spacing:-.2px}
.b p{font-size:12px;line-height:1.8;color:var(--muted);margin:0}
.b.large .b-head{padding:0;max-width:420px}
.b .shot{margin:16px 18px 0;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:#F2F5FB}
.feat-shot{position:relative;display:flex;justify-content:center;align-items:center}
.feat-phone{width:252px;height:520px;border-radius:38px;padding:8px;background:linear-gradient(160deg,#DCE7FB,#F5F8FF);box-shadow:0 26px 60px rgba(16,51,120,.20),inset 0 0 0 2px #fff;transform:rotate(2deg)}
.feat-phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:30px;display:block}
.feat-chip{position:absolute;right:-4px;bottom:34px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 11px;font-size:10px;color:var(--muted);box-shadow:0 12px 28px rgba(13,25,55,.10)}
.b .shot img{display:block;width:100%}
.b .icon{width:38px;height:38px;border-radius:11px;background:var(--soft);display:grid;place-items:center;margin-bottom:12px}
.b .icon svg{width:19px;height:19px;stroke:var(--blue);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.chips span{font-size:10px;color:var(--muted);background:#F4F7FC;border:1px solid #E9EFF9;padding:5px 9px;border-radius:7px}
.b.dark .chips span{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1);color:rgba(255,255,255,.65)}
.bullets{margin:14px 0 0;padding:0;list-style:none}
.bullets li{font-size:11.5px;color:var(--muted);line-height:1.9;display:flex;gap:7px}
.bullets li:before{content:"";width:5px;height:5px;border-radius:50%;background:var(--blue);margin-top:7px;flex:none}
.b.dark .bullets li{color:rgba(255,255,255,.62)}
.b.dark .bullets li:before{background:#8FB6FF}
.mini-row{display:flex;gap:14px;margin-top:16px;font-size:10px;color:var(--faint)}
.mini-row span{display:flex;align-items:center;gap:4px}
.mini-row span:before{content:"";width:4px;height:4px;border-radius:50%;background:#C6D1E4}
.b .tag{display:inline-block;font-size:10px;color:var(--blue);background:var(--soft);padding:3px 8px;border-radius:5px;margin-bottom:9px;font-weight:600}
.b.dark{background:var(--dark);border-color:var(--dark);color:#fff}
.b.dark p{color:rgba(255,255,255,.6)}
.b.dark .icon{background:rgba(37,99,235,.18)}
.b.dark .icon svg{stroke:#8FB6FF}
/* flow */
.flow{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.step{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px}
.step .num{font-size:11px;font-weight:800;color:var(--blue);letter-spacing:1px;margin-bottom:12px}
.step h3{font-size:14px;margin:0 0 6px}
.step p{font-size:11.5px;line-height:1.8;color:var(--muted);margin:0}
/* gallery */
.gallery-shell{background:linear-gradient(180deg,#F1F5FD,#F7F8FB);border-radius:28px;padding:32px 24px;border:1px solid #E6EDFA}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.gitem{text-align:center}
.gitem .frame{background:#fff;border:1px solid var(--line);border-radius:20px;padding:10px;box-shadow:var(--shadow)}
.gitem img{display:block;width:100%;border-radius:13px}
.gitem .cap{font-size:12px;font-weight:600;margin-top:10px}
.gitem .cap span{font-weight:400;color:var(--faint);font-size:10.5px;display:block;margin-top:2px}
/* platforms */
.platforms{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.plat{background:#fff;border:1px solid var(--line);border-radius:20px;padding:25px;display:flex;align-items:center;gap:16px;transition:transform .16s ease,box-shadow .16s ease}
.plat:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
.plat .p-icon{width:50px;height:50px;border-radius:14px;background:var(--soft);display:grid;place-items:center;flex:none}
.plat .p-icon svg{width:24px;height:24px;stroke:var(--blue);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.plat h3{font-size:15px;margin:0 0 4px}
.plat p{font-size:11.5px;color:var(--faint);margin:0}
.plat .arrow{margin-left:auto;color:var(--blue);font-size:20px}
/* trust band */
.band{background:var(--dark);color:#fff;border-radius:24px;padding:34px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.band .cell b{font-size:22px;font-weight:800;display:block;letter-spacing:-.5px}
.band .cell span{font-size:11px;color:rgba(255,255,255,.52);display:block;margin-top:5px;line-height:1.7}
/* faq */
.faq{display:grid;grid-template-columns:1fr 1fr;gap:12px}
details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 18px}
summary{cursor:pointer;font-size:13.5px;font-weight:650;list-style:none;display:flex;justify-content:space-between;gap:12px}
summary::-webkit-details-marker{display:none}
summary:after{content:"+";color:var(--blue);font-weight:600}
details[open] summary:after{content:"−"}
details p{font-size:12.5px;line-height:1.9;color:var(--muted);margin:10px 0 0}
/* cta */
.cta{position:relative;overflow:hidden;border-radius:26px;background:linear-gradient(120deg,#1D4ED8,#4F46E5 70%,#7C3AED);color:#fff;padding:42px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;box-shadow:0 26px 70px rgba(37,99,235,.28)}
.cta h2{color:#fff;margin:0 0 8px;font-size:28px}
.cta p{margin:0;font-size:13px;color:rgba(255,255,255,.78)}
.cta .btn{background:#fff;color:var(--blue)}
/* footer */
footer{margin-top:72px;background:#fff;border-top:1px solid var(--line)}
.foot{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:26px;padding:44px 0 30px}
.foot .brand{margin-bottom:10px}
.foot p{font-size:11.5px;line-height:1.9;color:var(--faint);margin:0}
.foot h4{font-size:11.5px;margin:0 0 12px;color:var(--ink);letter-spacing:.2px}
.foot a{display:block;font-size:11.5px;color:var(--muted);margin-bottom:9px}
.foot a:hover{color:var(--blue)}
.bottom{border-top:1px solid var(--line);padding:16px 0;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:10.5px;color:var(--faint)}
@media(max-width:980px){
 .hero-card{grid-template-columns:1fr;padding:36px 26px 30px}
 .hero-visual{min-height:400px;margin-top:8px}
 .b.large,.b.medium,.b.small,.b.share,.b.tall{grid-column:span 12}
 .b.large{grid-template-columns:1fr;gap:10px;padding:24px 20px;min-height:0}
 .b.large .b-head{padding:0;max-width:none}
 .feat-phone{width:210px;height:434px}
 .feat-chip{right:0;bottom:10px}
 .flow{grid-template-columns:1fr 1fr}
 .gallery{grid-template-columns:1fr}
 .platforms{grid-template-columns:1fr}
 .band{grid-template-columns:1fr 1fr}
 .nav-links a:not(.nav-cta){display:none}
}
@media(max-width:620px){
 .wrap{padding:0 16px}
 .nav-shell{top:8px}
 .hero{padding-top:18px}
 .hero-card{border-radius:22px;padding:28px 20px}
 h1{font-size:34px;letter-spacing:-1.2px}
 .phone{width:230px;height:478px}
 .float-card{font-size:10px;padding:9px 11px}
 .fc-one{left:-8px}.fc-two{right:-8px}.fc-three{left:-4px}
 .section{padding:52px 0 0}
 .faq{grid-template-columns:1fr}
 .band{padding:24px}
 .cta{padding:28px 22px}
 .foot{grid-template-columns:1fr 1fr}
 .b.large .shot{margin:12px 12px 0}
}
</style></head><body>

<div class="nav-shell"><div class="wrap"><nav class="nav">
  <a class="brand" href="/"><?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?><span><?= e($name) ?></span></a>
  <div class="nav-links">
    <a href="#features">功能</a><a href="#screens">界面</a><a href="#platforms">下载</a><a href="#faq">常见问题</a>
    <a class="nav-cta" href="downloads.php">下载客户端</a>
  </div>
</nav></div></div>

<header class="hero"><div class="wrap">
  <div class="hero-card">
    <div class="hero-copy">
      <span class="eyebrow"><i></i> v<?= e($latestVersion) ?> 正式版 · Android / Windows</span>
      <h1>把大学课表<br><em>装进每一天</em></h1>
      <p class="lede"><?= e($desc) ?></p>
      <div class="hero-actions">
        <a class="btn blue" href="downloads.php">下载客户端</a>
        <a class="btn glass" href="#features">查看全部功能</a>
      </div>
      <div class="hero-points">
        <span><b>离线优先</b> 课表只存本机</span>
        <span><b>双端同步</b> 账号互通</span>
        <span><b>无广告</b> 个人项目</span>
      </div>
    </div>
    <div class="hero-visual">
      <div class="phone"><img src="assets/shots/home.png?v=20261124c" alt="知酷课程表主站"></div>
      <div class="float-card fc-one"><div class="fc-icon"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><div><b>作业 DDL</b><span>高数习题 · 明天截止</span></div></div>
      <div class="float-card fc-two"><div class="fc-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><div><b>考试倒计时</b><span>距离高数期末 6 天</span></div></div>
      <div class="float-card fc-three"><div class="fc-icon"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></div><div><b>第 12 周 · 周一</b><span>今天 3 节课</span></div></div>
    </div>
  </div>
  <div class="trust">
    <div><b>单节</b>周课表</div><div><b>8 套</b>主题配色</div><div><b>4 种</b>导入方式</div><div><b>2 端</b>账号同步</div><div><b>0</b>广告与内购</div>
  </div>
</div></header>

<section class="section" id="features"><div class="wrap">
  <div class="kicker">Features</div>
  <h2>一张课表，接住整个学期</h2>
  <p class="sec-sub">从导入、查看、提醒，到作业、考试、分享与导出，围绕每天上课的真实流程设计。</p>
  <div class="bento">
    <div class="b large">
      <div class="b-head"><span class="tag">核心课表</span><h3>逐节课表，信息一眼看清</h3><p>按单节排列，跨节课程整块显示；时间冲突自动并排，非本周课程淡化并用气泡标出周次。</p><div class="chips"><span>单节网格</span><span>冲突并排</span><span>跨节整块</span><span>非本周淡化</span></div><div class="mini-row"><span>切换周次</span><span>回到今日</span><span>调课</span></div></div>
      <div class="feat-shot"><div class="feat-phone"><img src="assets/shots/schedule.png?v=20261124c" alt="周课表"></div><span class="feat-chip">冲突自动并排 · 非本周淡化</span></div>
    </div>
    <div class="b medium"><div class="icon"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg></div><h3>四种导入方式</h3><p>网页教务系统识别、粘贴源码、Excel / CSV / JSON、手动新建。导入前可逐条修改课程与课表名。</p><div class="chips"><span>网页识别</span><span>源码</span><span>Excel</span><span>CSV</span><span>JSON</span></div></div>
    <div class="b medium"><div class="icon"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></div><h3>上课提醒</h3><p>本地通知，提前 5 / 10 / 15 / 30 分钟可选；支持后台保活、电池优化与开机自启设置。</p><div class="chips"><span>提前 5 分钟</span><span>提前 10 分钟</span><span>提前 15 分钟</span><span>提前 30 分钟</span></div></div>
    <div class="b small"><div class="icon"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div><h3>作业 DDL</h3><p>作业按截止时间排序，逾期和三天内截止标红，课程详情里添加的作业自动汇总。</p></div>
    <div class="b small"><div class="icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><h3>考试倒计时</h3><p>最近一场考试显示天 / 时 / 分倒计时，首页同步提醒，复习节奏更从容。</p></div>
    <div class="b small share"><div class="icon"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.7 6.8-4.4M8.6 13.3l6.8 4.4"/></svg></div><h3>课表分享</h3><p>生成二维码或分享码，同学导入后新增一张课表，不覆盖原数据；课程多时自动提示用分享码。</p></div>
    <div class="b tall"><div class="icon"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.2-1-1.7-1-2.8 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3Z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="15" cy="8" r="1"/></svg></div><h3>8 套主题，深浅都好用</h3><p>主题色全局生效，行高、圆角、透明度、分割线都能调；深色模式与玻璃底栏一起适配。</p><div class="chips"><span>经典蓝</span><span>薄荷绿</span><span>琥珀</span><span>紫罗兰</span><span>玫瑰</span><span>海洋</span><span>森林</span><span>极简</span></div></div>
    <div class="b tall dark"><div class="icon"><svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="7"/></svg></div><h3>学习闭环，不止课表</h3><p>作业 DDL、考试倒计时、每日新闻、备忘录、日历与天气提醒串在一起。</p><ul class="bullets"><li>每天 07:00 推送今天几节课 + 天气</li><li>作业按 DDL 排序，逾期标红</li><li>最近考试天 / 时 / 分倒计时</li><li>课表分享、图片 / PDF / 日历导出</li></ul></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="kicker">Workflow</div>
  <h2>四步开始，一分钟看到课表</h2>
  <p class="sec-sub">不依赖学校接口，打开就能用；有课表文件或教务网页都可以导入。</p>
  <div class="flow">
    <div class="step"><div class="num">STEP 01</div><h3>下载安装</h3><p>Android APK 或 Windows 便携版，解压即用，不写注册表。</p></div>
    <div class="step"><div class="num">STEP 02</div><h3>导入课表</h3><p>网页识别、源码、Excel / CSV / JSON，导入前可预览修改。</p></div>
    <div class="step"><div class="num">STEP 03</div><h3>登录同步</h3><p>手机与电脑共用一个账号，课表、备忘录、日程可云端恢复。</p></div>
    <div class="step"><div class="num">STEP 04</div><h3>开启提醒</h3><p>上课提醒、作业截止、考试倒计时与每日早间天气课程提醒。</p></div>
  </div>
</div></section>

<section class="section" id="screens"><div class="wrap">
  <div class="gallery-shell">
    <div class="kicker">Screens</div>
    <h2>真正的界面，而不是效果图</h2>
    <p class="sec-sub">主站、周课表、工具页全部来自当前版本截图。</p>
    <div class="gallery">
      <div class="gitem"><div class="frame"><img src="assets/shots/home.png?v=20261124c" alt="主站"></div><div class="cap">主站<span>今日课程 · 每日一言 · 最近考试</span></div></div>
      <div class="gitem"><div class="frame"><img src="assets/shots/schedule.png?v=20261124c" alt="周课表"></div><div class="cap">周课表<span>单节网格 · 冲突并排 · 非本周淡化</span></div></div>
      <div class="gitem"><div class="frame"><img src="assets/shots/tools.png?v=20261124c" alt="工具"></div><div class="cap">工具<span>DDL · 考试 · 分享 · 导出 · 天气</span></div></div>
    </div>
  </div>
</div></section>

<section class="section" id="platforms"><div class="wrap">
  <div class="kicker">Download</div>
  <h2>手机和电脑，同一张课表</h2>
  <p class="sec-sub">Android 与 Windows 使用同一个官网账号，换设备可恢复课表、备忘录与日程。</p>
  <div class="platforms">
    <a class="plat" href="<?= e($android) ?>">
      <div class="p-icon"><svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg></div>
      <div><h3>Android</h3><p>APK · 约 38 MB · 小组件与通知</p></div><span class="arrow">→</span>
    </a>
    <a class="plat" href="<?= e($windows) ?>">
      <div class="p-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></div>
      <div><h3>Windows</h3><p>便携版 ZIP · 约 118 MB · 免安装</p></div><span class="arrow">→</span>
    </a>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="band">
    <div class="cell"><b>离线优先</b><span>默认不上传课表，数据保存在本机；云同步需要手动开启或登录。</span></div>
    <div class="cell"><b>双端账号</b><span>手机与 Windows 共用官网账号，课表、备忘录、日程可恢复。</span></div>
    <div class="cell"><b>持续更新</b><span>启动自动检测新版本，有更新时弹窗提示，不打扰日常使用。</span></div>
    <div class="cell"><b>公益入口</b><span>内置寻亲与公益捐赠官方渠道汇总，不代收任何款项。</span></div>
  </div>
</div></section>

<?php if ($anns): ?>
<section class="section" id="news"><div class="wrap">
  <div class="kicker">News</div>
  <h2>最新动态</h2>
  <div class="faq">
    <?php foreach ($anns as $a): ?>
      <div class="b">
        <p style="font-size:10.5px;color:#8B95A7;margin-bottom:7px"><?= e($a['created_at']) ?><?= $a['pinned'] ? ' · 置顶' : '' ?></p>
        <h3><?= e($a['title']) ?></h3>
        <p><?= e(mb_substr(strip_tags($a['content']), 0, 110)) ?></p>
      </div>
    <?php endforeach; ?>
  </div>
</div></section>
<?php endif; ?>

<section class="section" id="faq"><div class="wrap">
  <div class="kicker">FAQ</div>
  <h2>常见问题</h2>
  <p class="sec-sub">更多问题可以在 App 内提交工单，或直接联系开发者。</p>
  <div class="faq">
    <details open><summary>课表数据会上传到服务器吗？</summary><p>课表默认只保存在本机。登录账号后，可以手动或自动把课表、备忘录、日程同步到官网数据库，用于换设备恢复；不登录也能完整使用。</p></details>
    <details><summary>需要学校教务系统接口吗？</summary><p>不强制。支持网页识别、源码粘贴、Excel / CSV / JSON 导入；没有电子课表也可以手动新建。</p></details>
    <details><summary>Windows 版需要安装吗？</summary><p>不需要。下载 ZIP 解压后运行「知酷课程表.exe」即可，不写注册表，删除文件夹就卸载。</p></details>
    <details><summary>换手机后怎么恢复课表？</summary><p>登录同一账号，在「账号 → 从云端恢复」选择备份；建议换机前先在旧设备点一次「上传当前数据」。</p></details>
    <details><summary>提醒不准时怎么办？</summary><p>允许通知权限，并在「我的 → 后台保活」关闭电池优化、允许自启动；部分品牌还需要锁定后台。</p></details>
    <details><summary>导出与日历会修改课表吗？</summary><p>不会。导出图片 / PDF、写入系统日历、生成 .ics 都只是读取当前课表，不会改动原有数据。</p></details>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="cta">
    <div><h2>现在，把课表装进口袋</h2><p>Android + Windows · 免费 · 离线可用 · 双端同步</p></div>
    <a class="btn" href="downloads.php">立即下载</a>
  </div>
</div></section>

<footer><div class="wrap">
  <div class="foot">
    <div>
      <div class="brand"><?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?><span><?= e($name) ?></span></div>
      <p>面向大学生的离线课表与学习管理工具。<br>由个人开发者独立维护，无广告、无内购。</p>
    </div>
    <div><h4>产品</h4><a href="#features">功能特性</a><a href="#screens">界面截图</a><a href="downloads.php">下载客户端</a></div>
    <div><h4>支持</h4><a href="#faq">常见问题</a><a href="mailto:<?= e($email) ?>">联系作者</a><a href="downloads.php">安装说明</a></div>
    <div><h4>联系</h4><a href="mailto:<?= e($email) ?>"><?= e($email) ?></a><a href="#">QQ <?= e($qq) ?></a><a href="#">微信 <?= e($wechat) ?></a></div>
  </div>
  <div class="bottom"><span>© <?= date('Y') ?> <?= e($name) ?>. All rights reserved.</span><span>非官方学生作品 · 课表以学校教务系统为准</span></div>
</div></footer>
</body></html>