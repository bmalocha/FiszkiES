# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

Usługa `OpenRouterService` będzie odpowiedzialna za komunikację z API OpenRouter w celu generowania odpowiedzi z modeli językowych (LLM). Będzie enkapsulować logikę wysyłania żądań, obsługi odpowiedzi, zarządzania konfiguracją modelu oraz obsługi błędów. Usługa zostanie zaimplementowana w TypeScript i będzie wykorzystywana w ramach aplikacji Astro.

## 2. Opis Konstruktora

Konstruktor `OpenRouterService` powinien przyjmować klucz API OpenRouter jako argument. Klucz ten będzie przechowywany w zmiennych środowiskowych i przekazywany do usługi podczas jej inicjalizacji.

```typescript
// Przykład w src/lib/openrouter/OpenRouterService.ts
import { z } from 'zod';

// Zdefiniuj schema Zod dla parametrów modelu, jeśli to konieczne
const ModelParamsSchema = z.object({
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  // ... inne parametry
}).optional();

// Zdefiniuj schema Zod dla odpowiedzi JSON, jeśli używasz response_format
const ExampleJsonResponseSchema = z.object({
  // ... definicja schematu
});

export class OpenRouterService {
  private apiKey: string;
  private openRouterApiUrl = 'https://openrouter.ai/api/v1/chat/completions'; // URL API OpenRouter

  constructor(apiKey: string) {
    if (!apiKey) {
      // Użyj loggera do logowania błędu
      // logger.error('Klucz API OpenRouter jest wymagany.'); // Zastąp loggerem z src/lib/utils/logger.ts
      throw new Error('Klucz API OpenRouter jest wymagany.');
    }
    this.apiKey = apiKey;
  }

  // ... reszta metod
}
```

## 3. Publiczne Metody i Pola

- **`generateChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>`**: Główna metoda do wysyłania żądania do API OpenRouter.
  - `options`: Obiekt zawierający:
    - `model`: Nazwa modelu OpenRouter (np. `anthropic/claude-3-haiku`).
    - `messages`: Tablica obiektów wiadomości (`{ role: 'system' | 'user' | 'assistant', content: string }`). Musi zawierać co najmniej jedną wiadomość użytkownika.
    - `response_format` (opcjonalnie): Obiekt definiujący format odpowiedzi. Dla JSON: `{ type: 'json_schema', json_schema: { name: string, strict: boolean, schema: object } }`.
    - `params` (opcjonalnie): Obiekt z dodatkowymi parametrami modelu (np. `temperature`, `max_tokens`).
  - Zwraca: Obietnicę (`Promise`), która rozwiązuje się do przetworzonej odpowiedzi z API lub jest odrzucana w przypadku błędu.

```typescript
// Przykład w src/lib/openrouter/OpenRouterService.ts (wewnątrz klasy OpenRouterService)

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Typ dla schematu JSON używanego w response_format
interface JsonSchemaFormat {
  name: string;
  strict: boolean;
  schema: object; // Zod schema definition or plain object schema
}

interface ChatCompletionOptions {
  model: string;
  messages: Message[];
  response_format?: { type: 'json_schema'; json_schema: JsonSchemaFormat };
  params?: z.infer<typeof ModelParamsSchema>; // Użyj zdefiniowanego schematu Zod
}

// Typ odpowiedzi (dostosuj w zależności od potrzeb)
interface ChatCompletionResponse {
  // Przykładowa struktura odpowiedzi
  id: string;
  choices: {
    message: Message;
    // ... inne pola
  }[];
  // ... inne pola
}


public async generateChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    // 1. Walidacja opcji (np. używając Zod)
    // 2. Przygotowanie ciała żądania zgodnie ze specyfikacją OpenRouter API
    const requestBody = {
      model: options.model,
      messages: options.messages,
      ...(options.response_format && { response_format: options.response_format }),
      ...(options.params && { ...options.params }), // Rozpakuj parametry, jeśli istnieją
    };

    // 3. Wysłanie żądania POST do this.openRouterApiUrl
    try {
      const response = await fetch(this.openRouterApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          // Opcjonalnie: Dodaj inne nagłówki zalecane przez OpenRouter
          // 'HTTP-Referer': 'YOUR_SITE_URL', // Zastąp swoim URL
          // 'X-Title': 'YOUR_SITE_NAME', // Zastąp nazwą swojej aplikacji
        },
        body: JSON.stringify(requestBody),
      });

      // 4. Obsługa odpowiedzi HTTP
      if (!response.ok) {
        // Szczegółowa obsługa błędów HTTP (patrz sekcja 5)
        const errorData = await response.json().catch(() => ({})); // Spróbuj sparsować błąd JSON
        // logger.error(`Błąd API OpenRouter: ${response.status} ${response.statusText}`, errorData); // Zastąp loggerem
        throw new Error(`Błąd API OpenRouter: ${response.status} ${response.statusText}`);
      }

      // 5. Parsowanie odpowiedzi JSON
      const data: ChatCompletionResponse = await response.json();

      // 6. Opcjonalna walidacja odpowiedzi (np. używając Zod, jeśli zdefiniowano schemat dla `response_format`)
      if (options.response_format?.type === 'json_schema') {
          // Spróbuj sparsować zawartość JSON z wiadomości asystenta
          try {
              const assistantMessageContent = data.choices[0]?.message?.content;
              if (assistantMessageContent) {
                  const jsonData = JSON.parse(assistantMessageContent);
                  // Tutaj można dodać walidację Zod na podstawie options.response_format.json_schema.schema
                  // np. const validationResult = z.object(options.response_format.json_schema.schema).safeParse(jsonData);
                  // if (!validationResult.success) { ... obsługa błędu walidacji ... }
              } else {
                  // logger.warn('Brak zawartości wiadomości asystenta do walidacji JSON.'); // Zastąp loggerem
              }
          } catch (parseError) {
              // logger.error('Błąd parsowania odpowiedzi JSON z modelu.', parseError); // Zastąp loggerem
              throw new Error('Nie udało się sparsować odpowiedzi JSON z modelu.');
          }
      }


      // 7. Zwrócenie przetworzonej odpowiedzi
      return data;

    } catch (error) {
      // logger.error('Nieoczekiwany błąd podczas komunikacji z OpenRouter API.', error); // Zastąp loggerem
      // Rzuć dalej lub zwróć przetworzony błąd
      throw error; // Można opakować w bardziej specyficzny typ błędu
    }
  }
```

## 4. Prywatne Metody i Pola

- **`apiKey: string`**: Przechowuje klucz API OpenRouter.
- **`openRouterApiUrl: string`**: Stały adres URL API OpenRouter.
- **`validateOptions(options: ChatCompletionOptions): void`** (sugestia): Prywatna metoda do walidacji obiektu `options` przed wysłaniem żądania. Może wykorzystywać Zod.
- **`handleApiError(response: Response): Promise<ApiError>`** (sugestia): Prywatna metoda do obsługi błędów zwracanych przez API OpenRouter.

## 5. Obsługa Błędów

Usługa powinna implementować robustną obsługę błędów, obejmującą:

1.  **Błędy Konfiguracji**: Brakujący lub nieprawidłowy klucz API (obsłużony w konstruktorze).
2.  **Błędy Walidacji Wejścia**: Nieprawidłowe `options` przekazane do `generateChatCompletion` (np. brak `model`, pusta tablica `messages`, nieprawidłowy format `response_format`). Użyj Zod do walidacji.
3.  **Błędy Sieciowe**: Problemy z połączeniem z API OpenRouter (timeout, brak połączenia). Obsłuż w bloku `catch` wywołania `fetch`.
4.  **Błędy API OpenRouter (HTTP)**:
    - `400 Bad Request`: Nieprawidłowe żądanie (np. zły format JSON, brak wymaganych pól). Odpowiedź API często zawiera szczegóły błędu.
    - `401 Unauthorized`: Nieprawidłowy klucz API.
    - `402 Payment Required`: Problem z płatnością na koncie OpenRouter.
    - `403 Forbidden`: Brak uprawnień do użycia danego modelu lub funkcji.
    - `429 Too Many Requests`: Przekroczono limit zapytań. Zaimplementuj logikę ponawiania prób (retry) z wykładniczym backoffem.
    - `500 Internal Server Error`: Błąd po stronie serwera OpenRouter. Spróbuj ponowić zapytanie.
    - `503 Service Unavailable`: Usługa tymczasowo niedostępna. Spróbuj ponowić zapytanie.
    Należy logować status HTTP, statusText oraz, jeśli dostępne, ciało odpowiedzi błędu.
5.  **Błędy Parsowania Odpowiedzi**: Nieprawidłowy format JSON w odpowiedzi API (rzadkie, ale możliwe). Obsłuż w bloku `catch` po `response.json()`.
6.  **Błędy Walidacji Odpowiedzi JSON**: Jeśli używany jest `response_format: { type: 'json_schema' }`, odpowiedź modelu może nie być zgodna ze schematem. Należy to obsłużyć po sparsowaniu odpowiedzi modelu.

Zaleca się używanie dedykowanego loggera (`src/lib/utils/logger.ts`) do rejestrowania błędów wraz z kontekstem. Rozważ zdefiniowanie niestandardowych klas błędów dla lepszej obsługi (`OpenRouterApiError`, `ValidationError` itp.).

## 6. Kwestie Bezpieczeństwa

1.  **Klucz API**: Klucz API OpenRouter jest wrażliwą daną. Przechowuj go bezpiecznie w zmiennych środowiskowych (`OPENROUTER_API_KEY`). **Nigdy** nie umieszczaj klucza bezpośrednio w kodzie źródłowym ani nie przesyłaj go do frontendu. Usługa powinna działać wyłącznie po stronie serwera (w kontekście Astro API routes lub middleware).
2.  **Walidacja Wejścia**: Dokładnie waliduj wszystkie dane wejściowe (parametry, wiadomości) przed wysłaniem ich do API, aby zapobiec potencjalnym atakom typu injection. Użyj Zod do walidacji schematów.
3.  **Zarządzanie Limitami**: Monitoruj użycie API i koszty w panelu OpenRouter. Zaimplementuj mechanizmy ograniczania liczby żądań (rate limiting) po stronie aplikacji, jeśli to konieczne, aby uniknąć nadmiernych kosztów lub przekroczenia limitów API.
4.  **Ochrona przed Nadużyciami**: Jeśli usługa jest wywoływana na podstawie danych wejściowych od użytkowników, upewnij się, że istnieją mechanizmy zapobiegające nadużyciom (np. ograniczenie długości promptów, filtrowanie treści).

## 7. Plan Wdrożenia Krok po Kroku

1.  **Konfiguracja Środowiska**:
    - Dodaj zmienną środowiskową `OPENROUTER_API_KEY` do pliku `.env` (i `.env.example`). Upewnij się, że `.env` jest dodany do `.gitignore`.
    - Zainstaluj `zod`, jeśli jeszcze nie jest zainstalowany (`npm install zod`).
2.  **Utworzenie Struktury Plików**:
    - Utwórz katalog `src/lib/openrouter`.
    - Wewnątrz `src/lib/openrouter` utwórz plik `OpenRouterService.ts`.
    - Opcjonalnie utwórz plik `types.ts` w tym samym katalogu dla definicji typów specyficznych dla OpenRouter lub umieść je w `src/types.ts`, jeśli mają być współdzielone.
    - Utwórz lub skonfiguruj plik `src/lib/utils/logger.ts` dla logowania.
3.  **Implementacja Klasy `OpenRouterService`**:
    - Zaimplementuj konstruktor przyjmujący `apiKey` i sprawdzający jego istnienie. Rzuć błąd, jeśli go brakuje. Zapisz `apiKey` w prywatnym polu.
    - Zdefiniuj stałą `openRouterApiUrl`.
    - Zaimplementuj publiczną metodę `generateChatCompletion(options: ChatCompletionOptions)`.
    - Wewnątrz `generateChatCompletion`:
        - **Walidacja Wejścia**: Użyj Zod do walidacji obiektu `options`. Zdefiniuj odpowiednie schematy Zod dla `options`, `params` i ewentualnie dla `json_schema`.
        - **Przygotowanie Żądania**: Skonstruuj obiekt `requestBody` zgodnie ze specyfikacją OpenRouter API v1 (`model`, `messages`, opcjonalnie `response_format`, parametry modelu).
            - **Komunikat Systemowy**: Przekaż jako pierwszą wiadomość w tablicy `messages` z `role: 'system'`. Np.: `{ role: 'system', content: 'Jesteś pomocnym asystentem...' }`.
            - **Komunikat Użytkownika**: Przekaż jako wiadomość z `role: 'user'`. Np.: `{ role: 'user', content: 'Wygeneruj fiszki dla tego tekstu: ...' }`.
            - **`response_format`**: Jeśli wymagana jest odpowiedź w formacie JSON, przekaż obiekt:
              \`\`\`typescript
              // Przykład użycia Zod do definicji schematu
              const FlashcardsSchema = z.object({
                flashcards: z.array(z.object({
                  front: z.string(),
                  back: z.string()
                }))
              });

              // ... wewnątrz generateChatCompletion
              if (wymaganyJson) { // Warunek określający potrzebę JSON
                options.response_format = {
                  type: 'json_schema',
                  json_schema: {
                    name: 'FlashcardsResponse', // Nazwa schematu
                    strict: true, // Wymuś ścisłe przestrzeganie schematu
                    schema: FlashcardsSchema.openapi('FlashcardsSchema') // Konwertuj schemat Zod na JSON Schema
                  }
                };
              }
              \`\`\`
            - **Nazwa Modelu**: Przekaż w `options.model`, np. `'openai/gpt-4o'`.
            - **Parametry Modelu**: Przekaż w `options.params`, np. `{ temperature: 0.7, max_tokens: 500 }`.
        - **Wysyłanie Żądania**: Użyj `fetch` do wysłania żądania POST z odpowiednimi nagłówkami (`Authorization: Bearer ${this.apiKey}`, `Content-Type: application/json`, opcjonalnie `HTTP-Referer`, `X-Title`).
        - **Obsługa Odpowiedzi**: Sprawdź `response.ok`. Jeśli nie jest OK, rzuć błąd, logując szczegóły (status, statusText, ewentualne ciało błędu).
        - **Parsowanie Odpowiedzi**: Użyj `response.json()` do sparsowania odpowiedzi.
        - **Walidacja Odpowiedzi JSON (opcjonalnie)**: Jeśli użyto `response_format` z JSON Schema, sparsuj `content` wiadomości asystenta i opcjonalnie zwaliduj go za pomocą Zod na podstawie przekazanego schematu.
        - **Zwrócenie Wyniku**: Zwróć sparsowane dane.
    - **Implementacja Obsługi Błędów**: Dodaj bloki `try...catch` wokół `fetch` i `response.json()`. Loguj błędy używając `loggera`. Rozważ implementację logiki ponawiania prób dla błędów 429 i 5xx.
4.  **Integracja z Aplikacją**:
    - W miejscach, gdzie potrzebna jest interakcja z LLM (np. w Astro API route `/api/generate-flashcards`), zaimportuj `OpenRouterService`.
    - Utwórz instancję usługi, przekazując klucz API ze zmiennych środowiskowych (`import.meta.env.OPENROUTER_API_KEY` w Astro).
    - Wywołaj metodę `generateChatCompletion` z odpowiednimi opcjami.
    - Obsłuż wynik lub błąd zwrócony przez usługę. Pamiętaj, aby używać `context.locals.supabase` zamiast bezpośredniego importu klienta Supabase w Astro routes (zgodnie z regułami).
5.  **Testowanie**:
    - Napisz testy jednostkowe dla `OpenRouterService`, mockując `fetch` i sprawdzając poprawność konstruowania żądań oraz obsługę różnych scenariuszy odpowiedzi i błędów.
    - Przeprowadź testy integracyjne, wywołując punkty końcowe API aplikacji, które korzystają z usługi.
6.  **Dokumentacja**:
    - Dodaj komentarze JSDoc do klasy, metod i typów w `OpenRouterService.ts`.
    - Upewnij się, że ten plik (`openrouter-service-implementation-plan.md`) jest aktualny. 