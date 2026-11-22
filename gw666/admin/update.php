<?php
require __DIR__ . '/auth.php';
$title = '版本更新';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $version = trim((string)($_POST['version'] ?? ''));
  $url = trim((string)($_POST['url'] ?? ''));
  $notes = (string)($_POST['notes'] ?? '');
  $force = isset($_POST['force']) ? 1 : 0;
  $channel = ($_POST['channel'] ?? 'site') === 'github' ? 'github' : 'site';
  if ($version !== '' && $url !== '') {
    $st = db()->prepare('INSERT INTO app_updates (version, url, notes, is_force, update_channel, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
    $st->execute([$version, $url, $notes, $force, $channel]);
  }
  header('Location: update.php');
  exit;
}
if (isset($_GET['delete'])) {
  db()->prepare('DELETE FROM app_updates WHERE id = ?')->execute([(int)$_GET['delete']]);
  header('Location: update.php');
  exit;
}
$rows = db()->query('SELECT * FROM app_updates ORDER BY id DESC')->fetchAll();
require __DIR__ . '/layout_top.php';
?>
<div class="card">
  <h2>推送新版本</h2>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <div class="row">
      <div><label>版本号</label><input name="version" placeholder="1.0.3" required></div>
      <div><label>渠道</label><select name="channel"><option value="site">官网</option><option value="github">GitHub</option></select></div>
    </div>
    <label>下载地址</label><input name="url" placeholder="https://class.zcoow.cn/downloads/zhiku-1.0.3.apk" required>
    <label>更新说明</label><textarea name="notes"></textarea>
    <label class="mt"><input type="checkbox" name="force" style="width:auto"> 强制更新</label>
    <button class="mt" type="submit">推送</button>
  </form>
</div>
<div class="card">
  <h2>版本记录</h2>
  <table><tr><th>版本</th><th>渠道</th><th>强制</th><th>时间</th><th></th></tr>
  <?php foreach ($rows as $r): ?>
    <tr><td><?= e($r['version']) ?></td><td><?= e($r['update_channel']) ?></td><td><?= $r['is_force'] ? '是' : '' ?></td><td><?= e($r['created_at']) ?></td>
      <td><a href="?delete=<?= (int)$r['id'] ?>" onclick="return confirm('删除？')">删除</a></td></tr>
  <?php endforeach; ?>
  </table>
</div>
<?php require __DIR__ . '/layout_bottom.php'; ?>
