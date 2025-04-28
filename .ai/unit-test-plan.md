# Plan Implementacji Testów Jednostkowych - FiszkiES

**Wersja:** 1.0
**Data:** 2024-07-27

## 1. Wprowadzenie

Ten dokument opisuje proponowane scenariusze testów jednostkowych dla aplikacji FiszkiES. Celem testów jednostkowych jest weryfikacja poprawności działania izolowanych fragmentów kodu (komponentów, hooków, serwisów, funkcji pomocniczych) w kontrolowanych warunkach, z zamockowanymi zależnościami.

**Narzędzia:**
*   **Test Runner:** Vitest
*   **Biblioteki pomocnicze:** React Testing Library (RTL) dla komponentów React, `@testing-library/jest-dom` (dla dodatkowych matcherów), `msw` (Mock Service Worker) lub mocki Vitest (`vi.fn`, `vi.mock`) do mockowania API/serwisów.

## 2. Proponowane Scenariusze Testowe

### 2.1. Komponenty React (`src/components`)

#### 2.1.1. `LoginForm.tsx`
*   **Mocki:** `fetch` (dla `/api/auth/login`).
*   **Scenariusze:**
    *   Renderuje poprawnie pola email, hasło i przycisk "Zaloguj się".
    *   Wyświetla błąd walidacji, gdy pola są puste i formularz jest wysyłany.
    *   Wywołuje `fetch` z poprawnymi danymi (email, hasło) po wysłaniu formularza.
    *   Wyświetla stan ładowania (przycisk nieaktywny, tekst "Logowanie...") podczas wysyłania żądania.
    *   Wyświetla komunikat błędu zwrócony z API (np. 401).
    *   Przekierowuje (sprawdzenie `window.location.href`) po udanym logowaniu (odpowiedź 200 OK).
    *   Pola są nieaktywne podczas ładowania.

#### 2.1.2. `RegisterForm.tsx`
*   **Mocki:** `fetch` (dla `/api/auth/register`).
*   **Scenariusze:**
    *   Renderuje poprawnie pola email, hasło, potwierdzenie hasła i przycisk "Zarejestruj się".
    *   Wyświetla błąd walidacji, gdy hasła nie są zgodne.
    *   Wyświetla błąd walidacji, gdy wymagane pola są puste.
    *   Wywołuje `fetch` z poprawnymi danymi (email, hasło) po wysłaniu formularza.
    *   Wyświetla stan ładowania podczas wysyłania żądania.
    *   Wyświetla komunikat o sukcesie zwrócony z API (np. 201).
    *   Czyści formularz po udanej rejestracji.
    *   Wyświetla komunikat błędu zwrócony z API (np. 409 - email zajęty, 400 - błąd walidacji backendowej).
    *   Pola są nieaktywne podczas ładowania.

#### 2.1.3. `TextInputForm.tsx` (`views/`)
*   **Mocki:** Brak bezpośrednich (testuje logikę wewnętrzną i interakcję z propsami).
*   **Scenariusze:**
    *   Renderuje poprawnie `Textarea`, `Label`, licznik znaków i przycisk "Generuj fiszki".
    *   Aktualizuje stan `text` i licznik znaków podczas wpisywania w `Textarea`.
    *   Wywołuje `props.onSubmit` z aktualnym tekstem po kliknięciu przycisku "Generuj fiszki".
    *   Nie wywołuje `props.onSubmit`, gdy tekst jest pusty.
    *   Przycisk "Generuj fiszki" jest nieaktywny, gdy `props.isGenerating` jest `true`.
    *   Przycisk "Generuj fiszki" jest nieaktywny, gdy tekst jest pusty.
    *   `Textarea` jest nieaktywna, gdy `props.isGenerating` jest `true`.
    *   Licznik znaków pokazuje poprawną wartość X / MAX_CHARS.
    *   Licznik znaków zmienia styl, gdy limit jest osiągnięty.
    *   `Textarea` nie pozwala wpisać więcej niż MAX_CHARS znaków.

#### 2.1.4. `SuggestionItem.tsx` (`views/`)
*   **Mocki:** Brak (testuje logikę warunkowego renderowania i wywoływania callbacków).
*   **Scenariusze (dla różnych `suggestion.status`):**
    *   **PENDING:** Renderuje dane fiszki i aktywne przyciski "Dodaj" i "Odrzuć". Kliknięcie "Dodaj" wywołuje `props.onAccept` z danymi sugestii. Kliknięcie "Odrzuć" wywołuje `props.onReject` z ID sugestii.
    *   **ADDING:** Renderuje dane fiszki i etykietę/badge "Dodawanie...". Przyciski są nieaktywne lub ukryte.
    *   **ADDED:** Renderuje dane fiszki i etykietę/badge "Dodano". Przyciski są nieaktywne lub ukryte.
    *   **REJECTED:** Renderuje dane fiszki i etykietę/badge "Odrzucono". Przyciski są nieaktywne lub ukryte.
    *   **ERROR:** Renderuje dane fiszki, etykietę/badge "Błąd" oraz komunikat `suggestion.errorMessage`. Przyciski są nieaktywne (chyba że dodamy logikę ponawiania).
    *   **ALREADY_EXISTS:** Renderuje dane fiszki i etykietę/badge "Już istnieje". Przyciski są nieaktywne lub ukryte.
    *   Wiersz ma zmniejszoną opacity (lub inny styl), gdy status nie jest PENDING/ADDING.

#### 2.1.5. `FlashcardItem.tsx` (`views/my-flashcards/`)
*   **Mocki:** Brak.
*   **Scenariusze:**
    *   Renderuje poprawnie dane fiszki (`polish_word`, `spanish_word`, `example_sentence`).
    *   Renderuje przycisk "Usuń" (z ikoną).
    *   Kliknięcie przycisku "Usuń" wywołuje `props.onDeleteRequest` z ID fiszki.
    *   (Opcjonalnie) Przycisk "Usuń" jest nieaktywny/pokazuje spinner, gdy `props.isDeleting` jest `true`.

#### 2.1.6. `DeleteConfirmationModal.tsx` (`views/my-flashcards/`)
*   **Mocki:** Brak (testuje interakcje z `AlertDialog` i propsami).
*   **Scenariusze:**
    *   Modal nie jest widoczny, gdy `props.isOpen` jest `false`.
    *   Modal jest widoczny, gdy `props.isOpen` jest `true`.
    *   Renderuje poprawnie tytuł, opis i przyciski "Anuluj", "Usuń".
    *   Kliknięcie "Anuluj" wywołuje `props.onCancel`.
    *   Kliknięcie "Usuń" wywołuje `props.onConfirm`.
    *   Przyciski "Anuluj" i "Usuń" są nieaktywne, gdy `props.isPending` jest `true`.
    *   Przycisk "Usuń" pokazuje spinner, gdy `props.isPending` jest `true`.
    *   Wyświetla `props.errorMessage`, gdy jest podany.

#### 2.1.7. `LoadMoreButton.tsx` (`views/my-flashcards/`)
*   **Mocki:** Brak.
*   **Scenariusze:**
    *   Renderuje przycisk z tekstem "Załaduj więcej", gdy `isLoading` jest `false`.
    *   Wywołuje `props.onClick` po kliknięciu przycisku.
    *   Przycisk jest nieaktywny, gdy `props.isDisabled` jest `true`.
    *   Przycisk jest nieaktywny, gdy `props.isLoading` jest `true`.
    *   Renderuje tekst "Ładowanie..." i spinner, gdy `props.isLoading` jest `true`.

#### 2.1.8. Inne komponenty UI (`EmptyState`, `ErrorMessage`, `LoadingSpinner`)
*   **Scenariusze:**
    *   Renderują się poprawnie.
    *   `ErrorMessage` wyświetla przekazany `message`.
    *   `ErrorMessage` renderuje przycisk "Spróbuj ponownie", gdy przekazano `onRetry`, i wywołuje tę funkcję po kliknięciu.

### 2.2. Hooki React (`src/hooks`)

#### 2.2.1. `useGenerateFlashcards.ts`
*   **Mocki:** `fetch` (dla `/api/generate` i `/api/flashcards`), `uuidv4`, `toast`, `log`.
*   **Scenariusze:**
    *   **`generateSuggestions`:**
        *   Inicjalnie `suggestions` jest puste, `isLoading` false, `error` null.
        *   Po wywołaniu ustawia `isLoading` na `true`, czyści `suggestions` i `error`.
        *   Po udanej odpowiedzi z `/api/generate`: ustawia `suggestions` z poprawnymi danymi i statusem `PENDING`, `isLoading` na `false`.
        *   Po błędzie (np. 401, 500) z `/api/generate`: ustawia `error` z komunikatem, `isLoading` na `false`, `suggestions` pozostaje puste.
        *   Obsługuje błędy sieciowe.
        *   Loguje błędy.
    *   **`acceptSuggestion`:**
        *   Ustawia status odpowiedniej sugestii na `ADDING`.
        *   Wywołuje `fetch` POST `/api/flashcards` z poprawnymi danymi.
        *   Po odpowiedzi 201: ustawia status na `ADDED`, wywołuje `toast.success`.
        *   Po odpowiedzi 409: ustawia status na `ALREADY_EXISTS`, ustawia `errorMessage`, wywołuje `toast.info`.
        *   Po odpowiedzi 400/500: ustawia status na `ERROR`, ustawia `errorMessage`, wywołuje `toast.error`, loguje błąd.
        *   Po błędzie sieciowym: ustawia status na `ERROR`, ustawia `errorMessage`, wywołuje `toast.error`, loguje błąd.
    *   **`rejectSuggestion`:**
        *   Ustawia status odpowiedniej sugestii na `REJECTED`.
        *   Wywołuje `toast.warning`.
    *   **`resetView`:**
        *   Resetuje `suggestions`, `isLoading`, `error` do stanu początkowego.

#### 2.2.2. `useFlashcards.ts`
*   **Mocki:** `fetch` (dla GET `/api/flashcards` i DELETE `/api/flashcards/[id]`), `log`.
*   **Scenariusze:**
    *   **Inicjalizacja:**
        *   Ustawia `isLoadingInitial` na `true`.
        *   Wywołuje `fetch` GET `/api/flashcards?page=1&pageSize=PAGE_SIZE`.
        *   Po udanej odpowiedzi: ustawia `flashcards`, `pagination`, `currentPage`, `isLoadingInitial` na `false`.
        *   Po błędzie: ustawia `error`, `isLoadingInitial` na `false`.
    *   **`loadMoreFlashcards`:**
        *   Nie robi nic, jeśli nie ma więcej stron (`currentPage >= totalPages`) lub `isLoadingMore` jest `true`.
        *   Ustawia `isLoadingMore` na `true`.
        *   Wywołuje `fetch` GET `/api/flashcards?page=${currentPage + 1}&pageSize=PAGE_SIZE`.
        *   Po udanej odpowiedzi: dodaje nowe fiszki do `flashcards`, aktualizuje `pagination`, `currentPage`, ustawia `isLoadingMore` na `false`.
        *   Po błędzie: ustawia `error`, `isLoadingMore` na `false`.
    *   **`deleteFlashcard`:**
        *   Ustawia `isDeleting` na `true`, czyści `error`.
        *   Wywołuje `fetch` DELETE `/api/flashcards/${flashcardId}`.
        *   Po udanej odpowiedzi (204): usuwa fiszkę z `flashcards`, aktualizuje `pagination.totalItems` i `totalPages`, ustawia `isDeleting` na `false`.
        *   Po błędzie (404, 500): ustawia `error`, ustawia `isDeleting` na `false`, rzuca błąd (zgodnie z implementacją).
        *   Obsługuje błędy sieciowe.
    *   **`retryFetch`:**
        *   Resetuje `error`, `currentPage`, `flashcards`, `pagination`.
        *   Ponownie wywołuje `fetch` dla strony 1.

### 2.3. Serwisy (`src/lib/services`)

#### 2.3.1. `FlashcardsService.ts`
*   **Mocki:** `SupabaseClient` (mocki dla `from().insert().select().single()`, `from().select().eq().order().range()`, `from().delete().match()`, `from().select({ count: 'exact' }).eq()`), `ActionLogsService`.
*   **Scenariusze:**
    *   **`createFlashcard`:** Wywołuje `supabase.from('flashcards').insert()` z poprawnymi danymi i `userId`. Zwraca utworzoną fiszkę. Wywołuje `actionLogsService.logFlashcardAdd`. Obsługuje błąd unikalności (kod 23505) zwracając specyficzny `Error`. Obsługuje inne błędy DB.
    *   **`getFlashcardsCount`:** Wywołuje `supabase.from('flashcards').select({ count: 'exact' })` z filtrem `userId`. Zwraca `count` lub 0. Obsługuje błędy DB.
    *   **`getFlashcards`:** Wywołuje `supabase.from('flashcards').select().eq().order().range()` z poprawnymi parametrami (`userId`, `from`, `to`, `sortBy`, `sortOrder`). Zwraca tablicę fiszek lub pustą tablicę. Obsługuje błędy DB.
    *   **`deleteFlashcard`:** Wywołuje `supabase.from('flashcards').delete().match()` z `id` i `userId`. Wywołuje `actionLogsService.logFlashcardDelete`. Obsługuje błędy DB.

#### 2.3.2. `GenerationService.ts`
*   **Mocki:** `OpenRouterService` (lub `fetch`, jeśli `OpenRouterService` jest cienkim wrapperem), `log`.
*   **Scenariusze:**
    *   **Konstruktor:** Inicjalizuje `OpenRouterService`, jeśli podano klucz API, loguje informację. Loguje użycie mock danych, jeśli klucza nie podano.
    *   **`generateFlashcardsFromText` (z kluczem API):** Wywołuje `openRouterService.generateChatCompletion` z poprawnym promptem systemowym, promptem użytkownika i schematem JSON. Parsuje odpowiedź JSON. Waliduje odpowiedź za pomocą `FlashcardsResponseSchema`. Zwraca listę fiszek. Obsługuje błędy API OpenRouter i błędy walidacji Zod (loguje i zwraca mock dane jako fallback).
    *   **`generateFlashcardsFromText` (bez klucza API):** Zwraca mock dane (`generateMockFlashcards`).
    *   **`generateMockFlashcards`:** Zwraca losowy podzbiór (5-10) fiszek z predefiniowanych tematów.
    *   **`generateFlashcards`:** Wywołuje `generateFlashcardsFromText`, jeśli podano tekst, w przeciwnym razie `generateMockFlashcards`.

#### 2.3.3. `OpenRouterService.ts`
*   **Mocki:** `fetch`, `log`.
*   **Scenariusze:**
    *   **Konstruktor:** Rzuca błąd, jeśli nie podano klucza API.
    *   **`generateChatCompletion`:**
        *   Waliduje `options` za pomocą `ChatCompletionOptionsSchema`. Rzuca błąd przy niepowodzeniu.
        *   Wywołuje `fetch` POST na `openRouterApiUrl` z poprawnymi nagłówkami (`Authorization`, `Content-Type`) i ciałem żądania.
        *   Obsługuje różne kody błędów HTTP (400, 401, 403, 429, 5xx) rzucając odpowiednie `Error`.
        *   Parsuje udaną odpowiedź JSON.
        *   (Opcjonalnie, jeśli dodano) Waliduje JSON w odpowiedzi, jeśli użyto `response_format`.
        *   Zwraca sparsowane dane.
        *   Loguje błędy.

#### 2.3.4. `ActionLogsService.ts`
*   **Mocki:** `SupabaseClient` (mock dla `from('action_logs').insert()`), `log`.
*   **Scenariusze:**
    *   **`logAction`:** Wywołuje `supabase.from('action_logs').insert()` z poprawnymi danymi (`user_id`, `action_type`, `details`). Loguje błędy DB, ale ich nie rzuca.
    *   **`logFlashcardAdd`:** Wywołuje `logAction` z `action_type = 'ADD'` i `related_flashcard_id`.
    *   **`logFlashcardDelete`:** Wywołuje `logAction` z `action_type = 'DELETE'` i `related_flashcard_id`.

### 2.4. Funkcje Pomocnicze (`src/lib/utils`)

*   **`cn` (`utils.ts`):** Testuje różne kombinacje klas, aby upewnić się, że `clsx` i `tailwind-merge` działają poprawnie.
*   **`generateId` (`id.ts`):** Sprawdza, czy zwracany jest string w formacie UUID (można użyć regex).
*   **`log` (`logger.ts`):** Mockuje `console.log/warn/error`. Sprawdza, czy odpowiednia metoda konsoli jest wywoływana dla danego poziomu logowania. Sprawdza, czy komunikat, kontekst i sformatowany błąd (w tym `cause`) są poprawnie przekazywane.
*   **`sanitizeInput` (z `api/flashcards.ts` - można wydzielić do utils):** Sprawdza trymowanie, normalizację spacji, usuwanie znaków kontrolnych (jeśli dodano), kapitalizację dla `polish_word` i `spanish_word`.

### 2.5. Handlery API (`src/pages/api`)

*   **Ogólne podejście:** Mockować serwisy (`FlashcardsService`, `GenerationService`, `ActionLogsService`), mockować `context` Astro (`locals`, `request`, `url`, `cookies`). Testować logikę handlera:
    *   Sprawdzenie autentykacji (`context.locals.user`).
    *   Walidację danych wejściowych (ciało żądania, parametry query/ścieżki) za pomocą Zod.
    *   Wywołanie odpowiednich metod serwisów z poprawnymi argumentami.
    *   Obsługę błędów z serwisów.
    *   Formatowanie poprawnej odpowiedzi (status, ciało JSON, nagłówki, ew. cookies).
*   **Przykładowe scenariusze dla `POST /api/flashcards`:**
    *   Zwraca 401, gdy brak `context.locals.user`.
    *   Zwraca 400, gdy ciało żądania jest nieprawidłowe (błąd Zod).
    *   Wywołuje `flashcardsService.createFlashcard` z poprawnymi, zsanitizowanymi danymi i `userId`.
    *   Zwraca 201 z danymi fiszki, gdy serwis zwróci sukces.
    *   Zwraca 409, gdy serwis rzuci błąd "already exists".
    *   Zwraca 500, gdy serwis rzuci inny błąd.
*   **Przykładowe scenariusze dla `GET /api/flashcards`:**
    *   Zwraca 401, gdy brak `context.locals.user`.
    *   Zwraca 400, gdy parametry query są nieprawidłowe (błąd Zod).
    *   Wywołuje `flashcardsService.getFlashcardsCount` i `flashcardsService.getFlashcards` z poprawnymi, zwalidowanymi parametrami.
    *   Poprawnie oblicza paginację.
    *   Zwraca 200 z pustą listą i poprawną paginacją, gdy `totalItems` jest 0.
    *   Zwraca 200 z listą fiszek i poprawną paginacją.
    *   Zwraca 500, gdy serwisy rzucą błąd.
*   **Podobnie dla pozostałych endpointów** (`DELETE /api/flashcards/[id]`, `POST /api/generate`, `POST /api/auth/*`).

## 3. Uwagi Końcowe

*   Ten plan jest punktem wyjścia. Szczegółowe przypadki testowe powinny być tworzone podczas implementacji testów dla każdej jednostki.
*   Należy dążyć do wysokiego pokrycia logiki biznesowej, obsługi błędów i warunków brzegowych.
*   Mockowanie powinno być stosowane rozważnie, aby testować rzeczywistą logikę jednostki, a nie implementację mocka.
*   Testy jednostkowe powinny być szybkie i uruchamiane często, idealnie w ramach CI/CD.