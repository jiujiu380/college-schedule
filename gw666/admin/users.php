<?php
require __DIR__ . '/auth.php';
ensure_schema();
$title = '用户管理';
$saved = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $id = (int)($_POST['id'] ?? 0);
  $email = trim((string)($_POST['email'] ?? ''));
  $qq = trim((string)($_POST['qq'] ?? ''));
  $wechat = trim((string)($_POST['wechat'] ?? ''));
  $status = ($_POST['status'] ?? 'active') === 'disabled' ? 'disabled' : 'active';
  $newpass = (string)($_POST['new_password'] ?? '');
  if ($id > 0) {
    db()->prepare('UPDATE users SET email = ?, qq = ?, wechat = ?, status = ?, updated_at = NOW() WHERE id = ?')
      ->execute([$email, $qq, $wechat, $status, $id]);
    if (strlen($newpass) >= 6) {
      db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($newpass, PASSWORD_DEFAULT), $id]);
    }
    $saved = true;
  }
}

$q = trim((string)($_GET['q'] ?? ''));
$current = null;
if (isset($_GET['id'])) {
  $st = db()->prepare('SELECT * FROM users WHERE id = ?');
  $st->execute([(int)$_GET['id']]);
  $current = $st->fetch() ?: null;
}
if ($q !== '') {
  $st = db()->prepare('SELECT * FROM users WHERE username LIKE ? OR email LIKE ? OR qq LIKE ? OR wechat LIKE ? ORDER BY id DESC LIMIT 200');
  $like = '%' . $q . '%';
  $st->execute([$like, $like, $like, $like]);
  $rows = $st->fetchAll();
} else {
  $rows = db()->query('SELECT * FROM users ORDER BY id DESC LIMIT 200')->fetchAll();
}
require __DIR__ . '/layout_top.php';
?>
<?php if ($saved): ?><div class="ok">已保存</div><?php endif; ?>

<div class="card">
  <h2>搜索用户</h2>
  <form method="get" class="toolbar">
    <input name="q" value="<?= e($q) ?>" placeholder="用户名 / 邮箱 / QQ / 微信" style="max-width:320px">
    <button type="submit">搜索</button>
  </form>
  <table><tr><th>#</th><th>用户名</th><th>联系方式</th><th>状态</th><th>注册时间</th><th>最近登录</th><th></th></tr>
  <?php foreach ($rows as $r): ?>
    <tr>
      <td><?= (int)$r['id'] ?></td>
      <td><b><?= e($r['username']) ?></b></td>
      <td style="font-size:12px;color:#5b6474">
        <?= e($r['email'] ?? '') ?><br><?= e($r['qq'] ?? '') ?><?= $r['qq'] ? ' (QQ)' : '' ?><br><?= e($r['wechat'] ?? '') ?><?= $r['wechat'] ? ' (微信)' : '' ?>
      </td>
      <td><span class="badge <?= ($r['status'] ?? 'active') === 'active' ? '' : 'open' ?>"><?= ($r['status'] ?? 'active') === 'active' ? '正常' : '停用' ?></span></td>
      <td><?= e($r['created_at'] ?? '') ?></td>
      <td><?= e($r['last_login'] ?? '—') ?></td>
      <td><a href="?id=<?= (int)$r['id'] ?>">查看 / 编辑</a></td>
    </tr>
  <?php endforeach; ?>
  </table>
</div>

<?php if ($current): ?>
<div class="card">
  <h2>用户 #<?= (int)$current['id'] ?> · <?= e($current['username']) ?></h2>
  <?php
    $cloud = db()->prepare('SELECT payload, updated_at FROM user_data WHERE user_id = ?');
    $cloud->execute([(int)$current['id']]);
    $c = $cloud->fetch();
  ?>
  <p class="muted">云端数据：<?= $c ? (number_format(strlen($c['payload']) / 1024, 1) . ' KB · 更新于 ' . $c['updated_at']) : '暂无' ?></p>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="id" value="<?= (int)$current['id'] ?>">
    <div class="row">
      <div><label>邮箱</label><input name="email" value="<?= e($current['email'] ?? '') ?>"></div>
      <div><label>QQ</label><input name="qq" value="<?= e($current['qq'] ?? '') ?>"></div>
    </div>
    <div class="row mt">
      <div><label>微信</label><input name="wechat" value="<?= e($current['wechat'] ?? '') ?>"></div>
      <div><label>状态</label>
        <select name="status">
          <option value="active" <?= ($current['status'] ?? 'active') === 'active' ? 'selected' : '' ?>>正常</option>
          <option value="disabled" <?= ($current['status'] ?? 'active') === 'disabled' ? 'selected' : '' ?>>停用</option>
        </select>
      </div>
    </div>
    <label class="mt">重置密码（留空不改，至少 6 位）</label>
    <input name="new_password" type="text" placeholder="例如 abc123456">
    <button class="mt" type="submit">保存</button>
  </form>
</div>
<?php endif; ?>
<?php require __DIR__ . '/layout_bottom.php'; ?>