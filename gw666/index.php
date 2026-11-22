<?php
require __DIR__ . '/lib.php';

$name = setting('site_name', '知酷课程表');
$desc = setting('site_desc');
$logo = setting('logo');
$logoText = setting('logo_text') ?: mb_substr($name, 0, 1);
$download = setting('download_url');
$keywords = setting('seo_keywords');
$seoDesc = setting('seo_description');
$email = setting('contact_email');
$qq = setting('contact_qq');
$wechat = setting('contact_wechat');
$latestVersion = db()->query("SELECT version FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetchColumn() ?: '1.1.0';
$anns = db()->query('SELECT id, title, content, pinned, created_at FROM announcements ORDER BY pinned DESC, id DESC LIMIT 6')->fetchAll();
$shotMain = 'assets/shots/home.png';
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title><?= e($name) ?> · 清爽好用的离线课表</title>
<meta name="keywords" content="<?= e($keywords) ?>">
<meta name="description" content="<?= e($seoDesc) ?>">
<meta property="og:title" content="<?= e($name) ?>">
<meta property="og:description" content="<?= e($seoDesc) ?>">
<meta property="og:image" content="assets/shots/schedule.png">
<style>
:root{
  --blue:#2563eb;--indigo:#4f46e5;--ink:#0a0f1c;--muted:#5a6474;--faint:#8b94a6;
  --line:#e6e9f0;--bg:#f7f8fc;--card:#fff;--r:22px;
  --shadow:0 24px 60px rgba(10,15,28,.08);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--blue);background:rgba(37,99,235,.08);border:1px solid rgba(37,99,235,.12);padding:8px 13px;border-radius:999px}
.eyebrow .pulse{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.15)}
nav{position:sticky;top:0;z-index:50;background:rgba(247,248,252,.72);backdrop-filter:saturate(180%) blur(20px);border-bottom:1px solid rgba(230,233,240,.8)}
.nav-inner{height:68px;display:flex;align-items:center;gap:14px}
.brand{display:flex;align-items:center;gap:11px;font-weight:750;letter-spacing:-.3px;font-size:15.5px}
.brand img{width:36px;height:36px;border-radius:11px;object-fit:cover;box-shadow:0 4px 12px rgba(10,15,28,.12)}
.brand .mark{width:36px;height:36px;border-radius:11px;background:linear-gradient(145deg,#3b82f6,#1d4ed8);color:#fff;display:grid;place-items:center;font-size:16px;font-weight:800;box-shadow:0 6px 16px rgba(37,99,235,.32)}
.nav-links{margin-left:auto;display:flex;align-items:center;gap:30px;font-size:13.5px;color:var(--muted)}
.nav-links a{transition:color .15s}
.nav-links a:hover{color:var(--ink)}
.nav-cta{display:inline-flex;align-items:center;gap:7px;background:var(--ink);color:#fff !important;padding:9px 16px;border-radius:11px;font-weight:600;font-size:13px}
.hero{position:relative;padding:44px 0 30px}
.hero:before{content:"";position:absolute;inset:0;background:
  radial-gradient(50% 45% at 78% 22%,rgba(79,70,229,.12),transparent 70%),
  radial-gradient(40% 40% at 12% 8%,rgba(37,99,235,.10),transparent 70%);
  pointer-events:none;z-index:-1}
.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
h1{font-size:64px;line-height:1.03;letter-spacing:-3px;margin:22px 0 20px;font-weight:800}
h1 .grad{background:linear-gradient(95deg,#2563eb 10%,#4f46e5 55%,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent}
.lede{font-size:16px;line-height:1.95;color:var(--muted);max-width:470px;margin:0 0 30px}
.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:15px 24px;border-radius:13px;font-weight:650;font-size:15px;transition:transform .16s ease,box-shadow .16s ease}
.btn:hover{transform:translateY(-2px)}
.btn-primary{background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;box-shadow:0 14px 30px rgba(37,99,235,.28)}
.btn-ghost{background:#fff;border:1px solid var(--line);color:var(--ink)}
.trust{display:flex;gap:22px;margin-top:28px;font-size:12.5px;color:var(--faint);flex-wrap:wrap}
.trust span{display:flex;align-items:center;gap:6px}
.trust svg{width:14px;height:14px;stroke:#22c55e;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.stage{position:relative;display:flex;justify-content:center;padding:12px 0}
.stage:before{content:"";position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.18),transparent 65%);filter:blur(6px);top:40px}
.rings{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
.rings i{position:absolute;border:1px solid rgba(37,99,235,.10);border-radius:50%}
.rings i:nth-child(1){width:320px;height:320px}
.rings i:nth-child(2){width:420px;height:420px;border-color:rgba(37,99,235,.07)}
.rings i:nth-child(3){width:520px;height:520px;border-color:rgba(37,99,235,.04)}
.device{position:relative;width:300px;border-radius:46px;background:#0b0f19;padding:11px;box-shadow:0 50px 90px rgba(10,15,28,.24),0 0 0 1px rgba(255,255,255,.06) inset;z-index:2}
.device img{display:block;width:100%;border-radius:36px}
.device:after{content:"";position:absolute;top:20px;left:50%;transform:translateX(-50%);width:96px;height:26px;background:#0b0f19;border-radius:999px;z-index:3}
.float{position:absolute;z-index:4;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border:1px solid rgba(230,233,240,.9);border-radius:14px;padding:11px 14px;box-shadow:0 18px 40px rgba(10,15,28,.10);font-size:12px;font-weight:600;color:var(--ink)}
.float small{display:block;font-size:10px;color:var(--faint);font-weight:500;margin-top:2px}
.float .ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:rgba(37,99,235,.10)}
.float svg{width:16px;height:16px;stroke:var(--blue);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.f1{top:88px;left:-16px}
.f2{bottom:132px;right:-26px}
.f3{bottom:52px;left:-4px}
.strip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}
.strip-inner{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 0;font-size:12.5px;color:var(--faint);flex-wrap:wrap}
.strip b{color:var(--ink);font-weight:650;font-size:13.5px}
section{position:relative}
.sec{padding:84px 0}
.sec-head{max-width:620px;margin-bottom:38px}
.sec-head .kicker{font-size:12.5px;font-weight:700;color:var(--blue);letter-spacing:.4px;text-transform:uppercase}
.sec-head h2{font-size:40px;line-height:1.15;letter-spacing:-1.4px;margin:12px 0 12px;font-weight:800}
.sec-head p{font-size:14.5px;line-height:1.9;color:var(--muted);margin:0}
.bento{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.bcard{background:var(--card);border:1px solid var(--line);border-radius:24px;padding:26px;position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease}
.bcard:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
.bcard.large{grid-column:span 3;min-height:270px;display:flex;flex-direction:column;justify-content:space-between}
.bcard.small{grid-column:span 2;min-height:170px}
.bcard h3{font-size:17px;margin:0 0 9px;letter-spacing:-.3px}
.bcard p{font-size:13px;line-height:1.85;color:var(--muted);margin:0}
.bicon{width:44px;height:44px;border-radius:13px;background:rgba(37,99,235,.08);display:grid;place-items:center;margin-bottom:18px}
.bicon svg{width:22px;height:22px;stroke:var(--blue);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.mock{margin-top:22px;border:1px solid var(--line);border-radius:16px;background:#fbfbfd;padding:12px;display:flex;gap:8px}
.mock .col{flex:1;display:flex;flex-direction:column;gap:6px}
.mock .bar{height:10px;border-radius:4px;background:#e9eefb}
.mock .bar.b{background:#dbe7ff}
.mock .bar.g{background:#dff3e8}
.mock .bar.o{background:#ffeadb}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.step{background:#fff;border:1px solid var(--line);border-radius:22px;padding:26px}
.step .num{width:34px;height:34px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-size:13px;font-weight:700;margin-bottom:16px}
.step h3{font-size:15.5px;margin:0 0 8px}
.step p{font-size:12.5px;line-height:1.85;color:var(--muted);margin:0}
.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.shot{background:#fff;border:1px solid var(--line);border-radius:24px;padding:16px;display:flex;justify-content:center;transition:transform .2s}
.shot:hover{transform:translateY(-4px)}
.shot img{width:100%;max-width:235px;border-radius:16px;display:block;box-shadow:0 12px 30px rgba(10,15,28,.08)}
.shot figcaption{text-align:center;font-size:11.5px;color:var(--faint);margin-top:12px}
.news-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.news{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px}
.news .meta{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--faint);margin-bottom:10px}
.news .pin{background:#fff4ed;color:#c2410c;padding:2px 8px;border-radius:999px;font-weight:600}
.news h3{font-size:14.5px;margin:0 0 8px}
.news p{font-size:12.5px;line-height:1.85;color:var(--muted);margin:0;max-height:96px;overflow:hidden}
.cta{background:#0a0f1c;border-radius:30px;padding:54px;color:#fff;position:relative;overflow:hidden;margin:0 0 40px}
.cta:before{content:"";position:absolute;width:520px;height:520px;right:-120px;top:-220px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,.55),transparent 65%)}
.cta:after{content:"";position:absolute;width:380px;height:380px;left:-120px;bottom:-220px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.35),transparent 65%)}
.cta .inner{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.cta h2{font-size:36px;letter-spacing:-1px;margin:0 0 12px}
.cta p{margin:0;color:rgba(255,255,255,.72);font-size:13.5px;line-height:1.8}
.cta .btn{background:#fff;color:#0a0f1c;box-shadow:none}
.cta .btn:hover{box-shadow:0 14px 30px rgba(255,255,255,.12)}
.faq{max-width:820px}
details{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin-bottom:10px}
summary{cursor:pointer;font-size:14px;font-weight:600;list-style:none;display:flex;justify-content:space-between;align-items:center}
summary::-webkit-details-marker{display:none}
summary:after{content:"+";color:var(--faint);font-size:18px;font-weight:400}
details[open] summary:after{content:"−"}
details p{font-size:12.5px;line-height:1.9;color:var(--muted);margin:12px 0 0}
footer{border-top:1px solid var(--line);background:#fff}
.foot{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:30px;padding:44px 0}
.foot .brand{font-size:14px}
.foot p{font-size:12px;line-height:1.9;color:var(--faint);margin:12px 0 0;max-width:260px}
.foot h4{font-size:12px;font-weight:650;color:var(--ink);margin:0 0 12px}
.foot a,.foot span{display:block;font-size:12.5px;color:var(--muted);margin-bottom:9px}
.foot a:hover{color:var(--ink)}
.copy{border-top:1px solid var(--line);padding:18px 0;display:flex;justify-content:space-between;gap:16px;font-size:11.5px;color:var(--faint);flex-wrap:wrap}
@media(max-width:980px){
 h1{font-size:44px;letter-spacing:-2px}
 .hero{padding:26px 0 14px}
 .hero-grid{grid-template-columns:1fr;gap:22px}
 .stage{order:-1;transform:scale(.82);margin:-6px 0 -18px}
 .bento{grid-template-columns:1fr 1fr}
 .bcard.large,.bcard.small{grid-column:span 1}
 .steps,.shots,.news-grid{grid-template-columns:1fr}
 .foot{grid-template-columns:1fr 1fr}
 .nav-links a:not(.nav-cta){display:none}
 .float{display:none}
}
@media(max-width:620px){
 h1{font-size:36px;letter-spacing:-1.4px}
 .wrap{padding:0 18px}
 .sec{padding:56px 0}
 .sec-head h2{font-size:30px}
 .device{width:248px}
 .stage{transform:scale(.74);margin:-14px 0 -34px}
 .hero{padding:18px 0 8px}
 .actions .btn{flex:1;justify-content:center;padding:14px 16px}
 .cta{padding:32px;border-radius:24px}
 .cta h2{font-size:27px}
 .bento{grid-template-columns:1fr}
 .foot{grid-template-columns:1fr}
}
</style></head><body>

<nav><div class="wrap nav-inner">
  <a class="brand" href="/">
    <?php if ($logo): ?><img src="<?= e($logo) ?>" alt="<?= e($name) ?>"><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?>
    <span><?= e($name) ?></span>
  </a>
  <div class="nav-links">
    <a href="#features">功能</a>
    <a href="#how">使用</a>
    <a href="#shots">界面</a>
    <a href="#news">公告</a>
    <a class="nav-cta" href="<?= e($download ?: '#') ?>">下载 App</a>
  </div>
</div></nav>

<header class="hero"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow"><span class="pulse"></span> v<?= e($latestVersion) ?> · 全新账号与云同步</span>
    <h1>把课表<br>装进<span class="grad">每一天</span></h1>
    <p class="lede"><?= e($desc) ?></p>
    <div class="actions">
      <a class="btn btn-primary" href="<?= e($download ?: '#') ?>">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg>
        下载 Android 版
      </a>
      <a class="btn btn-ghost" href="#features">查看功能</a>
    </div>
    <div class="trust">
      <span><svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg> 完全离线可用</span>
      <span><svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg> 无需注册也能导入</span>
      <span><svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg> 无广告</span>
    </div>
  </div>

  <div class="stage">
    <div class="rings"><i></i><i></i><i></i></div>
    <div class="device"><img src="<?= e($shotMain) ?>" alt="知酷课程表主站界面"></div>
    <div class="float f1"><span class="ic"><svg viewBox="0 0 24 24"><path d="M8 3v4M16 3v4"/><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18"/></svg></span><span>今日课程<small>3 节 · 下一节 10:30</small></span></div>
    <div class="float f2"><span class="ic"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span><span>上课提醒<small>已开启 · 提前 10 分钟</small></span></div>
    <div class="float f3"><span class="ic"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span><span>云端已同步<small>课表 · 备忘录 · 日程</small></span></div>
  </div>
</div></header>

<div class="strip"><div class="wrap strip-inner">
  <b>网页导入</b><span>·</span><b>Excel / CSV / JSON</b><span>·</span><b>单节课表</b><span>·</span><b>桌面小组件</b><span>·</span><b>天气提醒</b><span>·</span><b>日历 & 备忘录</b><span>·</span><b>云同步</b>
</div></div>

<section class="sec" id="features"><div class="wrap">
  <div class="sec-head">
    <div class="kicker">Features</div>
    <h2>为每天上课的人设计</h2>
    <p>不是把功能堆在一起，而是把「看课、改课、提醒」做得足够顺手。</p>
  </div>
  <div class="bento">
    <div class="bcard large">
      <div>
        <div class="bicon"><svg viewBox="0 0 24 24"><path d="M8 3v4M16 3v4"/><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18"/></svg></div>
        <h3>一张看得清的周课表</h3>
        <p>逐节排列，跨节课程整块显示；非本周课程淡化，冲突自动并排，不再糊成一团。</p>
      </div>
      <div class="mock">
        <div class="col"><div class="bar b"></div><div class="bar"></div><div class="bar"></div></div>
        <div class="col"><div class="bar"></div><div class="bar g"></div><div class="bar"></div></div>
        <div class="col"><div class="bar"></div><div class="bar"></div><div class="bar o"></div></div>
        <div class="col"><div class="bar"></div><div class="bar b"></div><div class="bar"></div></div>
        <div class="col"><div class="bar"></div><div class="bar"></div><div class="bar g"></div></div>
      </div>
    </div>
    <div class="bcard large">
      <div>
        <div class="bicon"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg></div>
        <h3>怎么导都行</h3>
        <p>教务网页识别、源码粘贴、Excel / CSV / JSON 文件，解析后进入可编辑预览，逐条改完再导入。</p>
      </div>
      <div class="mock">
        <div class="col"><div class="bar b"></div><div class="bar"></div><div class="bar"></div></div>
        <div class="col"><div class="bar"></div><div class="bar b"></div><div class="bar"></div></div>
        <div class="col"><div class="bar"></div><div class="bar"></div><div class="bar b"></div></div>
        <div class="col"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
        <div class="col"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
      </div>
    </div>
    <div class="bcard small">
      <div class="bicon"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></div>
      <h3>上课提醒</h3>
      <p>本地通知，提前 5/10/15/30 分钟可选，不依赖后台常驻。</p>
    </div>
    <div class="bcard small">
      <div class="bicon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg></div>
      <h3>桌面小组件</h3>
      <p>周课表与今日课程两种小组件，点击直接进入应用。</p>
    </div>
    <div class="bcard small">
      <div class="bicon"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.2-1-1.7-1-2.8 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3Z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7" r="1"/><circle cx="15" cy="8" r="1"/></svg></div>
      <h3>8 套配色</h3>
      <p>行高、圆角、透明度、深色模式都能调。</p>
    </div>
    <div class="bcard small">
      <div class="bicon"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h5"/></svg></div>
      <h3>备忘录 & 日历</h3>
      <p>富文本 + 手绘备忘录，课程与日程一个月视图看全。</p>
    </div>
    <div class="bcard small">
      <div class="bicon"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3>登录 + 云同步</h3>
      <p>账号存在官网，课表、备忘录、日程可备份与恢复。</p>
    </div>
    <div class="bcard small">
      <div class="bicon"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg></div>
      <h3>完全离线</h3>
      <p>不联网也能看课表，数据默认只存本机。</p>
    </div>
  </div>
</div></section>

<section class="sec" id="how" style="padding-top:0"><div class="wrap">
  <div class="sec-head">
    <div class="kicker">How it works</div>
    <h2>三步开始用</h2>
    <p>不需要折腾服务器，装好就能用。</p>
  </div>
  <div class="steps">
    <div class="step"><div class="num">1</div><h3>下载安装</h3><p>下载 Android APK，允许未知来源安装；打开后先看一段简短介绍。</p></div>
    <div class="step"><div class="num">2</div><h3>登录 / 注册</h3><p>用用户名、密码和极验验证注册，填写一种联系方式方便找回。</p></div>
    <div class="step"><div class="num">3</div><h3>导入课表</h3><p>从教务网页、源码或文件导入，确认后课表、小组件、提醒一起生效。</p></div>
  </div>
</div></section>

<section class="sec" id="shots" style="padding-top:0"><div class="wrap">
  <div class="sec-head">
    <div class="kicker">Preview</div>
    <h2>真正的界面</h2>
    <p>干净、扁平、信息密度刚好。</p>
  </div>
  <div class="shots">
    <figure class="shot" style="margin:0"><div><img src="assets/shots/schedule.png" alt="周课表"><figcaption>周课表 · 单节排列</figcaption></div></figure>
    <figure class="shot" style="margin:0"><div><img src="assets/shots/calendar.png" alt="日历"><figcaption>日历 · 课程与日程</figcaption></div></figure>
    <figure class="shot" style="margin:0"><div><img src="assets/shots/tools.png" alt="工具"><figcaption>工具 · 天气 / 备忘录 / 工单</figcaption></div></figure>
  </div>
</div></section>

<section class="sec" id="news" style="padding-top:0"><div class="wrap">
  <div class="sec-head">
    <div class="kicker">News</div>
    <h2>最新公告</h2>
    <p>版本更新与使用说明会发在这里。</p>
  </div>
  <!--ANN_START-->
  <div class="news-grid">
    <?php if (!$anns): ?><div class="news"><p>暂无公告</p></div><?php endif; ?>
    <?php foreach ($anns as $a): ?>
      <article class="news">
        <div class="meta"><?= e($a['created_at']) ?><?= $a['pinned'] ? '<span class="pin">置顶</span>' : '' ?></div>
        <h3><?= e($a['title']) ?></h3>
        <p><?= $a['content'] ?></p>
      </article>
    <?php endforeach; ?>
  </div>
  <!--ANN_END-->
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="cta">
    <div class="inner">
      <div>
        <h2>现在就把课表装进口袋</h2>
        <p>Android APK · 完全免费 · 支持离线使用 · 官网账号可云同步</p>
      </div>
      <a class="btn" href="<?= e($download ?: '#') ?>">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg>
        立即下载
      </a>
    </div>
  </div>
</div></section>

<section class="sec faq" style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div class="kicker">FAQ</div><h2>常见问题</h2></div>
  <details open><summary>必须登录才能用吗？</summary><p>当前版本需要登录后进入主站；登录后课表修改会自动同步到官网数据库，换设备可以用「从云端恢复」找回。</p></details>
  <details><summary>登录需要人机验证吗？</summary><p>注册和登录都会走极验验证码，由官网后台配置；管理员未配置时会自动跳过。</p></details>
  <details><summary>课表数据存在哪里？</summary><p>本机始终保存一份；登录后还会在官网数据库保存一份用于同步。不开启同步时不会上传。</p></details>
  <details><summary>支持 iPhone 吗？</summary><p>目前只提供 Android APK，iOS 尚未发布。</p></details>
</div></section>

<footer><div class="wrap">
  <div class="foot">
    <div>
      <a class="brand" href="/"><?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?><span><?= e($name) ?></span></a>
      <p><?= e($seoDesc) ?></p>
    </div>
    <div><h4>产品</h4><a href="#features">功能</a><a href="#shots">界面</a><a href="<?= e($download ?: '#') ?>">下载</a></div>
    <div><h4>支持</h4><a href="#news">公告</a><a href="forgot.php">找回密码</a><a href="mailto:<?= e($email) ?>">联系作者</a></div>
    <div><h4>联系</h4><span>邮箱 <?= e($email) ?></span><span>QQ <?= e($qq) ?></span><span>微信 <?= e($wechat) ?></span></div>
  </div>
  <div class="copy"><span>© <?= date('Y') ?> <?= e($name) ?> · 由个人开发者独立维护</span><span>class.zcoow.cn</span></div>
</div></footer>
</body></html>