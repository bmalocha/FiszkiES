# Specyfikacja Biznesowa: Nawigacja Mobilna

## Cel

Poprawa użyteczności i dostępności nawigacji w aplikacji FiszkiES na urządzeniach mobilnych poprzez wprowadzenie dolnego paska nawigacyjnego, przy jednoczesnym zachowaniu obecnego wyglądu i funkcjonalności na urządzeniach desktopowych.

## Wymagania

### 1. Komponent `TopNavigationBar.astro`

#### Zachowanie na Desktop (breakpoint `md` i większe):

-   **Bez zmian:** Wygląd i funkcjonalność pozostają identyczne jak obecnie.
-   Linki nawigacyjne ("Generowanie", "Moje Fiszki", "Powtarzanie") są widoczne.
-   Email zalogowanego użytkownika jest widoczny.
-   Przycisk "Wyloguj" jest widoczny.
-   Logo "FiszkiES" jest widoczne.

#### Zachowanie na Mobile (poniżej breakpointu `md`):

-   **Ukrycie linków:** Główne linki nawigacyjne ("Generowanie", "Moje Fiszki", "Powtarzanie") *nie są* widoczne w górnym pasku.
-   **Widoczność Emaila:** Email zalogowanego użytkownika *jest* widoczny (wymaga usunięcia ograniczenia `sm:inline`).
-   **Widoczność Przycisku Wyloguj:** Przycisk "Wyloguj" *jest* widoczny.
-   **Widoczność Loga:** Logo "FiszkiES" *jest* widoczne.

### 2. Nowy Komponent `MobileBottomNavigationBar`

#### Widoczność:

-   Komponent *jest* widoczny tylko na urządzeniach mobilnych (poniżej breakpointu `md`).
-   Komponent *nie jest* widoczny na urządzeniach desktopowych (breakpoint `md` i większe).

#### Pozycjonowanie i Wygląd:

-   Komponent jest przyklejony do dolnej krawędzi ekranu (fixed position).
-   Styl wizualny powinien być spójny z resztą aplikacji (np. używając kolorów i stylu z `shadcn/ui` i Tailwind).
-   Powinien zajmować całą szerokość ekranu na mobile.

#### Zawartość:

-   Komponent zawiera łatwo dostępne elementy (np. ikony z tekstem lub same ikony z odpowiednimi etykietami `aria-label`) reprezentujące główne sekcje dostępne dla zalogowanego użytkownika:
    -   Generowanie (`/generate`)
    -   Moje Fiszki (`/my-flashcards`)
    -   Powtarzanie (`/repeat`)

#### Interakcja:

-   Kliknięcie/dotknięcie elementu nawigacyjnego przenosi użytkownika do odpowiedniej sekcji aplikacji.
-   Powinien być wizualnie zaznaczony aktywny link (sekcja, w której użytkownik się aktualnie znajduje).

### 3. Dostępność (Accessibility - a11y)

-   Wszystkie elementy interaktywne (linki, przyciski) w obu paskach muszą być dostępne za pomocą klawiatury.
-   Należy zapewnić wyraźne etykiety dla wszystkich elementów interaktywnych, szczególnie jeśli używane są ikony (np. poprzez `aria-label`).
-   Należy zadbać o odpowiedni kontrast kolorów.
-   Kolejność fokusu musi być logiczna.
-   Dolny pasek nawigacyjny powinien być oznaczony jako region nawigacyjny (np. za pomocą znacznika `<nav>` z `aria-label`).
-   Rozmiar elementów klikalnych/dotykowych w dolnym pasku musi być wystarczający (zgodnie z wytycznymi WCAG).

## Uwagi

-   Należy unikać konfliktów z paskiem narzędzi przeglądarki na dole ekranu (uwzględnić "safe area").
-   Implementacja powinna wykorzystywać istniejący stos technologiczny (Astro, React, Tailwind, Shadcn/ui) zgodnie z przyjętymi praktykami w projekcie. 