<?php
require __DIR__ . '/auth.php';
$title = '网站设置';
$saved = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $keys = ['site_name','site_desc','seo_keywords','seo_description','download_url','contact_email','contact_qq','contact_wechat','contact_site'];
  foreach ($keys as $k) set_setting($k, trim((string)($_POST[$k] ?? '')));
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
  <label>Logo（png/jpg/svg）</label><input type="file" name="logo" accept="image/*">
  <?php if (setting('logo')): ?><p class="muted">当前：<img src="../<?= e(setting('logo')) ?>" style="height:36px;vertical-align:middle;border-radius:8px"></p><?php endif; ?>
  <label>下载地址（APK）</label><input name="download_url" value="<?= e(setting('download_url')) ?>">

  <h2 class="mt">SEO</h2>
  <label>关键词</label><input name="seo_keywords" value="<?= e(setting('seo_keywords')) ?>">
  <label>描述</label><textarea name="seo_description"><?= e(setting('seo_description')) ?></textarea>

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
