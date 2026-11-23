<?php
require __DIR__ . '/lib.php';
$name = setting('site_name', '知酷课程表');
$logo = setting('logo');
$logoText = setting('logo_text') ?: mb_substr($name, 0, 1);
$android = setting('download_url');
$windows = setting('download_windows_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/zhiku-desktop-win64.zip';
$latestVersion = db()->query("SELECT version FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetchColumn() ?: '1.3.3';
$email = setting('contact_email');
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>下载 · <?= e($name) ?></title>
<meta name="description" content="下载知酷课程表 Android APK 与 Windows 桌面版">
<style>
:root{--blue:#1a6dff;--blue-dark:#0b4fc7;--blue-soft:#eef4ff;--ink:#16233b;--muted:#5c6b85;--faint:#8a98b0;--line:#e6ecf6}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif}
a{color:inherit;text-decoration:none}
.wrap{max-width:1060px;margin:0 auto;padding:0 24px}
header.site{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.nav{height:70px;display:flex;align-items:center}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;font-size:16px}
.brand img{width:34px;height:34px;border-radius:9px;object-fit:cover}
.brand .mark{width:34px;height:34px;border-radius:9px;background:linear-gradient(145deg,#3b82f6,#1a6dff);color:#fff;display:grid;place-items:center;font-weight:800}
.navlinks{margin-left:auto;display:flex;gap:6px;align-items:center}
.navlinks a{font-size:14px;color:var(--muted);padding:9px 14px;border-radius:10px}
.navlinks a:hover{color:var(--blue);background:var(--blue-soft)}
.navlinks .cta{background:var(--blue);color:#fff;font-weight:650}
.hero{padding:52px 0 26px;background:radial-gradient(800px 360px at 90% -20%,rgba(26,109,255,.09),transparent 60%),#fff}
.kicker{color:var(--blue);font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase}
h1{font-size:clamp(30px,4vw,44px);letter-spacing:-1px;margin:10px 0 12px;font-weight:800}
.hero p{color:var(--muted);font-size:14.5px;line-height:1.9;max-width:620px;margin:0}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:28px 0 26px}
.card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px;display:flex;flex-direction:column;gap:12px;box-shadow:0 10px 34px rgba(16,51,120,.04)}
.top{display:flex;align-items:center;gap:12px}
.pic{width:52px;height:52px;border-radius:15px;background:var(--blue-soft);display:grid;place-items:center}
.card h2{font-size:20px;margin:0}
.sub{font-size:12px;color:var(--faint);margin-top:2px}
.card p{font-size:13px;color:var(--muted);line-height:1.85;margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;height:46px;border-radius:11px;background:var(--blue);color:#fff;font-weight:650;font-size:14px;margin-top:auto}
.btn:hover{background:var(--blue-dark)}
.meta{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--faint)}
.steps{background:linear-gradient(180deg,#f7faff,#fff);border:1px solid var(--line);border-radius:22px;padding:28px;margin:8px 0 36px}
.steps h2{font-size:20px;margin:0 0 16px}
.steps ol{margin:0;padding-left:20px;color:var(--muted);font-size:13.5px;line-height:2.1}
.note{font-size:12px;color:var(--faint);margin-top:14px;line-height:1.8}
footer{border-top:1px solid var(--line);padding:22px 0;color:var(--faint);font-size:12px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
footer a{color:var(--muted)}
@media(max-width:760px){.cards{grid-template-columns:1fr}.navlinks a:not(.cta){display:none}.wrap{padding:0 16px}.hero{padding:36px 0 20px}}
</style></head><body>
<header class="site"><div class="wrap"><div class="nav">
  <a class="brand" href="/"><?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?><span><?= e($name) ?></span></a>
  <nav class="navlinks"><a href="/">首页</a><a href="/#features">功能</a><a href="downloads.php">下载</a><a class="cta" href="/">返回官网</a></nav>
</div></div></header>

<section class="hero"><div class="wrap">
  <div class="kicker">Download</div>
  <h1>下载客户端</h1>
  <p>当前最新版本 v<?= e($latestVersion) ?>。Android 与 Windows 使用同一个官网账号，登录后课表、备忘录、日程可云端同步。</p>
</div></section>

<div class="wrap">
  <div class="cards">
    <div class="card">
      <div class="top">
        <div class="pic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a6dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg></div>
        <div><h2>Android</h2><div class="sub">APK · 约 37 MB</div></div>
      </div>
      <p>支持桌面小组件、上课提醒、天气、日历、备忘录与云同步。安装前允许「未知来源」。</p>
      <div class="meta"><span>Android 8.0+</span><span>自动检查更新</span></div>
      <a class="btn" href="<?= e($android ?: '#') ?>">下载 APK</a>
    </div>

    <div class="card">
      <div class="top">
        <div class="pic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a6dff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></div>
        <div><h2>Windows</h2><div class="sub">便携版 ZIP · 约 118 MB</div></div>
      </div>
      <p>解压后运行 <b>知酷课程表.exe</b>，无需安装。与手机端共用账号，适合在电脑上看课表、改课表。</p>
      <div class="meta"><span>Windows 10 / 11</span><span>不写注册表</span></div>
      <a class="btn" href="<?= e($windows) ?>">下载 Windows 版</a>
    </div>
  </div>

  <section class="steps">
    <h2>安装说明</h2>
    <ol>
      <li><b>Android：</b>下载 APK → 允许浏览器安装未知应用 → 安装 → 登录官网账号。</li>
      <li><b>Windows：</b>下载 ZIP → 解压到任意文件夹 → 双击「知酷课程表.exe」；建议不要放在需要管理员权限的目录。</li>
      <li>首次打开先看介绍与新手引导，然后登录 / 注册，再导入课表。</li>
      <li>换设备时，登录同一账号后在「账号 → 从云端恢复」即可找回课表、备忘录和日程。</li>
    </ol>
    <p class="note">Windows 版为便携程序，不写注册表；删除文件夹即可卸载。若 SmartScreen 提示未知发布者，选择「更多信息 → 仍要运行」。</p>
  </section>
</div>

<footer><div class="wrap" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><span>© <?= date('Y') ?> <?= e($name) ?> · 联系方式 <?= e($email) ?></span><span><a href="/">官网首页</a> · <a href="/#faq">常见问题</a></span></div></footer>
</body></html>
