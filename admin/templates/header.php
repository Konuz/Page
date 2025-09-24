<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_once __DIR__ . '/../includes/csrf.php';
$title = $title ?? 'Panel administracyjny';
$csrfMetaToken = cms_csrf_token();
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="utf-8">
    <meta name="csrf-token" content="<?= htmlspecialchars($csrfMetaToken, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($title) ?> | ToolShare CMS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer">
    <link rel="stylesheet" href="<?= cms_asset('admin/assets/css/app.css') ?>">
</head>
<body>
<div class="admin-shell">
    <header class="admin-header">
        <div class="container">
            <h1 class="admin-title">ToolShare CMS</h1>
            <nav class="admin-nav">
                <a href="index.php">Narzędzia</a>
                <a href="categories.php">Kategorie</a>
                <a href="backups.php">Backupy</a>
                <a href="activity.php">Aktywność</a>
                <form action="logout.php" method="post" style="margin:0;">
                    <?php if (function_exists('cms_csrf_field')) { echo cms_csrf_field(); } ?>
                    <button class="btn btn-secondary" type="submit">Wyloguj</button>
                </form>
            </nav>
        </div>
    </header>
    <main class="admin-main">
<?php if (!empty($flash)): ?>
        <div class="flash <?= htmlspecialchars($flash['type'] ?? 'flash-success') ?>">
            <?= htmlspecialchars($flash['message'] ?? '') ?>
        </div>
<?php endif; ?>
