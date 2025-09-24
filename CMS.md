# CMS Implementation Plan

## Checkpoint
- [x] Analyze existing JSON-driven system and outline migration strategy.

## To-Do

### Architektura i Konfiguracja
- [x] Zaprojektować docelową strukturę katalogów (`admin/`, `storage/`, `config/`, `scripts/`, `templates-static/`) oraz przygotować `config/config.php` z hasłem i ścieżkami.
- [x] Utworzyć `.htaccess` dla `/admin/` (wymuszenie HTTPS, `Options -Indexes`) i rozważyć allowlistę IP.
- [x] Przygotować katalogi `storage/backups`, `storage/logs`, `storage/tmp` z odpowiednimi uprawnieniami i polityką rotacji.

### Warstwa Bezpieczeństwa
- [x] Opracować moduł sesji i autoryzacji (`admin/includes/auth.php`): logowanie z `password_hash`, limit prób, ustawienia ciasteczek (`SameSite`, `HttpOnly`).
- [x] Zaimplementować obsługę CSRF (`admin/includes/csrf.php`), walidację wejścia i centralną obsługę błędów API.
- [x] Zaprojektować logowanie aktywności (`storage/logs/admin.log`) dla operacji panelowych.

### Warstwa Danych
- [x] Utworzyć klasy pomocnicze (`JsonStorage`, `slugify`, walidatory) obsługujące `data.json` z blokadą `LOCK_EX` i kopiami w `storage/backups`.
- [x] Zaimplementować walidację struktur (kategorie/podkategorie/narzędzia, slug ID, ceny, `enabled`, `description`, `deposit`).
- [x] Przygotować funkcje importu/eksportu oraz operacji bulk (masowe włącz/wyłącz, zmiana cen).

### Panel CMS (UI + API)
- [x] Przygotować layout panelu (`admin/assets/css/app.css`, `admin/templates/header/footer.php`) z responsywnym układem.
- [x] Zaimplementować widoki list i formularzy CRUD dla kategorii, podkategorii i narzędzi.
- [x] Utworzyć endpointy API (`admin/api/save.php`, `delete.php`, `bulk-toggle.php`, `backup-restore.php`, `upload-image.php`) z obsługą błędów i logowaniem.
- [x] Dodać wyszukiwarkę, filtry, historię operacji i modale potwierdzeń w panelu.
- [x] Obsłużyć upload obrazów `.webp` (walidacja MIME, generowanie nazw) do `images/`.

### Generator Statyczny (PHP)
- [x] Przenieść logikę prerenderingu do `scripts/build-static.php`: slugify, wypełnianie szablonów, JSON-LD, meta tagi.
- [x] Przygotować szablony PHP (`templates-static/category.php`, `subcategory.php`, `tool.php`) odzwierciedlające obecne HTML.
- [x] Dodać generowanie sitemap w PHP (`scripts/generate-sitemap.php`) w oparciu o aktualne dane.
- [x] Zintegrować generator z CMS: uruchamiać po zapisie danych, logować sukces/błędy.
- [x] Przygotować `.htaccess` w `narzedzia/` dla ładnych URL-i (DirectoryIndex, fallback).

### Integracja i Kompatybilność
- [x] Zweryfikować i zaktualizować `script.js` pod dodatkowe pola (`description`, `enabled`, `deposit`).
- [x] Upewnić się, że `robots.txt`, `style.css`, `script.js` pozostają kompatybilne; minimalne poprawki CSS.
- [x] Ustalić strategię współistnienia z Node-prerenderem (fallback lub usunięcie po testach).
- [x] Przetestować wyszukiwarkę, karuzelę „Zobacz również” i breadcrumb po zmianach danych.

### Testy i QA
- [x] Przygotować checklistę testów (CRUD, backup/restore, generacja statyczna, sitemap, front, SEO, responsywność panelu).
- [x] Dodać testy automatyczne PHP dla walidatorów i manualne scenariusze panelu.
- [x] Skonfigurować Playwright dla głównych ścieżek nawigacji.
- [x] Wykonać audyt Lighthouse/WebPageTest po generacji statycznej.
- [x] Zapewnić mechanizm rollbacku (przywracanie backupów przez panel/FTP).

### Dodatkowe Funkcje
- [x] Zaimplementować export/import (JSON/CSV) z walidacją.
- [x] Dodać dziennik aktywności z filtrowaniem po użytkownikach i datach.
- [x] Rozszerzyć panel o tryb mobilny, masowe operacje, wyszukiwarkę w panelu.
- [x] Przygotować dokumentację użytkownika i administratora.

### Wdrożenie i Utrzymanie
- [x] Opracować procedurę deployu przez FTP (kolejność działań, testy końcowe).
- [x] Zaplanować monitoring integralności `data.json` i logów błędów PHP.
- [x] Zdefiniować politykę aktualizacji haseł i backupów.
- [x] Po stabilizacji uporządkować lub usunąć stare skrypty Node, aktualizując dokumentację.

## Notes
- Node prerender/generate scripts pozostają jako zapasowy fallback do czasu pełnego zweryfikowania wersji PHP. W produkcji wywoływane są wyłącznie nowe skrypty PHP; stare można usunąć po okresie przejściowym.
