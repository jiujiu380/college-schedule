<?php
require __DIR__ . '/lib.php';
$name = setting('site_name', '知酷课程表');
$qq = setting('contact_qq');
$wechat = setting('contact_wechat');
$email = setting('contact_email');
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>找回密码 · <?= e($name) ?></title>
<style>
body{margin:0;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#0b1220}
.wrap{max-width:560px;margin:0 auto;padding:48px 20px}
.card{background:#fff;border:1px solid #e9ebf1;border-radius:18px;padding:26px;box-shadow:0 18px 50px rgba(11,18,32,.05)}
h1{font-size:22px;margin:0 0 10px;letter-spacing:-.5px}
p{font-size:14px;line-height:1.9;color:#5b6474;margin:0 0 14px}
.item{display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid #f1f3f7;font-size:14px}
.item b{font-weight:600}
a{color:#2563eb;text-decoration:none}
.back{display:inline-block;margin-top:20px;font-size:13px;color:#8b93a3}
</style></head><body>
<div class="wrap"><div class="card">
  <h1>找回密码</h1>
  <p>为了账号安全，目前不支持自助重置密码。请通过以下任一方式联系客服，提供你的用户名和注册时填写的联系方式，核实后由管理员为你重置。</p>
  <?php if ($qq): ?><div class="item"><span>客服 QQ</span><b><?= e($qq) ?></b></div><?php endif; ?>
  <?php if ($wechat): ?><div class="item"><span>客服微信</span><b><?= e($wechat) ?></b></div><?php endif; ?>
  <?php if ($email): ?><div class="item"><span>客服邮箱</span><b><a href="mailto:<?= e($email) ?>"><?= e($email) ?></a></b></div><?php endif; ?>
  <p style="margin-top:18px">处理时间通常为 1 个工作日内。</p>
  <a class="back" href="/">返回官网</a>
</div></div>
</body></html>
