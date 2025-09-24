# Procedura deployu (FTP)

1. **Przygotowanie lokalne**
   - Uruchom `php scripts/build-static.php` oraz `php scripts/generate-sitemap.php`.
   - Wykonaj testy: `php tests/php/validation.test.php`.
   - Zweryfikuj checklistę w `tests/checklist.md`.

2. **Transfer plików**
   - Wgraj przez FTP katalogi: `admin/`, `scripts/`, `templates-static/`, `storage/` (z zachowaniem struktury), `docs/` (opcjonalnie informacyjne).
   - Wgraj zaktualizowane pliki w katalogu głównym (`data.json`, `CMS.md`, statyczne HTML jeśli zmodyfikowane).
   - Upewnij się, że uprawnienia katalogów `storage/backups`, `storage/logs`, `storage/tmp` wynoszą co najmniej `750`, a plików `640`.

3. **Po wdrożeniu**
   - Zaloguj się do `/admin/`, wykonaj próbne zapisanie danych.
   - Sprawdź logi w `storage/logs/` (`build-*`, `activity-*`).
   - Otwórz losową stronę narzędzia pod `https://toolshare.com.pl/narzedzia/...` i sprawdź breadcrumb, canonical oraz meta tagi.

4. **Roll-back**
   - W razie potrzeby przywróć ostatni backup z `storage/backups/` i uruchom generator statyczny.
   - Zaktualizuj dziennik wdrożeń o przyczynę i zakres zmian.
