<?php
require __DIR__ . '/auth.php';
$title = '网站设置';
$saved = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $keys = ['site_name','site_desc','seo_keywords','seo_description','download_url','contact_email','contact_qq','contact_wechat','contact_site','logo_text','captcha_id','captcha_key','smtp_enabled','smtp_host','smtp_port','smtp_secure','smtp_user','smtp_pass','smtp_from','smtp_from_name','sms_provider','aliyun_access_key_id','aliyun_access_key_secret','aliyun_sign_name','aliyun_template_code','aliyun_region','aliyun_template_param','aliyun_scheme_name','smsbao_user','smsbao_pass','smsbao_content','tencent_secret_id','tencent_secret_key','tencent_sms_app_id','tencent_sign_name','tencent_template_id','tencent_region'];
  foreach ($keys as $k) set_setting($k, trim((string)($_POST[$k] ?? '')));
  set_setting('captcha_enabled', isset($_POST['captcha_enabled']) ? '1' : '0');
  if (!empty($_FILES['logo']['tmp_name'])) {
    $dir = dirname(__DIR__) . '/uploads';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $ext = strtolower(pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION));
    if (in_array($ext, ['png','jpg','jpeg','webp','svg'], true)) {
      $file = 'uploads/logo-' . time() . '.' . $ext;
      move_uploaded_file($_FILES['logo']['tmp_name'], dirname(__DIR__) . '/' . $file);
      set_setting('logo', $file);
    }
  }
  $saved = true;
}
require __DIR__ . '/layout_top.php';
?>
<?php if ($saved): ?><div class="ok">已保存</div><?php endif; ?>
<form method="post" enctype="multipart/form-data" class="card">
  <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
  <h2>基础信息</h2>
  <label>网站名称</label><input name="site_name" value="<?= e(setting('site_name')) ?>">
  <label>网站简介</label><textarea name="site_desc"><?= e(setting('site_desc')) ?></textarea>
  <label>文字 Logo（未上传图片时显示，留空取网站名首字）</label><input name="logo_text" value="<?= e(setting('logo_text')) ?>" maxlength="4">
  <label>Logo（png/jpg/svg）</label><input type="file" name="logo" accept="image/*">
  <?php if (setting('logo')): ?><p class="muted">当前：<img src="../<?= e(setting('logo')) ?>" style="height:36px;vertical-align:middle;border-radius:8px"></p><?php endif; ?>
  <label>下载地址（APK）</label><input name="download_url" value="<?= e(setting('download_url')) ?>">

  <h2 class="mt">SEO</h2>
  <label>关键词</label><input name="seo_keywords" value="<?= e(setting('seo_keywords')) ?>">
  <label>描述</label><textarea name="seo_description"><?= e(setting('seo_description')) ?></textarea>

  <h2 class="mt">极验验证码（GeeTest v4）</h2>
  <p class="muted">未填写 ID/Key 时自动关闭验证码；关闭后注册/登录不需要验证。</p>
  <div class="row">
    <div><label>Captcha ID</label><input name="captcha_id" value="<?= e(setting('captcha_id')) ?>" placeholder="从极验后台获取"></div>
    <div><label>Captcha Key</label><input name="captcha_key" value="<?= e(setting('captcha_key')) ?>" placeholder="仅服务端使用"></div>
  </div>
  <label class="mt"><input type="checkbox" name="captcha_enabled" style="width:auto" <?= setting('captcha_enabled', '1') === '1' ? 'checked' : '' ?>> 启用验证码</label>

  <h2 class="mt">联系方式</h2>
  <div class="row">
    <div><label>邮箱</label><input name="contact_email" value="<?= e(setting('contact_email')) ?>"></div>
    <div><label>QQ</label><input name="contact_qq" value="<?= e(setting('contact_qq')) ?>"></div>
  </div>
  <div class="row mt">
    <div><label>微信</label><input name="contact_wechat" value="<?= e(setting('contact_wechat')) ?>"></div>
    <div><label>官网</label><input name="contact_site" value="<?= e(setting('contact_site')) ?>"></div>
  </div>

  <button class="mt" type="submit">保存设置</button>
</form>
<?php require __DIR__ . '/layout_bottom.php'; ?>