<?php
/** @var array $catalog */
?>
<section class="card">
    <h2 style="margin-top:0;">Kategorie</h2>
    <div class="toolbar">
        <button class="btn btn-primary" data-action="open-new-category">Dodaj kategorię</button>
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>Nazwa</th>
                <th>Slug</th>
                <th>Obraz</th>
                <th>Podkategorie</th>
                <th>Akcje</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ($catalog as $category): ?>
            <?php $slug = cms_slugify($category['category']); ?>
            <tr>
                <td data-label="Nazwa"><strong><?= htmlspecialchars($category['category']) ?></strong></td>
                <td data-label="Slug"><code><?= htmlspecialchars($slug) ?></code></td>
                <td data-label="Obraz">
                    <code><?= htmlspecialchars($category['image'] ?? '') ?></code>
                </td>
                <td data-label="Podkategorie">
                    <?= count($category['subcategories'] ?? []) ?>
                </td>
                <td data-label="Akcje" class="table-actions">
                    <button class="btn btn-secondary" data-action="edit-category" data-category="<?= htmlspecialchars($slug) ?>">Edytuj</button>
                    <button class="btn btn-secondary" data-action="delete-category" data-category="<?= htmlspecialchars($slug) ?>">Usuń</button>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</section>

<template id="modal-category">
    <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Kategoria</h3>
                <button class="modal-close" data-modal-close>&times;</button>
            </div>
            <div class="modal-scrollable">
                <form id="form-category" class="form-grid">
                <?= cms_csrf_field() ?>
                <input type="hidden" name="original_slug" id="category-original-slug">
                <div class="form-group">
                    <label for="category-name">Nazwa kategorii</label>
                    <input type="text" id="category-name" name="category" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="category-image">Ścieżka obrazu</label>
                    <input type="text" id="category-image" name="image" class="form-control" required>
                </div>
                <div class="form-group" style="display:flex; gap: 0.75rem; justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary" data-modal-close>Anuluj</button>
                    <button type="submit" class="btn btn-primary">Zapisz</button>
                </div>
                </form>
            </div>
        </div>
    </div>
</template>

<template id="modal-subcategory">
    <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Podkategoria</h3>
                <button class="modal-close" data-modal-close>&times;</button>
            </div>
            <div class="modal-scrollable">
                <form id="form-subcategory" class="form-grid">
                <?= cms_csrf_field() ?>
                <input type="hidden" name="category_slug" id="subcategory-category-slug">
                <input type="hidden" name="original_slug" id="subcategory-original-slug">
                <div class="form-group">
                    <label for="subcategory-name">Nazwa podkategorii</label>
                    <input type="text" id="subcategory-name" name="name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="subcategory-description">Opis (opcjonalnie)</label>
                    <textarea id="subcategory-description" name="description" class="form-control" rows="4"></textarea>
                </div>
                <div class="form-group" style="display:flex; gap: 0.75rem; justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary" data-modal-close>Anuluj</button>
                    <button type="submit" class="btn btn-primary">Zapisz</button>
                </div>
                </form>
            </div>
        </div>
    </div>
</template>
