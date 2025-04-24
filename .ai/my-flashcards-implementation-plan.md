
## 4. Szczegóły komponentów

### `MyFlashcardsView.tsx`
- **Opis komponentu:** Główny komponent kontenerowy widoku. Odpowiedzialny za zarządzanie stanem (ładowanie, błędy, lista fiszek, paginacja), pobieranie danych z API, obsługę akcji usuwania i renderowanie odpowiednich komponentów podrzędnych. Wykorzystuje customowy hook `useFlashcards` do logiki biznesowej.
- **Główne elementy:** Renderuje warunkowo: `LoadingSpinner`, `ErrorMessage`, `EmptyState`, `FlashcardList` oraz `DeleteConfirmationModal`.
- **Obsługiwane interakcje:** Inicjalizacja pobierania danych przy montowaniu, obsługa kliknięcia "Załaduj więcej", obsługa inicjalizacji i potwierdzenia/anulowania usuwania fiszki.
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji inputu użytkownika. Zarządza stanem ładowania, aby zapobiec wielokrotnym żądaniom.
- **Typy:** `Flashcard`, `Pagination`, `ApiError` (do obsługi błędów). Używa stanu zarządzanego przez `useFlashcards`.
- **Propsy:** Brak (jest komponentem najwyższego poziomu dla tego widoku).

### `FlashcardList.tsx`
- **Opis komponentu:** Wyświetla listę fiszek przekazanych jako props. Renderuje `FlashcardItem` dla każdej fiszki. Odpowiada za renderowanie przycisku "Załaduj więcej", jeśli są dostępne kolejne strony.
- **Główne elementy:** Element listy (`<ul>` lub `<div>` z rolą `list`) lub tabela (`<table>` - Shadcn/ui `Table` może być dobrym wyborem dla struktury). Iteruje po liście fiszek i renderuje `FlashcardItem`. Renderuje `LoadMoreButton`.
- **Obsługiwane interakcje:** Propaguje żądanie usunięcia fiszki do rodzica (`MyFlashcardsView`), obsługuje kliknięcie "Załaduj więcej".
- **Obsługiwana walidacja:** Brak.
- **Typy:** `Flashcard`.
- **Propsy:**
    - `flashcards: Flashcard[]` - Lista fiszek do wyświetlenia.
    - `onDeleteRequest: (flashcardId: string) => void` - Funkcja wywoływana, gdy użytkownik kliknie przycisk usuwania przy fiszce.
    - `onLoadMore: () => void` - Funkcja wywoływana po kliknięciu "Załaduj więcej".
    - `canLoadMore: boolean` - Wskazuje, czy są dostępne kolejne strony do załadowania.
    - `isLoadingMore: boolean` - Wskazuje, czy trwa ładowanie kolejnej strony.

### `FlashcardItem.tsx`
- **Opis komponentu:** Reprezentuje pojedynczą fiszkę na liście. Wyświetla słowo polskie, hiszpańskie, zdanie przykładowe oraz przycisk "Usuń".
- **Główne elementy:** Element listy (`<li>`) lub wiersz tabeli (`<tr>`). Zawiera elementy tekstowe (`<p>`, `<span>` lub `<td>`) dla danych fiszki oraz komponent `Button` (Shadcn/ui) dla akcji usuwania.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Usuń" wywołuje `onDeleteRequest` przekazane w propsach z ID fiszki.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `Flashcard`.
- **Propsy:**
    - `flashcard: Flashcard` - Dane fiszki do wyświetlenia.
    - `onDeleteRequest: (flashcardId: string) => void` - Funkcja wywoływana po kliknięciu "Usuń".
    - `isDeleting: boolean` - Wskazuje, czy ta konkretna fiszka jest w trakcie usuwania (opcjonalne, dla wizualnego feedbacku na przycisku).

### `DeleteConfirmationModal.tsx`
- **Opis komponentu:** Modal (okno dialogowe) wymagający od użytkownika potwierdzenia akcji usunięcia fiszki. Zalecane użycie komponentu `AlertDialog` z Shadcn/ui dla zapewnienia dostępności.
- **Główne elementy:** Komponent `AlertDialog` (Shadcn/ui) zawierający tytuł, opis ("Czy na pewno chcesz usunąć?"), przycisk potwierdzający ("Usuń") i przycisk anulujący ("Anuluj").
- **Obsługiwane interakcje:** Kliknięcie "Usuń" wywołuje `onConfirm`, kliknięcie "Anuluj" lub zamknięcie modala wywołuje `onCancel`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak specyficznych typów danych.
- **Propsy:**
    - `isOpen: boolean` - Kontroluje widoczność modala.
    - `onConfirm: () => void` - Funkcja wywoływana po potwierdzeniu usunięcia.
    - `onCancel: () => void` - Funkcja wywoływana po anulowaniu lub zamknięciu modala.
    - `isPending: boolean` - Wskazuje, czy operacja usuwania jest w toku (do dezaktywacji przycisków).

### `LoadingSpinner.tsx`
- **Opis komponentu:** Wyświetla wizualny wskaźnik ładowania (np. animowany spinner). Można użyć komponentu `Loader2` z `lucide-react` (używanego przez Shadcn/ui) lub innego.
- **Główne elementy:** Element SVG lub inny z animacją ładowania. Powinien zawierać odpowiednie atrybuty ARIA dla dostępności.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Opcjonalnie: `size`, `color`.

### `EmptyState.tsx`
- **Opis komponentu:** Wyświetlany, gdy lista fiszek użytkownika jest pusta.
- **Główne elementy:** Kontener (`<div>`) z tekstem informującym o braku fiszek (np. "Nie masz jeszcze żadnych zapisanych fiszek. Wygeneruj nowe!"). Może zawierać ikonę.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:** Brak.

### `ErrorMessage.tsx`
- **Opis komponentu:** Wyświetla komunikat o błędzie, który wystąpił podczas pobierania danych lub usuwania fiszki.
- **Główne elementy:** Kontener (`<div>`) z tekstem błędu. Stylizowany, aby był wyraźnie widoczny (np. czerwony kolor tła/tekstu). Może zawierać przycisk "Spróbuj ponownie".
- **Obsługiwane interakcje:** Opcjonalnie: kliknięcie przycisku "Spróbuj ponownie".
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
    - `message: string` - Treść komunikatu o błędzie.
    - `onRetry?: () => void` - Opcjonalna funkcja wywoływana po kliknięciu "Spróbuj ponownie".

### `LoadMoreButton.tsx`
- **Opis komponentu:** Przycisk umożliwiający załadowanie kolejnej strony fiszek.
- **Główne elementy:** Komponent `Button` (Shadcn/ui) z tekstem "Załaduj więcej". Może wyświetlać `LoadingSpinner` w trakcie ładowania.
- **Obsługiwane interakcje:** Kliknięcie wywołuje `onClick`. Powinien być dezaktywowany, gdy `isDisabled` jest `true` lub gdy `isLoading` jest `true`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** Brak.
- **Propsy:**
    - `onClick: () => void` - Funkcja wywoływana po kliknięciu.
    - `isDisabled: boolean` - Czy przycisk powinien być nieaktywny (np. brak kolejnych stron).
    - `isLoading: boolean` - Czy trwa ładowanie (do wyświetlenia spinnera i dezaktywacji).

## 5. Typy
Widok będzie korzystał głównie z typów zdefiniowanych w `<type_definitions>` i `<endpoint_description>`:

-   **`Flashcard`**:
    ```typescript
    // Z pliku src/types.ts (lub podobnego)
    export type Flashcard = {
      id: string; // UUID
      polish_word: string;
      spanish_word: string;
      example_sentence: string;
      created_at: string; // Timestamp string
      user_id: string; // UUID - może nie być potrzebne na frontendzie, jeśli API go nie zwraca w GET
    };
    ```
-   **`Pagination`**:
    ```typescript
    // Z pliku src/types.ts
    export interface Pagination {
      currentPage: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    }
    ```
-   **`GetFlashcardsResponseDto`**:
    ```typescript
    // Z pliku src/types.ts
    export interface GetFlashcardsResponseDto {
      data: Flashcard[];
      pagination: Pagination;
    }
    ```
-   **`ApiError`** (Przykładowy typ do obsługi błędów API):
    ```typescript
    export interface ApiError {
      message: string; // Główny komunikat błędu
      status?: number; // Kod statusu HTTP
      details?: any; // Dodatkowe szczegóły błędu (opcjonalne)
    }
    ```
-   **ViewModel:** Na ten moment nie przewiduje się dedykowanego `FlashcardViewModel`. Stan `isDeleting` będzie zarządzany centralnie w `MyFlashcardsView` na podstawie `flashcardIdToDelete`.

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie zrealizowane w komponencie `MyFlashcardsView.tsx` przy użyciu hooków React (`useState`, `useEffect`) oraz **customowego hooka `useFlashcards`**.

**Custom Hook: `useFlashcards`**

-   **Cel:** Zamknięcie logiki pobierania danych, paginacji, usuwania fiszek oraz zarządzania powiązanymi stanami (ładowanie, błędy, dane) w jednym miejscu.
-   **Stan wewnętrzny hooka:**
    -   `flashcards: Flashcard[]`
    -   `pagination: Pagination | null`
    -   `isLoadingInitial: boolean` (ładowanie początkowe)
    -   `isLoadingMore: boolean` (ładowanie kolejnej strony)
    -   `isDeleting: boolean` (trwa usuwanie)
    -   `error: ApiError | null` (błąd pobierania lub usuwania)
    -   `currentPage: number` (aktualnie załadowana strona)
-   **Zwracane wartości i funkcje:**
    -   `flashcards`
    -   `pagination`
    -   `isLoadingInitial`
    -   `isLoadingMore`
    -   `isDeleting`
    -   `error`
    -   `loadMoreFlashcards: () => Promise<void>` (funkcja do ładowania kolejnej strony)
    -   `deleteFlashcard: (flashcardId: string) => Promise<void>` (funkcja do usuwania fiszki)
    -   `retryFetch?: () => void` (opcjonalna funkcja do ponowienia ostatniego nieudanego żądania)
-   **Logika:**
    -   `useEffect` do pobrania pierwszej strony fiszek przy inicjalizacji hooka.
    -   Funkcja `loadMoreFlashcards` inkrementuje `currentPage`, wywołuje API `GET /api/flashcards`, aktualizuje stan `flashcards` (dodając nowe), `pagination`, `isLoadingMore` i `error`.
    -   Funkcja `deleteFlashcard` wywołuje API `DELETE /api/flashcards/{id}`, aktualizuje stan `isDeleting`, `error`, a w przypadku sukcesu usuwa fiszkę z lokalnego stanu `flashcards` i aktualizuje `pagination.totalItems`.

Komponent `MyFlashcardsView` będzie używał tego hooka i przekazywał odpowiednie dane i funkcje do komponentów podrzędnych (`FlashcardList`, `DeleteConfirmationModal` etc.). Stan związany z otwarciem modala (`isModalOpen`) i ID fiszki do usunięcia (`flashcardIdToDelete`) będzie zarządzany bezpośrednio w `MyFlashcardsView` za pomocą `useState`.

## 7. Integracja API
Widok będzie komunikował się z dwoma endpointami API:

1.  **`GET /api/flashcards`**
    -   **Cel:** Pobranie listy fiszek użytkownika z paginacją.
    -   **Wywołanie:** Przez hook `useFlashcards` przy montowaniu komponentu oraz przy akcji "Załaduj więcej".
    -   **Parametry zapytania:** `page` (numer strony), `pageSize` (stała wartość, np. 20).
    -   **Typ odpowiedzi:** `Promise<GetFlashcardsResponseDto>`
    -   **Obsługa sukcesu:** Aktualizacja stanu `flashcards` i `pagination` w hooku `useFlashcards`.
    -   **Obsługa błędu:** Ustawienie stanu `error` w hooku `useFlashcards`.

2.  **`DELETE /api/flashcards/{flashcardId}`**
    -   **Cel:** Usunięcie konkretnej fiszki.
    -   **Wywołanie:** Przez hook `useFlashcards` po potwierdzeniu przez użytkownika w modalu.
    -   **Parametry ścieżki:** `flashcardId` (UUID fiszki do usunięcia).
    -   **Typ odpowiedzi:** `Promise<void>` (oczekiwany status 204 No Content).
    -   **Obsługa sukcesu:** Usunięcie fiszki z lokalnego stanu `flashcards`, aktualizacja `pagination.totalItems` w hooku `useFlashcards`. Zamknięcie modala.
    -   **Obsługa błędu:** Ustawienie stanu `error` w hooku `useFlashcards`. Wyświetlenie komunikatu użytkownikowi (np. w modalu lub jako globalny toast/alert).

Wszystkie wywołania API będą wykonywane za pomocą standardowego `fetch` API lub dedykowanego klienta API (jeśli taki istnieje w projekcie), z odpowiednim uwzględnieniem nagłówków autoryzacji (obsługiwanych przez kontekst Supabase/Astro).

## 8. Interakcje użytkownika
-   **Ładowanie widoku:** Użytkownik przechodzi na `/my-flashcards`. Wyświetla się `LoadingSpinner`. Po załadowaniu danych, widoczna jest `FlashcardList` lub `EmptyState`. W przypadku błędu ładowania, wyświetlany jest `ErrorMessage`.
-   **Przewijanie listy:** Użytkownik widzi listę fiszek. Jeśli fiszek jest więcej niż `pageSize`, na dole listy widoczny jest przycisk "Załaduj więcej".
-   **Kliknięcie "Załaduj więcej":** Przycisk jest klikany. Wyświetla się wskaźnik ładowania (`isLoadingMore`). Po załadowaniu, nowa partia fiszek jest dołączana do listy. Przycisk znika lub staje się nieaktywny, jeśli załadowano ostatnią stronę. W razie błędu, wyświetlany jest `ErrorMessage`.
-   **Kliknięcie przycisku "Usuń" przy fiszce:** Otwiera się `DeleteConfirmationModal` z pytaniem "Czy na pewno chcesz usunąć?". Stan `flashcardIdToDelete` jest ustawiany w `MyFlashcardsView`.
-   **Potwierdzenie usunięcia w modalu:** Użytkownik klika "Usuń". Wyświetla się stan ładowania (`isDeleting`). Po pomyślnym usunięciu (API zwraca 204), modal jest zamykany, a fiszka znika z listy `FlashcardList`. Licznik `totalItems` jest aktualizowany. W razie błędu, wyświetlany jest komunikat o błędzie w modalu lub globalnie, a fiszka pozostaje na liście.
-   **Anulowanie usunięcia w modalu:** Użytkownik klika "Anuluj" lub zamyka modal. Modal znika, żadna akcja nie jest podejmowana, stan `flashcardIdToDelete` jest czyszczony.

## 9. Warunki i walidacja
-   **Dostęp do widoku:** Widok dostępny tylko dla zalogowanych użytkowników (obsługa na poziomie routingu/middleware Astro). Wywołania API wymagają tokenu autoryzacyjnego (obsługa przez klienta Supabase/fetch).
-   **Ładowanie danych (`GET`):**
    -   Wskaźnik ładowania (`isLoadingInitial`) jest pokazywany podczas pierwszego ładowania.
    -   Wskaźnik ładowania (`isLoadingMore`) jest pokazywany podczas ładowania kolejnych stron.
    -   Przycisk "Załaduj więcej" jest widoczny tylko jeśli `pagination.currentPage < pagination.totalPages`.
    -   Przycisk "Załaduj więcej" jest nieaktywny (`disabled`), gdy `isLoadingMore` jest `true`.
-   **Usuwanie fiszki (`DELETE`):**
    -   Wymagane jest potwierdzenie w modalu (`DeleteConfirmationModal`) przed wysłaniem żądania `DELETE`.
    -   Przycisk "Usuń" w modalu jest nieaktywny (`disabled`), gdy `isDeleting` jest `true`.
-   **Pusta lista:** Komponent `EmptyState` jest wyświetlany, gdy `flashcards.length === 0` i `!isLoadingInitial` oraz `!error`.
-   **Błędy API:** Komponent `ErrorMessage` jest wyświetlany, gdy stan `error` w hooku `useFlashcards` nie jest `null`.

## 10. Obsługa błędów
-   **Błąd ładowania początkowego (`GET /api/flashcards`):**
    -   Hook `useFlashcards` ustawia stan `error`.
    -   `MyFlashcardsView` renderuje komponent `ErrorMessage` z odpowiednią wiadomością (np. "Nie udało się załadować fiszek. Spróbuj ponownie."). Opcjonalnie, `ErrorMessage` może zawierać przycisk ponowienia próby, który wywoła funkcję `retryFetch` z hooka.
    -   W przypadku błędu 401 Unauthorized, można globalnie przekierować użytkownika do strony logowania.
-   **Błąd ładowania kolejnej strony (`GET /api/flashcards`):**
    -   Hook `useFlashcards` ustawia stan `error`.
    -   `MyFlashcardsView` renderuje `ErrorMessage` (może być jako toast/powiadomienie lub poniżej listy). Przycisk "Załaduj więcej" pozostaje aktywny, aby umożliwić ponowną próbę.
-   **Błąd usuwania (`DELETE /api/flashcards/{id}`):**
    -   Hook `useFlashcards` ustawia stan `error`.
    -   Komunikat o błędzie jest wyświetlany użytkownikowi. Może to być wewnątrz `DeleteConfirmationModal` przed jego zamknięciem, lub jako globalne powiadomienie (np. Toast z Shadcn/ui) po zamknięciu modala.
    -   Komunikaty mogą być dostosowane do kodu błędu (np. 403 - "Brak uprawnień do usunięcia tej fiszki", 404 - "Nie znaleziono fiszki", 500 - "Błąd serwera podczas usuwania").
    -   Fiszka *nie* jest usuwana z lokalnego stanu w przypadku błędu.
-   **Błędy sieciowe:** Ogólne błędy sieciowe powinny być traktowane jako błędy serwera (np. 500) i wyświetlać generyczny komunikat o błędzie połączenia.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików:** Stworzenie strony `src/pages/my-flashcards.astro` oraz katalogu `src/components/views/my-flashcards/` na komponenty React (`MyFlashcardsView.tsx`, `FlashcardList.tsx`, `FlashcardItem.tsx` itd.). Utworzenie pliku dla hooka `src/hooks/useFlashcards.ts`.
2.  **Implementacja hooka `useFlashcards`:**
    -   Zdefiniowanie stanów wewnętrznych (`flashcards`, `pagination`, `loading`, `error`, `currentPage`).
    -   Implementacja logiki pobierania danych (`fetchFlashcards`) dla `GET /api/flashcards` (z obsługą `page`, `pageSize`) i aktualizacji stanu.
    -   Implementacja logiki usuwania (`deleteFlashcard`) dla `DELETE /api/flashcards/{id}` i aktualizacji stanu.
    -   Implementacja funkcji `loadMoreFlashcards`.
    -   Obsługa błędów (ustawianie stanu `error`).
    -   Zwrócenie stanów i funkcji z hooka.
3.  **Implementacja komponentu `MyFlashcardsView.tsx`:**
    -   Użycie hooka `useFlashcards`.
    -   Zarządzanie stanem modala (`isModalOpen`, `flashcardIdToDelete`).
    -   Renderowanie warunkowe: `LoadingSpinner`, `ErrorMessage`, `EmptyState`, `FlashcardList`, `DeleteConfirmationModal` na podstawie stanów z hooka.
    -   Przekazanie odpowiednich propsów i callbacków do komponentów podrzędnych.
4.  **Implementacja komponentu `FlashcardList.tsx`:**
    -   Przyjęcie propsów (`flashcards`, `onDeleteRequest`, `onLoadMore`, `canLoadMore`, `isLoadingMore`).
    -   Renderowanie listy/tabeli fiszek przy użyciu `FlashcardItem`.
    -   Renderowanie `LoadMoreButton` (np. komponentu `Button` z Shadcn/ui) z odpowiednimi propsami (`onClick`, `disabled`, `isLoading`).
5.  **Implementacja komponentu `FlashcardItem.tsx`:**
    -   Przyjęcie propsów (`flashcard`, `onDeleteRequest`, `isDeleting`).
    -   Wyświetlenie danych fiszki (`polish_word`, `spanish_word`, `example_sentence`).
    -   Renderowanie przycisku "Usuń" (`Button` z Shadcn/ui) i podpięcie `onDeleteRequest` do `onClick`.
6.  **Implementacja komponentu `DeleteConfirmationModal.tsx`:**
    -   Użycie `AlertDialog` z Shadcn/ui.
    -   Przyjęcie propsów (`isOpen`, `onConfirm`, `onCancel`, `isPending`).
    -   Wyświetlenie tekstu potwierdzenia.
    -   Podpięcie `onConfirm` i `onCancel` do odpowiednich przycisków modala.
    -   Obsługa stanu `isPending` do dezaktywacji przycisków.
7.  **Implementacja komponentów pomocniczych:** `LoadingSpinner`, `EmptyState`, `ErrorMessage`. Wykorzystanie komponentów z Shadcn/ui tam, gdzie to możliwe.
8.  **Stylowanie:** Użycie Tailwind CSS i ew. niestandardowych stylów zgodnie z motywem kolorystycznym aplikacji (odcienie czerwieni i żółci). Dostosowanie stylów komponentów Shadcn/ui, jeśli to konieczne.
9.  **Integracja w Astro:** Umieszczenie `<MyFlashcardsView client:load />` w pliku `src/pages/my-flashcards.astro` wewnątrz `MainLayout`. Zapewnienie ochrony trasy dla zalogowanych użytkowników.
10. **Testowanie:**
    -   Testowanie ręczne: ładowanie widoku, ładowanie "więcej", usuwanie fiszki (potwierdzenie, anulowanie), obsługa stanów pustych i błędów (symulacja błędów API).
    -   Testowanie dostępności: nawigacja klawiaturą, działanie modala z czytnikiem ekranu.
11. **Refaktoryzacja i czyszczenie kodu.**