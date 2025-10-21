<?php
/** @var array $catalog */
?>
<section class="card">
    <div class="toolbar">
        <div class="search">
            <i class="fas fa-search"></i>
            <input type="search" id="catalog-search" class="form-control" placeholder="Szukaj narzędzia, kategorii lub ID" autocomplete="off">
        </div>
        <div class="actions">
            <button class="btn btn-secondary" data-action="open-import">Importuj</button>
            <button class="btn btn-secondary" data-action="export-json">Eksportuj JSON</button>
            <button class="btn btn-secondary" data-action="export-csv">Eksportuj CSV</button>
            <button class="btn btn-secondary" data-action="bulk-enable">Aktywuj zaznaczone</button>
            <button class="btn btn-secondary" data-action="bulk-disable">Ukryj zaznaczone</button>
            <button class="btn btn-primary" data-action="open-new-tool">Dodaj narzędzie</button>
        </div>
    </div>

    <table class="table" id="catalog-table">
        <thead>
        <tr>
            <th style="width: 3rem; text-align: left; padding-left: 1rem;"><input type="checkbox" id="select-all"></th>
            <th>Narzędzie</th>
            <th>Kategoria</th>
            <th>Podkategoria</th>
            <th>ID</th>
            <th>Status</th>
            <th style="width: 120px;">Akcje</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($catalog as $category): ?>
            <?php foreach ($category['subcategories'] as $subcategory): ?>
                <?php foreach ($subcategory['tools'] as $tool): ?>
                    <?php $enabled = !isset($tool['enabled']) || $tool['enabled'] !== false; ?>
                    <tr data-tool-id="<?= htmlspecialchars($tool['id']) ?>"
                        data-category="<?= htmlspecialchars($category['category']) ?>"
                        data-subcategory="<?= htmlspecialchars($subcategory['name']) ?>">
                        <td data-label="Zaznacz">
                            <input type="checkbox" class="row-select">
                        </td>
                        <td data-label="Narzędzie" class="cell-truncate">
                            <strong><?= htmlspecialchars($tool['name']) ?></strong>
                        </td>
                        <td data-label="Kategoria" class="cell-truncate"><?= htmlspecialchars($category['category']) ?></td>
                        <td data-label="Podkategoria" class="cell-truncate"><?= htmlspecialchars($subcategory['name']) ?></td>
                        <td data-label="ID">
                            <code><?= htmlspecialchars($tool['id']) ?></code>
                        </td>
                        <td data-label="Status">
                            <span class="badge <?= $enabled ? 'badge-success' : 'badge-muted' ?>">
                                <?= $enabled ? 'Aktywne' : 'Ukryte' ?>
                            </span>
                        </td>
                        <td class="table-actions" data-label="Akcje">
                            <button class="btn btn-secondary" data-action="edit-tool">Edytuj</button>
                            <button class="btn btn-secondary" data-action="clone-tool">Klonuj</button>
                            <button class="btn btn-secondary" data-action="delete-tool">Usuń</button>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endforeach; ?>
        <?php endforeach; ?>
        </tbody>
    </table>
</section>

<section class="card" id="activity-history" style="margin-top:1.5rem;">
    <h2 style="margin-top:0;">Ostatnie operacje</h2>
    <ul id="history-list" style="list-style:none;padding:0;margin:0;display:grid;gap:0.5rem;"></ul>
</section>
