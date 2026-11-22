<?php
require __DIR__ . '/auth.php';
$title = '网站设置';
$saved = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $keys = ['site_name','site_desc','seo_keywords','seo_description','download_url','contact_email','contact_qq','contact_wechat','contact_site','logo_text','captcha_id','captcha_key','smtp_enabled','smtp_host','smtp_port','smtp_secure','smtp_user','smtp_pass','smtp_from','smtp_from_name','sms_provider','aliyun_access_key_id','aliyun_access_key_secret','aliyun_sign_name','aliyun_template_code','aliyun_region','aliyun_template_param','aliyun_scheme_name','smsbao_user','smsbao_pass','smsbao_content','tencent_secret_id','tencent_secret_key','tencent_sms_app_id','tencent_sign_name','tencent_template_id','tencent_region'];
  foreach ($keys as $k) set_setting($k, trim((string)($_POST[$k] ?? '')));
  set_setting('captcha_enabled', isset($_POST['captcha_enabled']) ? '1' : '0');
  set_setting('smtp_enabled', isset($_POST['smtp_enabled']) ? '1' : '0');
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

  <h2 class="mt">邮箱验证码（SMTP）</h2>
  <p class="muted">注册、邮箱验证码登录、邮箱重置密码都依赖这里的 SMTP。支持 QQ 邮箱、163、企业邮箱等；密码处填“授权码”而不是登录密码。</p>
  <label class="mt"><input type="checkbox" name="smtp_enabled" style="width:auto" <?= setting('smtp_enabled', '0') === '1' ? 'checked' : '' ?>> 启用邮箱验证码</label>
  <div class="row mt">
    <div><label>SMTP 服务器</label><input name="smtp_host" value="<?= e(setting('smtp_host')) ?>" placeholder="smtp.qq.com"></div>
    <div><label>端口</label><input name="smtp_port" value="<?= e(setting('smtp_port', '465')) ?>" placeholder="465"></div>
    <div><label>加密方式</label>
      <select name="smtp_secure">
        <?php $sec = setting('smtp_secure', 'ssl'); ?>
        <option value="ssl" <?= $sec === 'ssl' ? 'selected' : '' ?>>SSL（465）</option>
        <option value="tls" <?= $sec === 'tls' ? 'selected' : '' ?>>STARTTLS（587）</option>
        <option value="none" <?= $sec === 'none' ? 'selected' : '' ?>>不加密（25）</option>
      </select>
    </div>
  </div>
  <div class="row mt">
    <div><label>SMTP 账号</label><input name="smtp_user" value="<?= e(setting('smtp_user')) ?>" placeholder="name@qq.com"></div>
    <div><label>SMTP 密码 / 授权码</label><input name="smtp_pass" type="password" value="<?= e(setting('smtp_pass')) ?>"></div>
  </div>
  <div class="row mt">
    <div><label>发件地址</label><input name="smtp_from" value="<?= e(setting('smtp_from')) ?>" placeholder="留空使用 SMTP 账号"></div>
    <div><label>发件人名称</label><input name="smtp_from_name" value="<?= e(setting('smtp_from_name', setting('site_name'))) ?>"></div>
  </div>

  <h2 class="mt">短信验证码（旧版）</h2>
  <p class="muted">注册必须短信验证；登录支持手机号+验证码；忘记密码可用手机号重置。阿里云走 PNVS SendSmsVerifyCode（免资质），短信宝/腾讯云由本站生成验证码。</p>
  <label>短信服务商</label>
  <select name="sms_provider">
    <?php $sp = setting('sms_provider', 'none'); ?>
    <option value="none" <?= $sp === 'none' ? 'selected' : '' ?>>未启用</option>
    <option value="aliyun" <?= $sp === 'aliyun' ? 'selected' : '' ?>>阿里云 PNVS（免资质，赠送签名+模板）</option>
    <option value="aliyun_sms" <?= $sp === 'aliyun_sms' ? 'selected' : '' ?>>阿里云短信服务（自定义签名+模板）</option>
    <option value="smsbao" <?= $sp === 'smsbao' ? 'selected' : '' ?>>短信宝</option>
    <option value="tencent" <?= $sp === 'tencent' ? 'selected' : '' ?>>腾讯云短信</option>
  </select>

  <div class="row mt">
    <div><label>阿里云 AccessKey ID</label><input name="aliyun_access_key_id" value="<?= e(setting('aliyun_access_key_id')) ?>"></div>
    <div><label>阿里云 AccessKey Secret</label><input name="aliyun_access_key_secret" type="password" value="<?= e(setting('aliyun_access_key_secret')) ?>"></div>
  </div>
  <div class="row mt">
    <div><label>阿里云签名</label><input name="aliyun_sign_name" value="<?= e(setting('aliyun_sign_name')) ?>" placeholder="必须与模板成对"></div>
    <div><label>阿里云模板 CODE</label><input name="aliyun_template_code" value="<?= e(setting('aliyun_template_code')) ?>" placeholder="PNVS 为纯数字；短信服务为 SMS_xxx"></div>
    <div><label>地域</label><input name="aliyun_region" value="<?= e(setting('aliyun_region', 'cn-hangzhou')) ?>"></div>
  </div>
  <div class="row mt">
    <div><label>模板验证码变量名</label><input name="aliyun_template_param" value="<?= e(setting('aliyun_template_param', 'code')) ?>" placeholder="code"></div>
    <div><label>PNVS 方案名 SchemeName（选填）</label><input name="aliyun_scheme_name" value="<?= e(setting('aliyun_scheme_name')) ?>"></div>
  </div>
  <p class="muted">PNVS：签名和模板必须使用控制台赠送的那一对，自定义签名会报“签名或模板无效”。<br>阿里云短信服务：使用已审核通过的签名 + 模板，模板变量名默认 code。</p>

  <div class="row mt">
    <div><label>短信宝账号</label><input name="smsbao_user" value="<?= e(setting('smsbao_user')) ?>"></div>
    <div><label>短信宝密码</label><input name="smsbao_pass" type="password" value="<?= e(setting('smsbao_pass')) ?>"></div>
  </div>
  <label>短信宝内容模板（{code} 会替换成验证码）</label>
  <input name="smsbao_content" value="<?= e(setting('smsbao_content', '【知酷课程表】验证码{code}，5分钟内有效')) ?>">

  <div class="row mt">
    <div><label>腾讯云 SecretId</label><input name="tencent_secret_id" value="<?= e(setting('tencent_secret_id')) ?>"></div>
    <div><label>腾讯云 SecretKey</label><input name="tencent_secret_key" type="password" value="<?= e(setting('tencent_secret_key')) ?>"></div>
  </div>
  <div class="row mt">
    <div><label>短信应用 SdkAppId</label><input name="tencent_sms_app_id" value="<?= e(setting('tencent_sms_app_id')) ?>"></div>
    <div><label>签名内容</label><input name="tencent_sign_name" value="<?= e(setting('tencent_sign_name')) ?>"></div>
    <div><label>模板 ID</label><input name="tencent_template_id" value="<?= e(setting('tencent_template_id')) ?>"></div>
    <div><label>地域</label><input name="tencent_region" value="<?= e(setting('tencent_region', 'ap-guangzhou')) ?>"></div>
  </div>
  <p class="muted">腾讯云模板参数需为两个：验证码、有效分钟（{1},{2}）。</p>

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