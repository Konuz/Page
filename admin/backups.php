<?php
require_once __DIR__ . '/includes/auth.php';

cms_require_login();

$backupDir = cms_path('backups');
$files = [];
if (is_dir($backupDir)) {
    $files = array_values(array_filter(scandir($backupDir), function ($file) use ($backupDir) {
        return !in_array($file, ['.', '..'], true) && is_file($backupDir . '/' . $file);
    }));
    usort($files, fn($a, $b) => strcmp($b, $a));
}

$flash = cms_flash_get();
$title = 'Backupy';

include __DIR__ . '/templates/header.php';
?>
<section class="card">
    <h2 style="margin-top:0;">Dostępne kopie zapasowe</h2>
    <p style="color:var(--color-muted);">Pobierz pliki JSON, aby przywrócić katalog narzędzi.</p>
    <div class="toolbar" style="margin-bottom:1rem;">
        <button class="btn btn-primary" data-action="create-backup">Utwórz backup</button>
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>Nazwa pliku</th>
                <th>Data utworzenia</th>
                <th>Rozmiar</th>
                <th>Akcje</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($files as $file): ?>
            <?php $path = $backupDir . '/' . $file; ?>
            <tr>
                <td data-label="Nazwa"><a href="../storage/backups/<?= htmlspecialchars($file) ?>" download><?= htmlspecialchars($file) ?></a></td>
                <td data-label="Data"><?= date('Y-m-d H:i', filemtime($path)) ?></td>
                <td data-label="Rozmiar"><?= number_format(filesize($path) / 1024, 2) ?> KB</td>
            </tr>
                <td data-label="Akcje" class="table-actions">
                    <button class="btn btn-secondary" data-action="restore-backup" data-filename="<?= htmlspecialchars($file) ?>">Przywróć</button>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</section>
<?php
include __DIR__ . '/templates/footer.php';
