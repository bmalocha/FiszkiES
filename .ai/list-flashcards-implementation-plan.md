# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy pobiera listę fiszek należących do uwierzytelnionego użytkownika. Obsługuje paginację i opcjonalne sortowanie, aby umożliwić użytkownikom przeglądanie ich kolekcji fiszek.

## 2. Szczegóły żądania
- Metoda HTTP: `GET`
- Struktura URL: `/api/flashcards`
- Parametry:
  - Wymagane: Brak (identyfikator użytkownika wywnioskowany z sesji/tokenu JWT)
  - Opcjonalne (Query Parameters):
    - `page` (integer, default=1): Numer strony dla paginacji. Musi być liczbą całkowitą dodatnią.
    - `pageSize` (integer, default=20): Liczba elementów na stronie. Musi być liczbą całkowitą dodatnią.
    - `sortBy` (string, default='created_at'): Pole, według którego sortować fiszki. Dozwolone wartości: `created_at`, `polish_word`, `spanish_word`.
    - `sortOrder` (string, default='desc'): Porządek sortowania. Dozwolone wartości: `asc`, `desc`.
- Request Body: Brak

## 3. Wykorzystywane typy
- `Flashcard` (z `src/types.ts`): Reprezentuje pojedynczą fiszkę.
- `Pagination` (z `src/types.ts`): Struktura metadanych paginacji.
- `GetFlashcardsResponseDto` (z `src/types.ts`): Definiuje strukturę odpowiedzi sukcesu.
- Zod Schema: Do walidacji parametrów zapytania (`page`, `pageSize`, `sortBy`, `sortOrder`) w pliku endpointu.

## 4. Szczegóły odpowiedzi
- Sukces (Kod statusu `200 OK`):
  ```json
  {
    "data": [
      // Array of Flashcard objects
      {
        "id": "uuid",
        "polish_word": "string",
        "spanish_word": "string",
        "example_sentence": "string",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 150, // Całkowita liczba fiszek użytkownika
      "totalPages": 8   // Obliczone na podstawie totalItems i pageSize
    }
  }
  ```
- Błąd walidacji (Kod statusu `400 Bad Request`):
  ```json
  {
    "error": "Validation failed",
    "details": [ /* Szczegóły błędów walidacji Zod */ ]
  }
  ```
- Nieautoryzowany (Kod statusu `401 Unauthorized`): Odpowiedź z middleware (jeśli token jest nieprawidłowy/brakujący).
- Błąd serwera (Kod statusu `500 Internal Server Error`):
  ```json
  {
    "error": "Internal Server Error"
  }
  ```

## 5. Przepływ danych
1. Żądanie `GET /api/flashcards` trafia do serwera Astro.
2. Middleware (`src/middleware/index.ts`) przechwytuje żądanie:
   - Weryfikuje token JWT Supabase z nagłówka `Authorization`.
   - Jeśli token jest nieprawidłowy lub go brakuje, zwraca `401 Unauthorized`.
   - Jeśli token jest prawidłowy, pobiera dane użytkownika i dołącza je do `Astro.locals` (w tym `Astro.locals.user.id` i `Astro.locals.supabase` - klient Supabase uwierzytelniony dla użytkownika).
3. Handler endpointu Astro (`src/pages/api/flashcards/index.astro`) jest wywoływany.
4. Handler odczytuje opcjonalne parametry zapytania (`page`, `pageSize`, `sortBy`, `sortOrder`) z `Astro.url.searchParams`.
5. Waliduje i parsuje parametry zapytania przy użyciu schematu Zod (z domyślnymi wartościami, jeśli brakuje).
6. Jeśli walidacja nie powiodła się, zwraca odpowiedź `400 Bad Request` z błędami.
7. Handler wywołuje metodę serwisu, np. `flashcardService.getUserFlashcards(userId, { page, pageSize, sortBy, sortOrder })`, przekazując `userId` z `Astro.locals.user.id` oraz zwalidowane/domyślne opcje.
8. `flashcardService.getUserFlashcards`:
   - Konstruuje zapytanie do Supabase dla tabeli `flashcards`.
   - **Kluczowe**: Filtruje wyniki używając `.eq('user_id', userId)` w celu zapewnienia pobrania tylko fiszek należących do zalogowanego użytkownika (jako dodatkowe zabezpieczenie do RLS).
   - Pobiera całkowitą liczbę pasujących fiszek dla danego `userId` (`select('*', { count: 'exact', head: true })`).
   - Stosuje paginację używając `.range((page - 1) * pageSize, page * pageSize - 1)`.
   - Stosuje sortowanie używając `.order(sortBy, { ascending: sortOrder === 'asc' })`.
   - Wykonuje główne zapytanie (`select('*')`) w celu pobrania danych fiszek dla bieżącej strony.
   - Jeśli wystąpi błąd bazy danych, zgłasza wyjątek.
   - Zwraca obiekt zawierający listę fiszek (`data`) i metadane paginacji (`totalItems`).
9. Handler endpointu Astro:
    - Otrzymuje dane z serwisu.
    - Oblicza `totalPages`.
    - Konstruuje obiekt `GetFlashcardsResponseDto`.
    - Zwraca odpowiedź `200 OK` z payloadem DTO w formacie JSON.
10. W przypadku nieobsługiwanych błędów w handlerze lub serwisie, używa loggera (`src/lib/utils/logger.ts`) do zarejestrowania błędu i zwraca odpowiedź `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Obsługiwane przez middleware Astro, które weryfikuje token JWT Supabase. Żądania bez ważnego tokenu nie dotrą do handlera endpointu.
- **Autoryzacja**:
    - Główny mechanizm: PostgreSQL Row-Level Security (RLS) skonfigurowany w Supabase dla tabeli `flashcards` (`Allow authenticated users to SELECT their own flashcards`). Gwarantuje, że zapytania do bazy danych zwrócą tylko wiersze należące do `auth.uid()`.
    - Dodatkowe zabezpieczenie (Defense-in-Depth): Logika serwisu *musi* zawierać warunek `.eq('user_id', userId)` w zapytaniu Supabase, używając `userId` z `Astro.locals`.
- **Walidacja danych wejściowych**: Parametry zapytania (`page`, `pageSize`, `sortBy`, `sortOrder`) są ściśle walidowane przy użyciu Zod, aby zapobiec nieprawidłowym wartościom, które mogłyby prowadzić do błędów lub nieoczekiwanych zapytań do bazy danych. Ograniczenie `sortBy` do dozwolonych kolumn zapobiega próbom sortowania według nieindeksowanych lub wrażliwych pól.

## 7. Obsługa błędów
- **Błędy walidacji (400)**: Wykrywane przez Zod w handlerze. Zwraca odpowiedź JSON z opisem błędu.
- **Nieautoryzowany dostęp (401)**: Obsługiwane przez middleware przed wykonaniem logiki endpointu.
- **Błędy bazy danych (500)**: Wyłapywane w bloku `try...catch` w serwisie lub handlerze. Logowane przy użyciu `log` z `src/lib/utils/logger.ts`. Zwraca generyczną odpowiedź `500 Internal Server Error`.
- **Inne nieoczekiwane błędy (500)**: Wyłapywane w głównym bloku `try...catch` w handlerze endpointu Astro. Logowane i zwracana jest odpowiedź `500`.

## 8. Rozważania dotyczące wydajności
- **Indeksy bazy danych**: Upewnij się, że istnieje indeks na kolumnie `user_id` w tabeli `flashcards` (`idx_flashcards_user_id`), co jest kluczowe dla wydajności filtrowania. Indeksy na kolumnach używanych do sortowania (`created_at`, `polish_word`, `spanish_word`) również poprawią wydajność `ORDER BY`.
- **Paginacja**: Implementacja paginacji po stronie serwera (`range()`) jest niezbędna, aby uniknąć pobierania całej kolekcji fiszek użytkownika przy każdym żądaniu, zwłaszcza dla użytkowników z dużą liczbą fiszek.
- **Zapytanie o liczbę**: Wykonanie osobnego zapytania (`head: true, count: 'exact'`) w celu uzyskania całkowitej liczby elementów jest konieczne dla metadanych paginacji. Jest to standardowa praktyka.
- **Rozmiar odpowiedzi**: Domyślny `pageSize` (20) jest rozsądny. Należy rozważyć ustalenie maksymalnego `pageSize`, aby zapobiec żądaniom o nadmiernie dużą liczbę danych.

## 9. Etapy wdrożenia
1.  **Utworzenie pliku endpointu**: Stwórz plik `src/pages/api/flashcards/index.astro`.
2.  **Implementacja handlera GET**: Dodaj funkcję `export async function GET({ request, url, locals }: APIContext)` do pliku endpointu.
3.  **Middleware**: Potwierdź, że middleware (`src/middleware/index.ts`) poprawnie weryfikuje JWT, pobiera `user.id` i inicjalizuje `locals.supabase`.
4.  **Walidacja Zod**: Zdefiniuj schemat Zod w pliku endpointu do walidacji parametrów `page`, `pageSize`, `sortBy`, `sortOrder`. Zaimplementuj logikę walidacji przy użyciu `safeParse`. Obsłuż błędy walidacji, zwracając `400 Bad Request`.
5.  **Utworzenie serwisu**: Stwórz plik `src/lib/services/flashcardService.ts` (jeśli jeszcze nie istnieje).
6.  **Implementacja metody serwisowej**: Dodaj metodę `async getUserFlashcards(supabase: SupabaseClient, userId: string, options: { page: number, pageSize: number, sortBy: string, sortOrder: 'asc' | 'desc' })` w `flashcardService.ts`.
7.  **Logika zapytania Supabase**: W metodzie serwisowej zaimplementuj logikę zapytania do Supabase, w tym:
    - Pobranie klienta Supabase z `locals.supabase`.
    - Filtrowanie po `user_id`.
    - Pobranie całkowitej liczby elementów (`count: 'exact'`).
    - Paginację (`range`).
    - Sortowanie (`order`).
    - Obsługę błędów bazy danych.
8.  **Integracja Handler-Serwis**: Wywołaj metodę serwisową z handlera endpointu, przekazując `locals.supabase`, `locals.user.id` i zwalidowane opcje.
9.  **Konstrukcja odpowiedzi**: W handlerze, na podstawie danych zwróconych przez serwis, skonstruuj obiekt `GetFlashcardsResponseDto` i zwróć go jako odpowiedź JSON z kodem statusu `200 OK`.
10. **Obsługa błędów i logowanie**: Zaimplementuj bloki `try...catch` w handlerze i serwisie. Użyj funkcji `log` z `src/lib/utils/logger.ts` do logowania błędów `500`.
11. **Typy**: Upewnij się, że używane są odpowiednie typy z `src/types.ts` (`Flashcard`, `Pagination`, `GetFlashcardsResponseDto`).
12. **Testowanie**: Napisz testy jednostkowe dla logiki serwisu i testy integracyjne dla endpointu API, obejmujące różne przypadki (sukces, błędy walidacji, różne opcje sortowania/paginacji).
13. **Dokumentacja**: Upewnij się, że endpoint jest udokumentowany (np. w pliku `api-plan.md` lub dedykowanej dokumentacji API). 