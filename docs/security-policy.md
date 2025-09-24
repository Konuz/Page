# Polityka bezpieczeństwa ToolShare CMS

## Hasła
- Hasło administratora zmieniaj co 90 dni (`config/config.php`).
- Wymóg: minimum 12 znaków, kombinacja liter, cyfr i znaków specjalnych.
- Po zmianie hasła zaktualizuj zmienną środowiskową `CMS_ADMIN_HASH` (jeśli używana).

## Backupy
- Automatyczny backup wykonywany przed każdą operacją zapisu (patrz `storage/backups/`).
- Dodatkowo wykonuj pełny backup raz w tygodniu i przechowuj poza serwerem.
- Przeglądaj oraz czyść stare backupy (>30 dni), aby ograniczyć zużycie przestrzeni.

## Audyty
- Raz w miesiącu sprawdź logi `activity-*.log` pod kątem nieautoryzowanych działań.
- Uruchom skrypty `scripts/check-integrity.php` w cronie codziennie i monitoruj wyniki.
