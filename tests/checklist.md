# ToolShare CMS – Lista kontrolna testów

## Po każdej zmianie danych
- [ ] Zalogowanie do panelu admina i weryfikacja, że sesja zostaje utworzona.
- [ ] Dodanie nowego narzędzia, zapis, weryfikacja obecności w katalogu i na stronie statycznej.
- [ ] Edycja istniejącego narzędzia (cena, opis), sprawdzenie aktualizacji w `data.json` i `narzedzia/...`.
- [ ] Usunięcie narzędzia oraz kontrola, czy zniknęło z wyszukiwarki i listy `narzedzia/`.
- [ ] Masowe ukrycie i przywrócenie narzędzi (bulk enable/disable).

## Backup i import
- [ ] Utworzenie backupu z poziomu panelu i pobranie pliku.
- [ ] Przywrócenie backupu oraz weryfikacja, że generator wygenerował nowe strony.
- [ ] Import katalogu z pliku JSON, kontrola poprawności danych i sitemap.

## Statyczne generowanie
- [ ] Uruchomienie `php scripts/build-static.php` i `php scripts/generate-sitemap.php` bez błędów.
- [ ] Weryfikacja, że `narzedzia/<slug>/index.html` zawiera aktualne breadcrumbs, canonical oraz karty.

## Frontend
- [ ] Test wyszukiwarki (`script.js`) – nowe pola `description`, `deposit`, `enabled`.
- [ ] Karuzela „Zobacz również” na stronie narzędzia po aktualizacji danych.
- [ ] Breadcrumby dla kategorii / podkategorii / narzędzia.

## Responsywność i panel
- [ ] Widok panelu na urządzeniach mobilnych (<= 640 px) – tabela i modale.
- [ ] Obsługa formularzy (dodawanie/edycja kategorii, podkategorii, narzędzi).
- [ ] Historia operacji, bulk akcje, potwierdzenia usunięcia.

## SEO & dostępność
- [ ] Sprawdzenie aktualizacji `sitemap.xml` oraz `robots.txt` (dostęp do `data.json`).
- [ ] Minimalny audyt Lighthouse (desktop + mobile) dla nowo wygenerowanej strony narzędzia.
- [ ] Walidacja schema.org (BreadcrumbList, Product) na stronie narzędzia.
