# ToolShare CMS – Przewodnik

## Logowanie
1. Wejdź na `/admin/login.php` i wprowadź dane dostępowe.
2. Po pięciu nieudanych próbach konto zostanie zablokowane na 15 minut.

## Zarządzanie katalogiem
- **Dodaj narzędzie** – przycisk „Dodaj narzędzie” na stronie głównej panelu.
- **Edycja / Klonowanie / Usuwanie** – akcje dostępne w kolumnie „Akcje”.
- **Bulk enable/disable** – zaznacz narzędzia i użyj odpowiednich przycisków w toolbarze.
- **Import katalogu** – użyj opcji „Importuj” (JSON ze struktury `data.json`).
- **Eksport** – dostępny w formacie JSON oraz CSV.

## Kategorie i podkategorie
- Strona „Kategorie” pozwala dodawać/edytować/usuwać kategorie i podkategorie.
- Zmiana nazwy kategorii modyfikuje slug i wymaga ponownego wygenerowania stron (wykonywane automatycznie po zapisie).

## Backupy
- Strona „Backupy” umożliwia tworzenie nowych kopii zapasowych oraz przywracanie istniejących.
- Przywrócenie backupu natychmiast regeneruje statyczne strony i sitemap.

## Aktywność
- Strona „Aktywność” udostępnia dziennik operacji z filtrowaniem po dacie i użytkowniku.

## Generator statyczny
- Po każdej operacji zapisującej dane uruchamiane są skrypty `scripts/build-static.php` i `scripts/generate-sitemap.php`.
- W logach `storage/logs/build-YYYY-MM-DD.log` znajdziesz status wykonania generatorów.

## Rollback ręczny (FTP)
1. Pobierz wybrany plik z `storage/backups/`.
2. Podmień `data.json` na backupową wersję.
3. Uruchom `php scripts/build-static.php` i `php scripts/generate-sitemap.php`.

## Wskazówki bezpieczeństwa
- Regularnie aktualizuj hasło administratora (`config/config.php`).
- Utrzymuj katalog `storage/` poza publicznym dostępem (sprawdź uprawnienia).
- Rozważ dodanie allowlisty IP w `admin/.htaccess` dla dodatkowej ochrony.
