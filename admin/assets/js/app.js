console.log('ToolShare CMS loaded');

const cms = (() => {
    const modals = new Map();

    function openModal(templateId, initializer) {
        const template = document.getElementById(templateId);
        if (!template) return null;
        const fragment = template.content.cloneNode(true);
        const backdrop = fragment.querySelector('[data-modal-backdrop]');
        if (!backdrop) return null;

        const onBackdropClick = (event) => {
            if (event.target === backdrop) {
                closeModal(templateId);
            }
        };

        const closeButton = fragment.querySelector('[data-modal-close]');
        if (closeButton) {
            closeButton.addEventListener('click', () => closeModal(templateId));
        }

        backdrop.addEventListener('click', onBackdropClick);
        document.body.appendChild(backdrop);
        modals.set(templateId, backdrop);

        if (typeof initializer === 'function') {
            initializer(backdrop.querySelector('form') || backdrop);
        }

        return backdrop;
    }

    function closeModal(templateId) {
        const backdrop = modals.get(templateId);
        if (!backdrop) return;
        backdrop.remove();
        modals.delete(templateId);
    }

    return { openModal, closeModal };
})();

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        catalog: window.cmsCatalog || [],
        csrf: document.querySelector('meta[name="csrf-token"]')?.content || '',
        history: loadHistory(),
    };

    const searchInput = document.getElementById('catalog-search');
    const table = document.getElementById('catalog-table');
    const selectAll = document.getElementById('select-all');
    const historyList = document.getElementById('history-list');

    renderHistory();

    if (searchInput && table) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            filterTable(query);
        });
    }

    if (selectAll && table) {
        selectAll.addEventListener('change', () => {
            table.querySelectorAll('.row-select').forEach((checkbox) => {
                checkbox.checked = selectAll.checked;
            });
        });
    }

    table?.addEventListener('change', (event) => {
        if (event.target.classList.contains('row-select') && !event.target.checked) {
            selectAll.checked = false;
        }
    });

    document.addEventListener('click', (event) => {
        const actionBtn = event.target.closest('[data-action]');
        if (!actionBtn) return;
        const action = actionBtn.dataset.action;
        switch (action) {
            case 'open-new-tool':
                openToolModal();
                break;
            case 'open-import':
                openImportModal();
                break;
            case 'export-json':
                exportCatalog();
                break;
            case 'export-csv':
                exportCsv();
                break;
            case 'edit-tool':
                openToolModal(getRowContext(actionBtn));
                break;
            case 'clone-tool':
                openToolModal(getRowContext(actionBtn), { clone: true });
                break;
            case 'delete-tool':
                deleteTool(getRowContext(actionBtn));
                break;
            case 'bulk-enable':
                bulkToggle(true);
                break;
            case 'bulk-disable':
                bulkToggle(false);
                break;
            case 'add-pricing':
                addPricingRow(actionBtn.closest('form'));
                break;
            case 'remove-pricing':
                actionBtn.closest('.pricing-row')?.remove();
                break;
            case 'open-new-category':
                openCategoryModal();
                break;
            case 'edit-category':
                openCategoryModal({ slug: actionBtn.dataset.category });
                break;
            case 'delete-category':
                deleteCategory(actionBtn.dataset.category);
                break;
            case 'create-backup':
                createBackup();
                break;
            case 'restore-backup':
                restoreBackup(actionBtn.dataset.filename);
                break;
            default:
                break;
        }
    });

    function filterTable(query) {
        if (!table) return;
        table.querySelectorAll('tbody tr').forEach((row) => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    }

    function getRowContext(element) {
        const row = element.closest('tr');
        if (!row) return null;
        return {
            category: row.dataset.category,
            subcategory: row.dataset.subcategory,
            toolId: row.dataset.toolId,
        };
    }

    function findToolRef(ctx) {
        if (!ctx) return null;
        for (const category of state.catalog) {
            if (category.category !== ctx.category) continue;
            for (const subcategory of category.subcategories) {
                if (subcategory.name !== ctx.subcategory) continue;
                const tool = subcategory.tools.find((t) => t.id === ctx.toolId);
                if (tool) {
                    return { category, subcategory, tool };
                }
            }
        }
        return null;
    }

    function openToolModal(context = null, options = {}) {
        cms.openModal('modal-new-tool', (form) => {
            if (!(form instanceof HTMLFormElement)) return;
            populateCategoryField(form, context?.category);
            populateSubcategoryField(form, context?.category, context?.subcategory);
            resetPricing(form);

            if (context) {
                const ref = findToolRef(context);
                if (ref) {
                    form.querySelector('#tool-category').value = cms_slugify(ref.category.category);
                    populateSubcategoryField(form, ref.category.category, ref.subcategory.name);
                    form.querySelector('#tool-subcategory').value = cms_slugify(ref.subcategory.name);
                    form.querySelector('#tool-name').value = ref.tool.name;
                    form.querySelector('#tool-id').value = options.clone ? `${ref.tool.id}-kopiuj` : ref.tool.id;
                    form.querySelector('#tool-image').value = ref.tool.image;
                    form.querySelector('#tool-description').value = ref.tool.description || '';
                    form.querySelector('#tool-deposit').value = ref.tool.deposit ?? '';
                    form.querySelector('input[name="enabled"]').checked = ref.tool.enabled !== false;
                    Object.entries(ref.tool.pricing || {}).forEach(([label, value]) => {
                        addPricingRow(form, label, value);
                    });
                }
            }

            if (!form.querySelector('.pricing-row')) {
                addPricingRow(form, '1-3 Dni', '');
            }

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                await handleToolSubmit(form, context, options);
            }, { once: true });

            form.querySelector('#tool-category').addEventListener('change', (e) => {
                populateSubcategoryField(form, e.target.value, null);
            });
        });
    }

    function populateCategoryField(form, selectedName = null) {
        const select = form.querySelector('#tool-category');
        if (!select) return;
        select.innerHTML = '';
        state.catalog.forEach((category) => {
            const option = document.createElement('option');
            option.value = cms_slugify(category.category);
            option.textContent = category.category;
            if (selectedName && category.category === selectedName) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    function populateSubcategoryField(form, categoryIdentifier, selectedName = null) {
        const select = form.querySelector('#tool-subcategory');
        if (!select) return;
        select.innerHTML = '';
        const category = state.catalog.find((cat) => cms_slugify(cat.category) === cms_slugify(categoryIdentifier));
        if (!category) return;
        category.subcategories.forEach((subcategory) => {
            const option = document.createElement('option');
            option.value = cms_slugify(subcategory.name);
            option.textContent = subcategory.name;
            if (selectedName && subcategory.name === selectedName) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    function resetPricing(form) {
        const container = form.querySelector('#pricing-fields');
        if (container) {
            container.innerHTML = '';
        }
    }

    function addPricingRow(form, label = '', value = '') {
        const container = form.querySelector('#pricing-fields');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'pricing-row';
        row.style.display = 'flex';
        row.style.gap = '0.75rem';
        row.innerHTML = `
            <input class="form-control" type="text" name="pricing_label[]" placeholder="Opis" value="${label}">
            <input class="form-control" type="text" name="pricing_value[]" placeholder="Cena" value="${value}">
            <button type="button" class="btn btn-secondary" data-action="remove-pricing">Usuń</button>
        `;
        container.appendChild(row);
    }

    async function handleToolSubmit(form, context, options) {
        const formData = new FormData(form);
        formData.append('entity', 'tool');
        if (context && !options.clone) {
            formData.append('tool_id', context.toolId);
        }
        const response = await apiRequest('api/save.php', formData);
        pushHistory(`Zapisano narzędzie: ${formData.get('name')}`);
        if (response?.catalog) {
            state.catalog = response.catalog;
        }
        window.location.reload();
    }

    function openImportModal() {
        cms.openModal('modal-import', (form) => {
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const json = form.querySelector('#import-json').value.trim();
                if (!json) return;
                const payload = new FormData();
                payload.append('entity', 'catalog');
                payload.append('catalog_json', json);
                await apiRequest('api/save.php', payload);
                pushHistory('Zaimportowano katalog danych');
                window.location.reload();
            }, { once: true });
        });
    }

    function exportCatalog() {
        const blob = new Blob([JSON.stringify(state.catalog, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `catalog-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }


    function exportCsv() {
        const rows = [['category', 'subcategory', 'tool_id', 'name', 'price_label', 'price_value']];
        state.catalog.forEach((category) => {
            category.subcategories.forEach((subcategory) => {
                subcategory.tools.forEach((tool) => {
                    Object.entries(tool.pricing || { '1-3 Dni': '' }).forEach(([label, value]) => {
                        rows.push([
                            category.category,
                            subcategory.name,
                            tool.id,
                            tool.name,
                            label,
                            typeof value === 'number' ? value.toString() : value,
                        ]);
                    });
                });
            });
        });
        const csv = rows
            .map((cols) => cols.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `catalog-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }

    async function deleteTool(context) {
        if (!context) return;
        if (!confirm(`Czy na pewno usunąć narzędzie ${context.toolId}?`)) return;
        const payload = new FormData();
        payload.append('entity', 'tool');
        payload.append('category_slug', cms_slugify(context.category));
        payload.append('subcategory_slug', cms_slugify(context.subcategory));
        payload.append('tool_id', context.toolId);
        await apiRequest('api/delete.php', payload);
        pushHistory(`Usunięto narzędzie ${context.toolId}`);
        window.location.reload();
    }

    async function bulkToggle(enabled) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const selected = rows.filter((row) => row.querySelector('.row-select')?.checked)
            .map((row) => `${cms_slugify(row.dataset.category)}/${cms_slugify(row.dataset.subcategory)}/${row.dataset.toolId}`);
        if (!selected.length) {
            alert('Nie zaznaczono żadnych narzędzi.');
            return;
        }
        const payload = new FormData();
        payload.append('action', enabled ? 'enable' : 'disable');
        payload.append('entity', 'tool');
        selected.forEach((key) => payload.append('tool_keys[]', key));
        await apiRequest('api/bulk-toggle.php', payload);
        pushHistory(`${enabled ? 'Aktywowano' : 'Ukryto'} ${selected.length} narzędzi`);
        window.location.reload();
    }

    function openCategoryModal(context = null) {
        cms.openModal('modal-category', (form) => {
            if (!(form instanceof HTMLFormElement)) return;
            if (context?.slug) {
                const category = state.catalog.find((cat) => cms_slugify(cat.category) === context.slug);
                if (category) {
                    form.querySelector('#category-name').value = category.category;
                    form.querySelector('#category-image').value = category.image;
                    form.querySelector('#category-original-slug').value = context.slug;
                }
            }
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const payload = new FormData(form);
                payload.append('entity', 'category');
                await apiRequest('api/save.php', payload);
                pushHistory(`Zapisano kategorię ${form.querySelector('#category-name').value}`);
                window.location.reload();
            }, { once: true });
        });
    }

    async function deleteCategory(slug) {
        if (!slug) return;
        if (!confirm('Usunięcie kategorii usunie wszystkie powiązane podkategorie i narzędzia. Kontynuować?')) return;
        const payload = new FormData();
        payload.append('entity', 'category');
        payload.append('category_slug', slug);
        await apiRequest('api/delete.php', payload);
        pushHistory(`Usunięto kategorię ${slug}`);
        window.location.reload();
    }

    async function createBackup() {
        const payload = new FormData();
        payload.append('action', 'create');
        await apiRequest('api/backup-restore.php', payload);
        pushHistory('Utworzono kopię zapasową katalogu');
        window.location.reload();
    }

    async function restoreBackup(filename) {
        if (!filename) return;
        if (!confirm(`Przywrócić backup ${filename}? Spowoduje to nadpisanie aktualnych danych.`)) return;
        const payload = new FormData();
        payload.append('action', 'restore');
        payload.append('filename', filename);
        await apiRequest('api/backup-restore.php', payload);
        pushHistory(`Przywrócono backup ${filename}`);
        window.location.reload();
    }

    async function apiRequest(url, formData) {
        if (!(formData instanceof FormData)) {
            formData = new FormData();
        }
        if (!formData.has('csrf_token')) {
            formData.append('csrf_token', state.csrf);
        }

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.status !== 'ok') {
            alert(data.message || 'Wystąpił błąd podczas komunikacji z serwerem.');
            throw new Error(data.message || 'Request failed');
        }
        return data;
    }

    function loadHistory() {
        try {
            const raw = localStorage.getItem('toolshare_admin_history');
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    function pushHistory(message) {
        const entry = { message, time: new Date().toISOString() };
        state.history.unshift(entry);
        state.history = state.history.slice(0, 10);
        localStorage.setItem('toolshare_admin_history', JSON.stringify(state.history));
        renderHistory();
    }

    function renderHistory() {
        if (!historyList) return;
        historyList.innerHTML = '';
        state.history.forEach((entry) => {
            const li = document.createElement('li');
            li.style.border = '1px solid var(--color-border)';
            li.style.borderRadius = '8px';
            li.style.padding = '0.75rem';
            li.innerHTML = `<strong>${formatDate(entry.time)}</strong><br>${entry.message}`;
            historyList.appendChild(li);
        });
        if (!state.history.length) {
            const li = document.createElement('li');
            li.textContent = 'Brak operacji.';
            historyList.appendChild(li);
        }
    }

    function formatDate(iso) {
        try {
            return new Date(iso).toLocaleString('pl-PL');
        } catch (_) {
            return iso;
        }
    }

    function cms_slugify(value) {
        const map = {
            'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ż':'z','ź':'z',
            'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ż':'z','Ź':'z'
        };
        return String(value)
            .split('')
            .map((ch) => map[ch] ?? ch)
            .join('')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }
});
