<?php
require __DIR__ . '/auth.php';
ensure_schema();
$title = '短信测试';
$result = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $phone = sms_phone((string)($_POST['phone'] ?? ''));
  $scene = (string)($_POST['scene'] ?? 'register');
  if (!sms_valid_phone($phone)) {
    $result = ['ok' => false, 'error' => '手机号格式不正确'];
  } else {
    $result = sms_send_code($phone, $scene);
    if ($result['ok']) $result['error'] = '发送成功，请查看手机短信';
  }
}
require __DIR__ . '/layout_top.php';
?>
<div class="card">
  <h2>短信发送测试</h2>
  <p class="muted">当前服务商：<b><?= e(sms_provider()) ?></b> · 签名：<?= e(setting('aliyun_sign_name') ?: setting('tencent_sign_name') ?: setting('smsbao_user')) ?> · 模板：<?= e(setting('aliyun_template_code') ?: setting('tencent_template_id')) ?></p>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <div class="row">
      <div><label>手机号</label><input name="phone" value="<?= e($_POST['phone'] ?? '') ?>" placeholder="11 位手机号" maxlength="11"></div>
      <div><label>场景</label>
        <select name="scene">
          <option value="register">注册</option>
          <option value="login">登录</option>
          <option value="reset">重置密码</option>
        </select>
      </div>
    </div>
    <button class="mt" type="submit">发送验证码</button>
  </form>
  <?php if ($result): ?>
    <div class="<?= $result['ok'] ? 'ok' : 'alert' ?>" style="margin-top:16px">
      <?= e($result['ok'] ? '发送成功，请查看手机短信' : ($result['error'] ?? '发送失败')) ?>
    </div>
  <?php endif; ?>
</div>
<div class="card">
  <h2>常见错误</h2>
  <table>
    <tr><th>提示</th><th>处理</th></tr>
    <tr><td>签名或模板无效</td><td>PNVS 必须使用“赠送签名 + 赠送模板”且成对；自定义签名请改用“阿里云短信服务”并填审核通过的 SMS_ 模板</td></tr>
    <tr><td>模板变量不匹配</td><td>检查模板里的变量名，把“模板验证码变量名”改成对应名字</td></tr>
    <tr><td>SignatureDoesNotMatch</td><td>AccessKey Secret 填错或含空格</td></tr>
    <tr><td>发送太频繁</td><td>同号 60 秒一次，每天 10 次</td></tr>
  </table>
</div>
<?php require __DIR__ . '/layout_bottom.php'; ?>
