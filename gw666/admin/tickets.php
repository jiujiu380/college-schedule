<?php
require __DIR__ . '/auth.php';
$title = '工单';
$current = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $id = (int)($_POST['id'] ?? 0);
  $reply = (string)($_POST['reply'] ?? '');
  $status = ($_POST['status'] ?? 'open') === 'closed' ? 'closed' : 'open';
  db()->prepare('UPDATE tickets SET reply = ?, status = ?, updated_at = NOW() WHERE id = ?')->execute([$reply, $status, $id]);
  header('Location: tickets.php?id=' . $id);
  exit;
}
if (isset($_GET['id'])) {
  $st = db()->prepare('SELECT * FROM tickets WHERE id = ?');
  $st->execute([(int)$_GET['id']]);
  $current = $st->fetch() ?: null;
}
$rows = db()->query('SELECT * FROM tickets ORDER BY id DESC LIMIT 100')->fetchAll();
require __DIR__ . '/layout_top.php';
?>
<div class="card">
  <h2>工单列表</h2>
  <table><tr><th>#</th><th>标题</th><th>联系方式</th><th>状态</th><th>时间</th></tr>
  <?php foreach ($rows as $r): ?>
    <tr><td><?= (int)$r['id'] ?></td><td><a href="?id=<?= (int)$r['id'] ?>"><?= e($r['title']) ?></a></td><td><?= e($r['contact']) ?></td>
      <td><span class="badge <?= e($r['status']) ?>"><?= e($r['status']) ?></span></td><td><?= e($r['created_at']) ?></td></tr>
  <?php endforeach; ?>
  </table>
</div>

<?php if ($current): ?>
<div class="card">
  <h2>#<?= (int)$current['id'] ?> <?= e($current['title']) ?></h2>
  <p class="muted">设备：<?= e($current['device_id']) ?> · 联系：<?= e($current['contact']) ?> · <?= e($current['created_at']) ?></p>
  <div class="rich" style="background:#f8fafc"><?= nl2br(e($current['content'])) ?></div>
  <form method="post" class="mt">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="id" value="<?= (int)$current['id'] ?>">
    <label>回复</label><textarea name="reply"><?= e($current['reply'] ?? '') ?></textarea>
    <label class="mt"><input type="checkbox" name="status" value="closed" style="width:auto" <?= $current['status'] === 'closed' ? 'checked' : '' ?>> 标记为已解决</label>
    <button class="mt" type="submit">保存回复</button>
  </form>
</div>
<?php endif; ?>
<?php require __DIR__ . '/layout_bottom.php'; ?>
