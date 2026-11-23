<?php
require __DIR__ . '/lib.php';
$name = setting('site_name', '知酷课程表');
$logo = setting('logo');
$logoText = setting('logo_text') ?: mb_substr($name, 0, 1);
$android = setting('download_url');
$windows = setting('download_windows_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/zhiku-desktop-win64.zip';
$latestVersion = db()->query("SELECT version FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetchColumn() ?: '1.3.2';
$email = setting('contact_email');
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>下载 · <?= e($name) ?></title>
<meta name="description" content="下载知酷课程表 Android APK 与 Windows 桌面版">
<style>
:root{--blue:#2563eb;--ink:#0a0f1c;--muted:#5f6776;--faint:#8d95a5;--line:#e8eaf0;--bg:#f5f6f9}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
a{color:inherit;text-decoration:none}
.wrap{max-width:980px;margin:0 auto;padding:0 22px}
header{padding:22px 0}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;font-size:15px}
.brand img{width:34px;height:34px;border-radius:10px}
.brand .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(145deg,#3b82f6,#1d4ed8);color:#fff;display:grid;place-items:center;font-weight:800}
.back{margin-left:auto;font-size:13px;color:var(--muted)}
.hero{padding:18px 0 26px}
.hero h1{font-size:40px;letter-spacing:-1.6px;margin:0 0 10px}
.hero p{margin:0;color:var(--muted);font-size:14px;line-height:1.8}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0}
.card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:26px;display:flex;flex-direction:column;gap:12px}
.card .top{display:flex;align-items:center;gap:12px}
.card .pic{width:52px;height:52px;border-radius:15px;background:#eef3ff;display:grid;place-items:center}
.card h2{font-size:20px;margin:0}
.card .sub{font-size:12px;color:var(--faint)}
.card p{font-size:12.5px;color:var(--muted);line-height:1.8;margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:46px;border-radius:12px;background:var(--blue);color:#fff;font-weight:650;font-size:14px;margin-top:auto}
.btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
.meta{display:flex;gap:14px;flex-wrap:wrap;font-size:11.5px;color:var(--faint);margin-top:2px}
.steps{background:#fff;border:1px solid var(--line);border-radius:22px;padding:26px;margin:8px 0 30px}
.steps h2{font-size:17px;margin:0 0 14px}
.steps ol{margin:0;padding-left:20px;color:var(--muted);font-size:13px;line-height:2}
.note{font-size:11.5px;color:var(--faint);margin-top:12px;line-height:1.8}
footer{border-top:1px solid var(--line);margin-top:24px;padding:24px 0;color:var(--faint);font-size:12px}
@media(max-width:760px){.cards{grid-template-columns:1fr}.hero h1{font-size:32px}}
</style></head><body>
<div class="wrap">
<header><div class="brand">
  <?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?>
  <span><?= e($name) ?></span>
  <a class="back" href="/">← 返回首页</a>
</div></header>

<section class="hero">
  <h1>下载客户端</h1>
  <p>当前最新版本 v<?= e($latestVersion) ?>。Android 与 Windows 使用同一个官网账号，登录后课表、备忘录、日程可云端同步。</p>
</section>

<div class="cards">
  <div class="card">
    <div class="top">
      <div class="pic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg></div>
      <div><h2>Android</h2><div class="sub">APK · 约 37 MB</div></div>
    </div>
    <p>支持桌面小组件、上课提醒、天气、日历、备忘录与云同步。安装前允许「未知来源」。</p>
    <a class="btn" href="<?= e($android ?: '#') ?>">下载 APK</a>
  </div>

  <div class="card">
    <div class="top">
      <div class="pic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></div>
      <div><h2>Windows</h2><div class="sub">便携版 ZIP · 约 118 MB</div></div>
    </div>
    <p>解压后运行 <b>知酷课程表.exe</b>，无需安装。与手机端共用账号，适合在电脑上看课表、改课表。</p>
    <a class="btn" href="<?= e($windows) ?>">下载 Windows 版</a>
  </div>
</div>

<section class="steps">
  <h2>安装说明</h2>
  <ol>
    <li><b>Android：</b>下载 APK → 允许浏览器安装未知应用 → 安装 → 登录官网账号。</li>
    <li><b>Windows：</b>下载 ZIP → 解压到任意文件夹 → 双击「知酷课程表.exe」；建议不要放在桌面以外需要管理员权限的目录。</li>
    <li>首次打开先看介绍与新手引导，然后登录 / 注册，再导入课表。</li>
    <li>换设备时，登录同一账号后在「账号 → 从云端恢复」即可找回课表、备忘录和日程。</li>
  </ol>
  <p class="note">Windows 版为便携程序，不写注册表；删除文件夹即可卸载。若 SmartScreen 提示未知发布者，选择「更多信息 → 仍要运行」。</p>
</section>

<footer>© <?= date('Y') ?> <?= e($name) ?> · 联系方式 <?= e($email) ?> · <a href="/">官网首页</a></footer>
</div></body></html>
