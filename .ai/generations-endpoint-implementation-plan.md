# API Endpoint Implementation Plan: POST /api/generate

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest odpowiedzialny za generowanie propozycji fiszek na podstawie tekstu dostarczonego przez uwierzytelnionego użytkownika. Wykorzystuje zewnętrzną usługę AI (Openrouter.ai) do analizy tekstu i sugerowania par słów (polski-hiszpański) wraz ze zdaniami przykładowymi. Punkt końcowy deduplikuje sugestie, loguje akcję `GENERATE` i zwraca listę unikalnych sugestii do frontendu.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/generate`
- **Parametry**:
  - Wymagane: Brak parametrów URL lub query string. Uwierzytelnienie jest wymagane (obsługiwane przez middleware).
  - Opcjonalne: Brak.
- **Request Body**: Wymagany jest obiekt JSON o następującej strukturze:
  ```json
  {
    "text": "string"
  }
  ```
  - `text`: Ciąg znaków zawierający tekst do analizy (maksymalna długość: 10000 znaków).

## 3. Wykorzystywane typy
- **Command Models**:
  - `GenerateSuggestionsCommand` (`src/types.ts`): Definiuje strukturę ciała żądania (`{ text: string }`).
- **Data Transfer Objects (DTOs)**:
  - `GenerateSuggestionsResponseDto` (`src/types.ts`): Definiuje strukturę odpowiedzi API (`{ suggestions: FlashcardSuggestion[] }`).
  - `FlashcardSuggestion` (`src/types.ts`): Definiuje strukturę pojedynczej sugestii fiszki zwracanej przez API (`{ id: string; polish_word: string; spanish_word: string; example_sentence: string; }`).
- **Database Types**:
  - `TablesInsert<'action_logs'>` (`src/db/database.types.ts`): Typ używany do wstawiania danych do tabeli `action_logs`.

## 4. Szczegóły odpowiedzi
- **Sukces (Kod statusu `200 OK`)**:
  ```json
  {
    "suggestions": [
      {
        "id": "temp_uuid_1", // Wygenerowany unikalny tymczasowy identyfikator frontendowy
        "polish_word": "słowo1",
        "spanish_word": "palabra1",
        "example_sentence": "Przykład zdania 1."
      },
      {
        "id": "temp_uuid_2",
        "polish_word": "słowo2",
        "spanish_word": "palabra2",
        "example_sentence": "Przykład zdania 2."
      }
      // ... (oczekiwane 6-12 unikalnych sugestii)
    ]
  }
  ```
- **Błędy**:
  - `400 Bad Request`: Nieprawidłowe ciało żądania (np. brak pola `text`, `text` nie jest stringiem, `text` za długi, nieprawidłowy JSON). Odpowiedź może zawierać szczegóły błędu walidacji.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony (obsługiwane przez middleware).
  - `500 Internal Server Error`: Błąd po stronie serwera (np. błąd komunikacji z AI, błąd bazy danych, nieoczekiwany wyjątek). Odpowiedź powinna być generyczna, np. `{"error": "Internal Server Error"}`.

## 5. Przepływ danych
1.  **Żądanie Klienta**: Frontend wysyła żądanie `POST` na `/api/generate` z tokenem uwierzytelniającym i ciałem JSON zawierającym `text`.
2.  **Middleware (Astro)**: Przechwytuje żądanie, weryfikuje token JWT, pobiera `user_id` z Supabase Auth i dołącza informacje o użytkowniku do `Astro.locals`. Jeśli uwierzytelnienie zawiedzie, zwraca `401 Unauthorized`. Opcjonalnie, middleware może sprawdzić rate limiting.
3.  **Handler API Route (`src/pages/api/generate.ts`)**:
    a. Sprawdza, czy `Astro.locals.user` istnieje. Jeśli nie, zwraca `500` (błąd konfiguracji middleware) lub `401` (jeśli middleware nie rzuciło błędu).
    b. Waliduje ciało żądania (JSON, struktura `GenerateSuggestionsCommand`, typ i długość pola `text`) używając np. Zod. Jeśli walidacja zawiedzie, zwraca `400 Bad Request`.
    c. Pobiera `user_id` z `Astro.locals.user`.
    d. Wywołuje `generationService.generateFlashcards(text)`.
4.  **Generation Service (`src/lib/generationService.ts`)**:
    a. Konstruuje odpowiedni prompt dla modelu AI (Openrouter.ai), zawierający `text` użytkownika i instrukcje dotyczące formatu wyjściowego (np. JSON z polskim słowem, hiszpańskim słowem i zdaniem przykładowym).
    b. Wysyła żądanie do API Openrouter.ai, używając bezpiecznie przechowywanego klucza API.
    c. Odbiera odpowiedź od AI.
    d. Parsuje odpowiedź AI, starając się wyodrębnić listę potencjalnych fiszek. Obsługuje ewentualne błędy parsowania lub błędy zwrócone przez API AI.
    e. Deduplikuje listę sugestii na podstawie zawartości (`polish_word`, `spanish_word`, `example_sentence`).
    f. Zwraca listę unikalnych, sparsowanych sugestii (bez tymczasowego `id`) do handlera API.
5.  **Handler API Route (kontynuacja)**:
    a. Jeśli `generationService` zwrócił błąd, handler zwraca `500 Internal Server Error`.
    b. Pobiera listę unikalnych sugestii.
    c. Oblicza `input_text_length = text.length` i `cards_count = suggestions.length`.
    d. Wywołuje `logService.logAction(user_id, 'GENERATE', { input_text_length, cards_count })`.
6.  **Log Service (`src/lib/logService.ts`)**:
    a. Tworzy obiekt logu (`ActionLog` / `TablesInsert<'action_logs'>`) z `user_id`, `action_type = 'GENERATE'`, `input_text_length`, `cards_count` i `created_at = now()`. `related_flashcard_id` będzie `NULL`.
    b. Używa klienta Supabase (`supabase.from('action_logs').insert(...)`) do zapisania rekordu w bazie danych. Obsługuje ewentualne błędy zapisu do DB.
7.  **Handler API Route (kontynuacja)**:
    a. Jeśli `logService` zwrócił błąd, loguje go po stronie serwera, ale *kontynuuje* proces (logowanie jest drugorzędne w stosunku do zwrócenia sugestii użytkownikowi). Rozważ strategię ponawiania logowania w tle.
    b. Dla każdej unikalnej sugestii generuje tymczasowy, unikalny identyfikator frontendowy (np. używając `crypto.randomUUID()`).
    c. Tworzy obiekt `GenerateSuggestionsResponseDto` zawierający listę sugestii z dodanymi tymczasowymi `id`.
    d. Zwraca odpowiedź JSON z kodem `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu musi być ograniczony tylko do zalogowanych użytkowników. Należy polegać na middleware Astro i Supabase Auth do weryfikacji tokenów JWT i identyfikacji użytkownika.
- **Autoryzacja**: W tym przypadku nie ma specyficznych reguł autoryzacji poza byciem zalogowanym użytkownikiem.
- **Walidacja danych wejściowych**:
    - Bezwzględnie walidować długość pola `text` (max 10000 znaków), aby zapobiec nadużyciom i potencjalnym atakom DoS na usługę AI.
    - Walidować typ i strukturę danych wejściowych (`GenerateSuggestionsCommand`).
    - Rozważyć podstawową sanityzację `text` przed wysłaniem do AI, jeśli istnieją obawy o prompt injection (chociaż ryzyko jest niższe przy generowaniu niż interpretacji).
- **Zarządzanie kluczami API**: Klucz API do Openrouter.ai musi być przechowywany bezpiecznie jako zmienna środowiskowa po stronie serwera i nigdy nie może być ujawniony w kodzie frontendowym ani w odpowiedziach API.

## 7. Rozważania dotyczące wydajności
- **Czas odpowiedzi AI**: Głównym wąskim gardłem będzie czas odpowiedzi zewnętrznego API Openrouter.ai. Należy wybrać odpowiednio szybki model AI i monitorować jego wydajność.
- **Parsowanie i Deduplikacja**: Operacje te powinny być stosunkowo szybkie dla oczekiwanej liczby sugestii (6-12), ale warto zaimplementować je efektywnie.
- **Logowanie do Bazy Danych**: Operacja zapisu do `action_logs` jest asynchroniczna, ale może wprowadzić niewielkie opóźnienie. Upewnić się, że tabela ma odpowiednie indeksy (`idx_action_logs_user_id`, `idx_action_logs_created_at`). Rozważyć logowanie asynchroniczne lub w tle, jeśli stanie się wąskim gardłem.

## 8. Etapy wdrożenia
1.  **Konfiguracja Środowiska**: Upewnij się, że zmienna środowiskowa dla klucza API Openrouter.ai (`OPENROUTER_API_KEY` lub podobna) jest skonfigurowana w środowisku deweloperskim i produkcyjnym.
2.  **Utworzenie Usług**:
    a. Stwórz plik `src/lib/generationService.ts`). Zaimplementuj funkcję `generateFlashcards(text: string): Promise<Omit<FlashcardSuggestion, 'id'>[]>`, która komunikuje się z Openrouter.ai, parsuje odpowiedź i deduplikuje wyniki. Obsłuż błędy komunikacji i parsowania.
    b. Stwórz lub zaktualizuj `src/lib/logService.ts`. Dodaj funkcję `logAction(userId: string, actionType: ActionLog['action_type'], details: { input_text_length?: number; cards_count?: number }): Promise<void>`, która zapisuje rekord w tabeli `action_logs` używając klienta Supabase.
3.  **Implementacja API Route**:
    a. Stwórz plik `src/pages/api/generate.ts` (lub `.astro` jeśli preferowane jest użycie Astro components API).
    b. Zaimportuj niezbędne typy (`GenerateSuggestionsCommand`, `GenerateSuggestionsResponseDto`, `FlashcardSuggestion`, `ActionLog`) i usługi (`aiService`, `logService`).
    c. Zaimplementuj handler `POST`.
    d. Sprawdź uwierzytelnienie (`Astro.locals.user`).
    e. Zwaliduj ciało żądania (`request.json()`) używając Zod i `GenerateSuggestionsCommand`.
    f. Wywołaj `aiService.generateFlashcards`, przekazując zwalidowany `text`.
    g. Wywołaj `logService.logAction`, przekazując `user_id`, `'GENERATE'`, `text.length` i liczbę otrzymanych sugestii.
    h. Wygeneruj tymczasowe `id` dla każdej sugestii.
    i. Sformatuj i zwróć odpowiedź `GenerateSuggestionsResponseDto` z kodem `200 OK`.
    j. Zaimplementuj obsługę błędów dla każdego kroku (walidacja, AI, logowanie), zwracając odpowiednie kody statusu (`400`, `500`).
4.  **Middleware (Weryfikacja/Aktualizacja)**: Upewnij się, że istniejące middleware (`src/middleware/index.ts`) poprawnie obsługuje uwierzytelnianie dla ścieżki `/api/generate` i dodaje `user` do `Astro.locals`. 
