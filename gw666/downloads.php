<?php
require __DIR__ . '/lib.php';
$name = setting('site_name', '知酷课程表');
$logo = setting('logo');
$logoText = setting('logo_text') ?: mb_substr($name, 0, 1);
$android = setting('download_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/app-release.apk';
$windows = setting('download_windows_url') ?: 'https://github.com/jiujiu380/college-schedule/releases/latest/download/zhiku-desktop-win64.zip';
$latestVersion = db()->query("SELECT version FROM app_updates WHERE update_channel = 'site' ORDER BY id DESC LIMIT 1")->fetchColumn() ?: '1.3.8';
$email = setting('contact_email');
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>下载 · <?= e($name) ?></title>
<meta name="description" content="下载知酷课程表 Android APK 与 Windows 桌面版，手机与电脑账号互通。">
<style>
:root{--ink:#0B1220;--muted:#5B6577;--faint:#8B95A7;--line:#E7EAF1;--bg:#F7F8FB;--blue:#2563EB;--blue2:#4F46E5;--soft:#EEF3FF;--dark:#080D18}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 24px}
.nav-shell{position:sticky;top:12px;z-index:60}
.nav{height:66px;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.92);backdrop-filter:blur(18px);border:1px solid var(--line);border-radius:18px;padding:0 18px;box-shadow:0 10px 30px rgba(13,25,55,.06)}
.brand{display:flex;align-items:center;gap:10px;font-weight:750;font-size:15.5px}
.brand img{width:34px;height:34px;border-radius:10px;object-fit:cover}
.brand .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(145deg,#3B82F6,#1D4ED8);color:#fff;display:grid;place-items:center;font-weight:800}
.nav-links{margin-left:auto;display:flex;gap:4px;align-items:center}
.nav-links a{font-size:13.5px;color:var(--muted);padding:9px 13px;border-radius:9px}
.nav-links a:hover{color:var(--blue);background:var(--soft)}
.nav-links .cta{background:var(--ink);color:#fff;font-weight:650}
.hero{padding:40px 0 26px;background:radial-gradient(720px 320px at 92% -20%,rgba(37,99,235,.10),transparent 62%),radial-gradient(600px 300px at 0% 100%,rgba(79,70,229,.07),transparent 60%),#F7F8FB}
.badge{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:11.5px;color:var(--muted);box-shadow:0 6px 18px rgba(13,25,55,.04)}
.badge i{width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block}
h1{font-size:clamp(34px,5vw,50px);letter-spacing:-1.8px;line-height:1.1;margin:18px 0 12px;font-weight:830}
.hero p{max-width:600px;color:var(--muted);font-size:14px;line-height:1.9;margin:0}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:28px 0 18px}
.card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:26px;display:flex;flex-direction:column;gap:12px;box-shadow:0 18px 50px rgba(13,25,55,.05)}
.top{display:flex;align-items:center;gap:13px}
.p-icon{width:52px;height:52px;border-radius:15px;background:var(--soft);display:grid;place-items:center;flex:none}
.p-icon svg{width:25px;height:25px;stroke:var(--blue);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.card h2{font-size:21px;margin:0;letter-spacing:-.4px}
.sub{font-size:11px;color:var(--faint);margin-top:3px}
.card p{font-size:12.5px;line-height:1.85;color:var(--muted);margin:0}
ul{margin:0;padding-left:17px;color:var(--muted);font-size:11.5px;line-height:1.95}
.btn{display:inline-flex;align-items:center;justify-content:center;height:46px;border-radius:11px;background:linear-gradient(135deg,#2563EB,#4F46E5);color:#fff;font-weight:650;font-size:13.5px;margin-top:auto;box-shadow:0 12px 26px rgba(37,99,235,.22)}
.btn:hover{filter:brightness(1.04)}
.meta{font-size:10.5px;color:var(--faint);display:flex;gap:12px;flex-wrap:wrap}
.section{background:#fff;border:1px solid var(--line);border-radius:22px;padding:28px;margin:18px 0}
.section h2{font-size:19px;margin:0 0 14px;letter-spacing:-.3px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.step{background:#F8FAFF;border:1px solid #EDF2FB;border-radius:14px;padding:16px}
.step .num{font-size:10px;font-weight:800;color:var(--blue);letter-spacing:1px;margin-bottom:8px}
.step h3{font-size:13px;margin:0 0 5px}
.step p{font-size:11px;line-height:1.75;color:var(--muted);margin:0}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{text-align:left;padding:11px 8px;border-bottom:1px solid var(--line);color:var(--muted)}
th{font-size:11px;color:var(--faint);font-weight:600}
td:first-child{color:var(--ink);font-weight:600;width:140px}
.note{font-size:11.5px;color:var(--faint);line-height:1.9;margin:12px 0 0}
footer{border-top:1px solid var(--line);margin-top:40px;padding:24px 0;font-size:11px;color:var(--faint)}
.foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.foot a{color:var(--muted)}
@media(max-width:780px){.cards{grid-template-columns:1fr}.steps{grid-template-columns:1fr}.wrap{padding:0 16px}.nav-links a:not(.cta){display:none}.hero{padding-top:26px}}
</style></head><body>

<div class="nav-shell"><div class="wrap"><nav class="nav">
  <a class="brand" href="/"><?php if ($logo): ?><img src="<?= e($logo) ?>" alt=""><?php else: ?><span class="mark"><?= e($logoText) ?></span><?php endif; ?><span><?= e($name) ?></span></a>
  <div class="nav-links"><a href="/">首页</a><a href="/#features">功能</a><a href="/#screens">界面</a><a class="cta" href="/">返回官网</a></div>
</nav></div></div>

<section class="hero"><div class="wrap">
  <span class="badge"><i></i> 最新版本 v<?= e($latestVersion) ?> · 已验证</span>
  <h1>下载客户端</h1>
  <p>Android 与 Windows 使用同一个官网账号。登录后课表、备忘录、日程可云端恢复；不登录也能离线使用全部课表功能。</p>
</div></section>

<div class="wrap">
  <div class="cards">
    <div class="card">
      <div class="top"><div class="p-icon"><svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg></div><div><h2>Android</h2><div class="sub">APK · 约 38 MB</div></div></div>
      <p>适合日常上课使用，支持桌面小组件、上课提醒、后台保活与离线课表。</p>
      <ul><li>单节周课表、冲突并排、调课</li><li>作业 DDL、考试倒计时</li><li>课表分享、图片 / PDF 导出</li><li>天气 + 今日课程早间提醒</li></ul>
      <div class="meta"><span>Android 8.0+</span><span>应用内检查更新</span></div>
      <a class="btn" href="<?= e($android) ?>">下载 APK</a>
    </div>
    <div class="card">
      <div class="top"><div class="p-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></div><div><h2>Windows</h2><div class="sub">便携版 ZIP · 约 118 MB</div></div></div>
      <p>解压后运行「知酷课程表.exe」即可，不写注册表、不安装服务，删除文件夹就卸载。</p>
      <ul><li>与手机同一账号，云端恢复</li><li>大屏看整周课表、改课</li><li>导出 PDF / 图片 / 日历文件</li><li>支持 Windows 10 / 11</li></ul>
      <div class="meta"><span>Windows 10 / 11</span><span>免安装</span></div>
      <a class="btn" href="<?= e($windows) ?>">下载 Windows 版</a>
    </div>
  </div>

  <section class="section">
    <h2>安装说明</h2>
    <div class="steps">
      <div class="step"><div class="num">ANDROID</div><h3>安装 APK</h3><p>下载后允许浏览器安装未知应用，安装完成登录账号即可。</p></div>
      <div class="step"><div class="num">WINDOWS</div><h3>解压运行</h3><p>解压 ZIP，双击「知酷课程表.exe」。若 SmartScreen 提示，选择更多信息 → 仍要运行。</p></div>
      <div class="step"><div class="num">SYNC</div><h3>恢复数据</h3><p>登录同一账号，在「账号 → 从云端恢复」找回课表、备忘录和日程。</p></div>
    </div>
    <p class="note">Windows 版为便携程序，不写注册表；建议放在有写入权限的目录，避免放在系统盘受保护目录。</p>
  </section>

  <section class="section">
    <h2>系统要求</h2>
    <table>
      <tr><th>平台</th><th>要求</th><th>说明</th></tr>
      <tr><td>Android</td><td>Android 8.0 及以上</td><td>通知、日历、定位权限可按需开启</td></tr>
      <tr><td>Windows</td><td>Windows 10 / 11 x64</td><td>便携版，无需管理员权限</td></tr>
      <tr><td>账号</td><td>官网账号</td><td>用户名 + 密码 + 极验验证码</td></tr>
    </table>
  </section>

  <section class="section">
    <h2>数据与隐私</h2>
    <p class="note">课表默认只保存在本机，不登录也能使用；登录后云同步由你手动触发或按设置上传。应用不含广告与内购，不读取与课表无关的个人数据。公益专栏只汇总官方渠道，不代收任何捐赠。</p>
  </section>
</div>

<footer><div class="wrap foot"><span>© <?= date('Y') ?> <?= e($name) ?> · <?= e($email) ?></span><span><a href="/">官网首页</a> · <a href="/#faq">常见问题</a></span></div></footer>
</body></html>
