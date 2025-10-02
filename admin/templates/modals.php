<template id="modal-new-tool">
    <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Dodaj narzędzie</h3>
                <button class="modal-close" data-modal-close>&times;</button>
            </div>
            <div class="modal-scrollable">
                <form id="form-new-tool" class="form-grid">
                <?= cms_csrf_field() ?>
                <div class="form-group">
                    <label for="tool-category">Kategoria</label>
                    <select id="tool-category" name="category_slug" class="form-control" required></select>
                </div>
                <div class="form-group">
                    <label for="tool-subcategory">Podkategoria</label>
                    <select id="tool-subcategory" name="subcategory_slug" class="form-control" required></select>
                </div>
                <div class="form-group">
                    <label for="tool-name">Nazwa narzędzia</label>
                    <input type="text" class="form-control" name="name" id="tool-name" required>
                </div>
                <div class="form-group">
                    <label for="tool-id">ID narzędzia</label>
                    <input type="text" class="form-control" name="id" id="tool-id" required>
                    <small style="color: var(--color-muted);">Użyj małych liter i myślników, np. "szlifierka-metabo".</small>
                </div>
                <div class="form-group">
                    <label for="tool-image">Ścieżka obrazu</label>
                    <div class="tool-image-field">
                        <input type="text" class="form-control tool-image-input" name="image" id="tool-image" placeholder="images/narzedzie.webp" required>
                        <input type="file" id="tool-image-file" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-primary" data-action="browse-image" title="Wybierz obraz">
                            <i class="fas fa-folder-open"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="tool-description">Opis (opcjonalnie)</label>
                    <textarea class="form-control" name="description" id="tool-description" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label>Cennik</label>
                    <div id="pricing-fields" class="form-grid"></div>
                    <button type="button" class="btn btn-secondary" data-action="add-pricing">Dodaj pozycję</button>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="enabled" value="1" checked> Widoczne w katalogu
                    </label>
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

<template id="modal-import">
    <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Import katalogu</h3>
                <button class="modal-close" data-modal-close>&times;</button>
            </div>
            <div class="modal-scrollable">
                <form id="form-import" class="form-grid">
                <?= cms_csrf_field() ?>
                <div class="form-group">
                    <label for="import-json">Wklej plik JSON</label>
                    <textarea class="form-control" id="import-json" name="json" rows="10" required></textarea>
                </div>
                <div class="form-group" style="display:flex; gap: 0.75rem; justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary" data-modal-close>Anuluj</button>
                    <button type="submit" class="btn btn-primary">Importuj</button>
                </div>
                </form>
            </div>
        </div>
    </div>
</template>
