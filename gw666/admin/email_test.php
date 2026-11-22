<?php
require __DIR__ . '/auth.php';
ensure_schema();
$title = '邮件测试';
$result = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $email = trim((string)($_POST['email'] ?? ''));
  $scene = (string)($_POST['scene'] ?? 'register');
  $result = email_send_code($email, $scene);
  if ($result['ok']) $result['error'] = '发送成功，请查收邮件（含垃圾箱）';
}
require __DIR__ . '/layout_top.php';
?>
<div class="card">
  <h2>SMTP 发送测试</h2>
  <p class="muted">服务器：<?= e(setting('smtp_host') ?: '未配置') ?> · 账号：<?= e(setting('smtp_user')) ?> · 加密：<?= e(setting('smtp_secure', 'ssl')) ?></p>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <div class="row">
      <div><label>收件邮箱</label><input name="email" value="<?= e($_POST['email'] ?? '') ?>" placeholder="name@example.com"></div>
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
      <?= e($result['ok'] ? '发送成功，请查收邮件' : ($result['error'] ?? '发送失败')) ?>
    </div>
  <?php endif; ?>
</div>
<div class="card">
  <h2>常见 SMTP 配置</h2>
  <table>
    <tr><th>服务</th><th>服务器</th><th>端口/加密</th></tr>
    <tr><td>QQ 邮箱</td><td>smtp.qq.com</td><td>465 / SSL（授权码）</td></tr>
    <tr><td>163 邮箱</td><td>smtp.163.com</td><td>465 / SSL（授权码）</td></tr>
    <tr><td>Gmail</td><td>smtp.gmail.com</td><td>587 / STARTTLS（应用专用密码）</td></tr>
    <tr><td>腾讯企业邮</td><td>smtp.exmail.qq.com</td><td>465 / SSL</td></tr>
  </table>
  <p class="muted">如果提示“SMTP 账号或授权码错误”，请到邮箱设置里开启 SMTP 服务并生成授权码，不要填登录密码。</p>
</div>
<?php require __DIR__ . '/layout_bottom.php'; ?>
