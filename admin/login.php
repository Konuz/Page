<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';

if (cms_is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = null;
$locked = cms_is_login_locked();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$locked) {
    cms_assert_csrf();
    $username = trim((string) ($_POST['username'] ?? 'admin'));
    $password = (string) ($_POST['password'] ?? '');

    if (cms_login($username, $password)) {
        header('Location: index.php');
        exit;
    }

    $error = 'Nieprawidłowe dane logowania.';
}

$remaining = $locked ? cms_login_lock_remaining_seconds() : 0;
?><!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Logowanie | ToolShare CMS</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap">
    <link rel="stylesheet" href="<?= cms_asset('admin/assets/css/app.css') ?>">
    <style>
        body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .login-card { width: min(420px, 100%); }
    </style>
</head>
<body>
    <div class="card login-card">
        <h2>ToolShare CMS</h2>
        <p style="color: var(--color-muted);">Zaloguj się, aby zarządzać katalogiem narzędzi.</p>
        <?php if ($error): ?>
            <div class="flash flash-error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        <?php if ($locked): ?>
            <div class="flash flash-error">Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za <?= $remaining ?> s.</div>
        <?php endif; ?>
        <form method="post" class="form-grid">
            <?= cms_csrf_field() ?>
            <div class="form-group">
                <label for="username">Użytkownik</label>
                <input class="form-control" type="text" id="username" name="username" value="<?= htmlspecialchars($_POST['username'] ?? 'admin') ?>" autocomplete="username" required>
            </div>
            <div class="form-group">
                <label for="password">Hasło</label>
                <input class="form-control" type="password" id="password" name="password" autocomplete="current-password" required>
            </div>
            <button class="btn btn-primary" type="submit" <?= $locked ? 'disabled' : '' ?>>Zaloguj</button>
        </form>
    </div>
</body>
</html>
