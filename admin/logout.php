<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/csrf.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    cms_assert_csrf();
    cms_logout();
}

header('Location: login.php');
exit;
