<?php
require __DIR__ . '/lib.php';

$enabled = captcha_enabled();
$id = setting('captcha_id');
?>
<!doctype html><html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>安全验证</title>
<style>
html,body{margin:0;height:100%;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#0b1220}
.wrap{min-height:100%;display:flex;align-items:center;justify-content:center;padding:20px}
.box{width:100%;max-width:420px;background:#fff;border:1px solid #e9ebf1;border-radius:18px;padding:22px;box-shadow:0 18px 50px rgba(11,18,32,.06)}
h1{font-size:17px;margin:0 0 6px;letter-spacing:-.3px}
p{font-size:12.5px;line-height:1.8;color:#5b6474;margin:0 0 16px}
.hint{font-size:12px;color:#8b93a3;margin-top:14px}
.ok{color:#047857;font-weight:600}
.err{color:#b91c1c;font-size:12.5px;margin-top:12px;line-height:1.7}
</style></head><body>
<div class="wrap"><div class="box">
  <h1>安全验证</h1>
  <p>完成验证后即可继续注册 / 登录。</p>
  <div id="captcha"></div>
  <div class="hint" id="hint"><?= $enabled ? '正在加载验证组件…' : '管理员尚未配置验证码，可直接提交。' ?></div>
  <div class="err" id="err"></div>
</div></div>
<?php if ($enabled): ?>
<script src="https://static.geetest.com/v4/gt4.js"></script>
<script>
(function () {
  var done = false;
  function post(payload) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    } else {
      document.getElementById('hint').innerHTML = '<span class="ok">验证成功，请返回应用继续。</span>';
    }
  }
  function fail(msg) {
    document.getElementById('err').textContent = msg || '验证组件加载失败，请检查网络后重试';
  }
  if (!window.initGeetest4) { fail(); return; }
  initGeetest4({ captchaId: <?= json_encode($id) ?>, product: 'bind', language: 'zho' }, function (captcha) {
    captcha.onSuccess(function () {
      if (done) return;
      done = true;
      var r = captcha.getValidate();
      document.getElementById('hint').innerHTML = '<span class="ok">验证成功，正在返回应用…</span>';
      post({ type: 'captcha', data: r });
    });
    captcha.onError(function () { fail('验证出错，请刷新后重试'); });
    captcha.onClose(function () { if (!done) document.getElementById('hint').textContent = '请点击按钮完成验证'; });
    captcha.showCaptcha();
  });
})();
</script>
<?php else: ?>
<script>
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'captcha', data: {}, disabled: true }));
  }
</script>
<?php endif; ?>
</body></html>
