<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';

cms_require_login();

$logDir = cms_path('logs');
$files = glob($logDir . '/activity-*.log') ?: [];
$dates = array_map(function ($file) {
    return substr(basename($file), strlen('activity-'), 10);
}, $files);
rsort($dates);

$selectedDate = $_GET['date'] ?? ($dates[0] ?? date('Y-m-d'));
$selectedUser = trim($_GET['user'] ?? '');

$logPath = $logDir . '/activity-' . $selectedDate . '.log';
$entries = [];
if (is_file($logPath)) {
    $lines = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $row = json_decode($line, true);
        if (!is_array($row)) {
            continue;
        }
        $user = $row['context']['user'] ?? 'system';
        if ($selectedUser && strtolower($selectedUser) !== strtolower((string) $user)) {
            continue;
        }
        $entries[] = [
            'time' => $row['time'] ?? '',
            'action' => $row['context']['action'] ?? ($row['message'] ?? ''),
            'message' => $row['message'] ?? '',
            'user' => $user,
            'ip' => $row['context']['ip'] ?? '',
            'details' => $row['context']['details'] ?? [],
        ];
    }
}

$flash = cms_flash_get();
$title = 'Aktywność';

include __DIR__ . '/templates/header.php';
?>
<section class="card">
    <h2 style="margin-top:0;">Dziennik aktywności</h2>
    <form method="get" class="toolbar" style="margin-bottom:1rem; gap:1rem;">
        <div class="form-group" style="margin:0;">
            <label for="date">Data</label>
            <select class="form-control" id="date" name="date">
                <?php foreach ($dates as $date): ?>
                    <option value="<?= htmlspecialchars($date) ?>" <?= $date === $selectedDate ? 'selected' : '' ?>><?= htmlspecialchars($date) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="form-group" style="margin:0;">
            <label for="user">Użytkownik</label>
            <input class="form-control" type="text" id="user" name="user" value="<?= htmlspecialchars($selectedUser) ?>" placeholder="np. admin">
        </div>
        <button class="btn btn-primary" type="submit" style="align-self:flex-end;">Filtruj</button>
    </form>

    <table class="table">
        <thead>
            <tr>
                <th>Godzina</th>
                <th>Użytkownik</th>
                <th>Akcja</th>
                <th>IP</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($entries as $entry): ?>
            <tr>
                <td data-label="Godzina"><?= htmlspecialchars($entry['time']) ?></td>
                <td data-label="Użytkownik"><?= htmlspecialchars($entry['user']) ?></td>
                <td data-label="Akcja"><?= htmlspecialchars($entry['message']) ?></td>
                <td data-label="IP"><?= htmlspecialchars($entry['ip']) ?></td>
            </tr>
        <?php endforeach; ?>
        <?php if (!$entries): ?>
            <tr><td colspan="4">Brak zdarzeń dla wybranych filtrów.</td></tr>
        <?php endif; ?>
        </tbody>
    </table>
</section>
<?php
include __DIR__ . '/templates/footer.php';
