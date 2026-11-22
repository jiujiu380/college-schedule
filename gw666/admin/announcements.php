<?php
require __DIR__ . '/auth.php';
$title = '公告管理';
$edit = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  check_csrf();
  $id = (int)($_POST['id'] ?? 0);
  $t = trim((string)($_POST['title'] ?? ''));
  $c = (string)($_POST['content'] ?? '');
  $pinned = isset($_POST['pinned']) ? 1 : 0;
  if ($t !== '') {
    if ($id > 0) {
      $st = db()->prepare('UPDATE announcements SET title = ?, content = ?, pinned = ? WHERE id = ?');
      $st->execute([$t, $c, $pinned, $id]);
    } else {
      $st = db()->prepare('INSERT INTO announcements (title, content, pinned, created_at) VALUES (?, ?, ?, NOW())');
      $st->execute([$t, $c, $pinned]);
    }
  }
  header('Location: announcements.php');
  exit;
}

if (isset($_GET['delete'])) {
  $st = db()->prepare('DELETE FROM announcements WHERE id = ?');
  $st->execute([(int)$_GET['delete']]);
  header('Location: announcements.php');
  exit;
}
if (isset($_GET['edit'])) {
  $st = db()->prepare('SELECT * FROM announcements WHERE id = ?');
  $st->execute([(int)$_GET['edit']]);
  $edit = $st->fetch() ?: null;
}
$rows = db()->query('SELECT * FROM announcements ORDER BY pinned DESC, id DESC')->fetchAll();
require __DIR__ . '/layout_top.php';
?>
<div class="card">
  <h2><?= $edit ? '编辑公告' : '发布公告' ?></h2>
  <form method="post" id="annForm">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="id" value="<?= (int)($edit['id'] ?? 0) ?>">
    <input type="hidden" name="content" id="contentInput">
    <label>标题</label><input name="title" value="<?= e($edit['title'] ?? '') ?>" required>
    <label>正文（富文本）</label>
    <div class="toolbar">
      <button type="button" data-cmd="bold">B</button>
      <button type="button" data-cmd="italic">I</button>
      <button type="button" data-cmd="underline">U</button>
      <button type="button" data-cmd="insertUnorderedList">• 列表</button>
      <button type="button" data-cmd="removeFormat">清除格式</button>
    </div>
    <div class="rich" id="editor" contenteditable="true"><?= $edit['content'] ?? '' ?></div>
    <label class="mt"><input type="checkbox" name="pinned" style="width:auto" <?= !empty($edit['pinned']) ? 'checked' : '' ?>> 置顶</label>
    <button class="mt" type="submit"><?= $edit ? '保存修改' : '发布' ?></button>
    <?php if ($edit): ?><a class="btn ghost" href="announcements.php" style="margin-left:8px">取消</a><?php endif; ?>
  </form>
</div>
<script>
document.querySelectorAll('[data-cmd]').forEach(function(b){
  b.addEventListener('click', function(){ document.execCommand(b.dataset.cmd, false, null); document.getElementById('editor').focus(); });
});
document.getElementById('annForm').addEventListener('submit', function(){ document.getElementById('contentInput').value = document.getElementById('editor').innerHTML; });
</script>
<div class="card">
  <h2>公告列表</h2>
  <table><tr><th>标题</th><th>置顶</th><th>时间</th><th>操作</th></tr>
  <?php foreach ($rows as $r): ?>
    <tr><td><?= e($r['title']) ?></td><td><?= $r['pinned'] ? '是' : '' ?></td><td><?= e($r['created_at']) ?></td>
      <td><a href="?edit=<?= (int)$r['id'] ?>">编辑</a> · <a href="?delete=<?= (int)$r['id'] ?>" onclick="return confirm('确定删除？')">删除</a></td></tr>
  <?php endforeach; ?>
  </table>
</div>
<?php require __DIR__ . '/layout_bottom.php'; ?>
