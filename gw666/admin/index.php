<?php
require __DIR__ . '/auth.php';
$title = '概览';
$annCount = (int)db()->query('SELECT COUNT(*) FROM announcements')->fetchColumn();
$ticketOpen = (int)db()->query("SELECT COUNT(*) FROM tickets WHERE status = 'open'")->fetchColumn();
$updateCount = (int)db()->query('SELECT COUNT(*) FROM app_updates')->fetchColumn();
$recent = db()->query('SELECT * FROM tickets ORDER BY id DESC LIMIT 5')->fetchAll();
require __DIR__ . '/layout_top.php';
?>
<div class="grid">
  <div class="stat"><b><?= $annCount ?></b><span>公告数量</span></div>
  <div class="stat"><b><?= $ticketOpen ?></b><span>待处理工单</span></div>
  <div class="stat"><b><?= $updateCount ?></b><span>版本记录</span></div>
</div>
<div class="card mt">
  <h2>最近工单</h2>
  <table><tr><th>标题</th><th>状态</th><th>时间</th></tr>
  <?php foreach ($recent as $t): ?>
    <tr><td><a href="tickets.php?id=<?= (int)$t['id'] ?>"><?= e($t['title']) ?></a></td>
        <td><span class="badge <?= e($t['status']) ?>"><?= e($t['status']) ?></span></td>
        <td><?= e($t['created_at']) ?></td></tr>
  <?php endforeach; ?>
  </table>
</div>
<?php require __DIR__ . '/layout_bottom.php'; ?>
