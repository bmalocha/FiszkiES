# Architektura UI dla Aplikacji do Nauki Języka Hiszpańskiego

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) aplikacji webowej do nauki hiszpańskiego została zaprojektowana w celu zapewnienia prostego i intuicyjnego doświadczenia dla użytkowników. Opiera się na modelu jednostronicowej aplikacji (SPA - Single Page Application), gdzie główne funkcjonalności są dostępne jako oddzielne widoki ładowane w ramach głównego layoutu po zalogowaniu. Główne komponenty obejmują system uwierzytelniania, narzędzie do generowania fiszek, przeglądarkę zapisanych fiszek oraz interaktywny tryb ich powtarzania. Nawigacja jest scentralizowana w stałym górnym pasku, zapewniając łatwy dostęp do kluczowych sekcji. Zarządzanie stanem odbywa się po stronie klienta, a komunikacja z backendem następuje poprzez zdefiniowane REST API. Projekt uwzględnia responsywność (RWD) oraz podstawowe zasady dostępności (a11y).

## 2. Lista widoków

### 2.1. Widok Logowania
-   **Nazwa widoku:** LoginView
-   **Ścieżka widoku:** `/login`
-   **Główny cel:** Uwierzytelnienie istniejącego użytkownika.
-   **Kluczowe informacje do wyświetlenia:** Formularz logowania.
-   **Kluczowe komponenty widoku:**
    -   Pole wprowadzania adresu e-mail.
    -   Pole wprowadzania hasła.
    -   Przycisk "Zaloguj się".
    -   Link do widoku rejestracji (`/register`).
    -   Komunikaty o błędach (np. nieprawidłowe dane, błąd serwera).
-   **UX, dostępność i względy bezpieczeństwa:**
    -   UX: Prosty, przejrzysty formularz. Komunikaty zwrotne o statusie logowania.
    -   Dostępność: Poprawne etykiety pól (`<label>`), obsługa nawigacji klawiaturą, widoczny focus. Użycie `type="email"` i `type="password"`.
    -   Bezpieczeństwo: Przesyłanie danych przez HTTPS (założenie infrastrukturalne). Po błędzie 401 z API, użytkownik jest przekierowywany tutaj.

### 2.2. Widok Rejestracji
-   **Nazwa widoku:** RegisterView
-   **Ścieżka widoku:** `/register`
-   **Główny cel:** Utworzenie nowego konta użytkownika.
-   **Kluczowe informacje do wyświetlenia:** Formularz rejestracji.
-   **Kluczowe komponenty widoku:**
    -   Pole wprowadzania adresu e-mail.
    -   Pole wprowadzania hasła.
    -   Pole potwierdzenia hasła (zalecane dla UX).
    -   Przycisk "Zarejestruj się".
    -   Link do widoku logowania (`/login`).
    -   Komunikaty o błędach (np. e-mail zajęty, hasła niezgodne, błąd serwera).
-   **UX, dostępność i względy bezpieczeństwa:**
    -   UX: Prosty formularz. Walidacja po stronie klienta (np. zgodność haseł). Jasne komunikaty zwrotne.
    -   Dostępność: Poprawne etykiety pól, obsługa nawigacji klawiaturą, widoczny focus. Użycie `type="email"` i `type="password"`.
    -   Bezpieczeństwo: Przesyłanie danych przez HTTPS. Brak weryfikacji e-mail zgodnie z PRD.

### 2.3. Widok Główny / Layout Aplikacji (Authenticated Shell)
-   **Nazwa widoku:** MainLayout
-   **Ścieżka widoku:** `/` (lub obejmuje ścieżki dostępne po zalogowaniu: `/generate`, `/my-flashcards`, `/repeat`)
-   **Główny cel:** Zapewnienie stałej struktury nawigacyjnej i ram dla widoków dostępnych po zalogowaniu.
-   **Kluczowe informacje do wyświetlenia:** Nawigacja, obszar renderowania aktywnego widoku.
-   **Kluczowe komponenty widoku:**
    -   Górny Pasek Nawigacyjny (Top Navigation Bar).
    -   Obszar renderowania zawartości (dla `/generate`, `/my-flashcards`, `/repeat`).
    -   Globalny wskaźnik ładowania (spinner).
-   **UX, dostępność i względy bezpieczeństwa:**
    -   UX: Spójna nawigacja dostępna z każdego miejsca w aplikacji. Globalny spinner nie blokuje nawigacji.
    -   Dostępność: Użycie elementu `<nav>` dla nawigacji. Linki nawigacyjne są dostępne klawiaturą.
    -   Bezpieczeństwo: Widoczny tylko dla zalogowanych użytkowników. Zawiera mechanizm wylogowania.

### 2.4. Widok Generowania Fiszek
-   **Nazwa widoku:** GenerateFlashcardsView
-   **Ścieżka widoku:** `/generate` (renderowany wewnątrz MainLayout)
-   **Główny cel:** Umożliwienie użytkownikowi wklejenia tekstu, wygenerowania propozycji fiszek oraz ich akceptacji lub odrzucenia.
-   **Kluczowe informacje do wyświetlenia:** Pole tekstowe, wygenerowane propozycje fiszek.
-   **Kluczowe komponenty widoku:**
    -   Pole `textarea` z limitem 10 000 znaków i licznikiem.
    -   Przycisk "Generuj".
    -   Wskaźnik ładowania (spinner) podczas generowania.
    -   Lista/Tabela z propozycjami fiszek (Słowo PL, Słowo ES, Zdanie Przykładowe, Akcje).
    -   Przyciski "Dodaj" i "Odrzuć" dla każdej propozycji.
    -   Wizualne potwierdzenie dodania fiszki (np. podświetlenie wiersza).
    -   Komunikaty o błędach (np. tekst za długi, błąd API generowania/dodawania).
-   **UX, dostępność i względy bezpieczeństwa:**
    -   UX: Prosty przepływ: wklej -> generuj -> akceptuj/odrzuć. Czytelna prezentacja sugestii. Informacja zwrotna o stanie operacji (ładowanie, sukces, błąd). Widok jest czyszczony po przetworzeniu sugestii.
    -   Dostępność: Etykieta dla `textarea`, powiązanie licznika znaków (`aria-describedby`). Semantyczna struktura listy/tabeli sugestii. Przyciski dostępne klawiaturą. Wskaźnik ładowania z odpowiednim stanem ARIA.
    -   Bezpieczeństwo: Walidacja długości tekstu po stronie klienta i serwera.

### 2.5. Widok Moje Fiszki
-   **Nazwa widoku:** MyFlashcardsView
-   **Ścieżka widoku:** `/my-flashcards` (renderowany wewnątrz MainLayout)
-   **Główny cel:** Wyświetlenie listy wszystkich zapisanych fiszek użytkownika oraz umożliwienie ich usunięcia.
-   **Kluczowe informacje do wyświetlenia:** Lista fiszek użytkownika.
-   **Kluczowe komponenty widoku:**
    -   Lista/Tabela fiszek (Słowo PL, Słowo ES, Zdanie Przykładowe, Akcja: Usuń).
    -   Przycisk "Usuń" przy każdej fiszce.
    -   Modal potwierdzający usunięcie ("Czy na pewno chcesz usunąć?").
    -   Przycisk "Załaduj więcej" do paginacji (zgodnie z notatkami).
    -   Wskaźnik ładowania (spinner) podczas ładowania/usuwania.
    -   Komunikat o braku fiszek (jeśli lista jest pusta).
    -   Komunikaty o błędach (np. błąd ładowania/usuwania).
-   **UX, dostępność i względy bezpieczeństwa:**
    -   UX: Przejrzysta lista fiszek. Mechanizm "Załaduj więcej" zapobiega ładowaniu od razu potencjalnie dużej liczby fiszek. Potwierdzenie usuwania zapobiega przypadkowej utracie danych. Brak możliwości edycji zgodnie z PRD.
    -   Dostępność: Semantyczna struktura listy/tabeli. Przyciski dostępne klawiaturą. Modal jest dostępny (trapowanie fokusu, obsługa Esc, role ARIA). Wskaźnik ładowania z ARIA.
    -   Bezpieczeństwo: Operacje dotyczą tylko fiszek zalogowanego użytkownika (wymuszane przez API/RLS).

### 2.6. Widok Sesji Powtarzania
-   **Nazwa widoku:** RepetitionSessionView
-   **Ścieżka widoku:** `/repeat` (renderowany wewnątrz MainLayout)
-   **Główny cel:** Przeprowadzenie użytkownika przez interaktywną sesję powtarzania zapisanych fiszek.
-   **Kluczowe informacje do wyświetlenia:** Aktualna fiszka (częściowo ukryta), postęp sesji.
-   **Kluczowe komponenty widoku:**
    -   Obszar wyświetlania aktualnej fiszki (najpierw Słowo PL, po akcji Słowo ES + Zdanie).
    -   Instrukcja dla użytkownika (np. "Naciśnij spację, aby odkryć / przejść dalej").
    -   Pasek postępu sesji (wizualizujący postęp do maks. 20 fiszek).
    -   Wskaźnik ładowania (spinner) podczas rozpoczynania sesji.
    -   Komunikat o zakończeniu sesji (po 20 fiszkach lub wyczerpaniu kart).
    -   Komunikat, jeśli użytkownik ma mniej niż minimalną liczbę fiszek do rozpoczęcia sesji (lub 0).
    -   (Opcjonalnie) Przycisk "Zakończ sesję" (chociaż kończy się automatycznie).
    -   Komunikaty o błędach (np. błąd startu sesji).
-   **UX, dostępność i względy bezpieczeństwa:**
    -   UX: Interaktywny i angażujący sposób powtarzania. Prosta interakcja za pomocą spacji. Wyraźny wskaźnik postępu i zakończenia.
    -   Dostępność: Obsługa interakcji za pomocą klawisza spacji. Czytelna prezentacja treści fiszki. Pasek postępu zaimplementowany z użyciem `<progress>` lub odpowiednich ról ARIA. Instrukcje są widoczne.
    -   Bezpieczeństwo: Sesja operuje na fiszkach zalogowanego użytkownika.

## 3. Mapa podróży użytkownika

1.  **Rejestracja/Logowanie:**
    * Użytkownik trafia na `/login`.
    * Jeśli nowy -> przechodzi do `/register`, wypełnia formularz, klika "Zarejestruj się". Po sukcesie jest przekierowany na `/login` lub od razu zalogowany i przekierowany do `/generate`.
    * Jeśli istniejący -> wypełnia formularz na `/login`, klika "Zaloguj się".
    * Po pomyślnym zalogowaniu -> przekierowanie do domyślnego widoku po zalogowaniu (np. `/generate`). Widoczny jest `MainLayout` z nawigacją.
    * W przypadku błędu 401 podczas korzystania z aplikacji -> przekierowanie do `/login`.
2.  **Główny Przepływ (Generowanie -> Przeglądanie -> Powtarzanie):**
    * Użytkownik jest zalogowany i widzi `MainLayout`.
    * Klika "Generowanie" w nawigacji -> przechodzi do `GenerateFlashcardsView` (`/generate`).
    * Wkleja tekst, klika "Generuj". Czeka na sugestie (widzi spinner).
    * Przegląda sugestie, klika "Dodaj" przy wybranych, "Odrzuć" przy pozostałych.
    * Klika "Moje Fiszki" w nawigacji -> przechodzi do `MyFlashcardsView` (`/my-flashcards`).
    * Widzi listę swoich fiszek (ładowanie ze spinnerem). Może użyć "Załaduj więcej". Może usunąć fiszkę (z potwierdzeniem w modalu).
    * Klika "Powtarzanie" w nawigacji -> przechodzi do `RepetitionSessionView` (`/repeat`).
    * Sesja rozpoczyna się automatycznie lub po kliknięciu przycisku (ładowanie ze spinnerem).
    * Użytkownik przechodzi przez fiszki, używając spacji do odkrywania i przechodzenia dalej. Widzi pasek postępu.
    * Po zakończeniu sesji widzi komunikat.
3.  **Wylogowanie:**
    * Użytkownik klika na menu użytkownika w `MainLayout`.
    * Klika "Wyloguj".
    * Sesja użytkownika jest kończona po stronie klienta (np. czyszczenie tokena JWT).
    * Użytkownik jest przekierowywany do `/login`.

## 4. Układ i struktura nawigacji

-   **Układ:** Aplikacja wykorzystuje główny, stały układ (`MainLayout`) dla zalogowanych użytkowników. Ten układ zawiera:
    -   **Górny Pasek Nawigacyjny (Top Bar):** Zawsze widoczny. Zawiera logo/nazwę aplikacji, linki do głównych sekcji ("Generowanie", "Moje Fiszki", "Powtarzanie") oraz rozwijane menu użytkownika po prawej stronie.
    -   **Obszar Treści:** Poniżej Top Baru, renderuje zawartość aktywnego widoku (`/generate`, `/my-flashcards`, `/repeat`).
-   **Nawigacja:**
    -   **Niezalogowany użytkownik:** Nawigacja odbywa się poprzez bezpośrednie przejście do `/login` lub `/register` oraz linki między tymi dwoma widokami.
    -   **Zalogowany użytkownik:** Główna nawigacja odbywa się poprzez kliknięcie linków w Górnym Pasku Nawigacyjnym. Rozwijane menu użytkownika zawiera jego e-mail oraz przycisk "Wyloguj". Przekierowania (np. po logowaniu, przy błędzie 401) również kierują przepływem użytkownika.

## 5. Kluczowe komponenty

Komponenty te będą reużywalne w różnych widokach aplikacji:

-   **`TopNavigationBar`:** Komponent wyświetlający stały pasek nawigacyjny dla zalogowanych użytkowników. Zawiera linki do sekcji i menu użytkownika.
-   **`FormField`:** Reużywalny komponent dla pól formularzy (input, label, obsługa błędów walidacji). Używany w LoginView i RegisterView.
-   **`FlashcardList` / `FlashcardTable`:** Komponent do wyświetlania listy/tabeli fiszek. Używany w MyFlashcardsView do wyświetlania zapisanych fiszek oraz potencjalnie (w wariancie) w GenerateFlashcardsView do wyświetlania sugestii. Powinien obsługiwać akcje (np. przycisk usuwania).
-   **`FlashcardItem` / `FlashcardRow`:** Reprezentuje pojedynczą fiszkę w liście/tabeli.
-   **`Button`:** Reużywalny komponent przycisku z obsługą stanów (loading, disabled) i spójnym stylem (zgodnym z motywem czerwono-żółtym, z uwzględnieniem kontrastu).
-   **`Spinner`:** Komponent wskaźnika ładowania, używany globalnie i/lub lokalnie przy operacjach asynchronicznych.
-   **`Modal`:** Komponent do wyświetlania okien modalnych, np. potwierdzenia usunięcia. Musi być dostępny (zarządzanie focusem, role ARIA).
-   **`RepetitionCard`:** Komponent wyświetlający pojedynczą fiszkę w trybie powtarzania, obsługujący logikę odkrywania treści.
-   **`ProgressBar`:** Komponent paska postępu używany w RepetitionSessionView.
-   **`UserDropdownMenu`:** Komponent rozwijanego menu w TopNavigationBar, pokazujący email użytkownika i przycisk wylogowania.