# API Endpoint Implementation Plan: Accept Flashcard Suggestion

## 1. Przegląd punktu końcowego
Endpoint ma na celu przyjęcie sugestii fiszki wygenerowanej wcześniej przez system, zapisanie jej do bazy użytkownika oraz zarejestrowanie akcji `ADD` w tabeli `action_logs`. Endpoint jest dostępny tylko dla uwierzytelnionych użytkowników i wykorzystuje ograniczenia bazy danych oraz mechanizmy RLS w celu zapewnienia poprawności i bezpieczeństwa operacji.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST
- **Struktura URL:** `/api/flashcards`
- **Parametry:**
  - Brak parametrów URL
  - W nagłówkach: Autoryzacja (JWT) wymagana poprzez nagłówek `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "polish_word": "string", // Wymagany, maksymalnie 100 znaków
    "spanish_word": "string", // Wymagany, maksymalnie 100 znaków
    "example_sentence": "string" // Wymagany, maksymalnie 300 znaków
  }
  ```

## 3. Wykorzystywane typy
- **CreateFlashcardCommand:** Zawiera pola `polish_word`, `spanish_word` oraz `example_sentence` (definiowany w `src/types.ts`).
- **CreateFlashcardResponseDto:** Obejmuje pola `id`, `polish_word`, `spanish_word`, `example_sentence` oraz `created_at`, reprezentujące nowo utworzoną fiszkę.
- **Flashcard:** Typ reprezentujący strukturę fiszki w bazie danych.
- **ActionLog:** Typ do logowania akcji, użyty do rejestrowania operacji `ADD`.

## 4. Szczegóły odpowiedzi
- **Sukces:**
  - Status: `201 Created`
  - Body:
    ```json
    {
      "id": "uuid",
      "polish_word": "string",
      "spanish_word": "string",
      "example_sentence": "string",
      "created_at": "timestamp"
    }
    ```
- **Błędy:**
  - `400 Bad Request` – Błędy walidacji, np. brak wymaganych pól lub przekroczenie limitów długości.
  - `401 Unauthorized` – Użytkownik niezalogowany lub nieautoryzowany.
  - `500 Internal Server Error` – Błąd po stronie serwera (np. wyjątki niespodziewane).

## 5. Przepływ danych
1. Odbiór żądania POST zawierającego dane fiszki.
2. Walidacja danych wejściowych przy użyciu Zod (sprawdzenie typów oraz limitów długości pól).
3. Pobranie `user_id` z `Astro.locals` (context Supabase) w celu identyfikacji użytkownika.
4. Insercja danych do tabeli `flashcards` przy użyciu klienta Supabase. Ograniczenia RLS i unikalność rekordu (`unique_flashcard_content_for_user`) są egzekwowane na poziomie bazy.
5. Po udanej insercji, wstawienie wpisu logującego akcję `ADD` do tabeli `action_logs`, powiązanego z nowo utworzoną fiszką.
6. Zwrócenie danych fiszki jako odpowiedź na żądanie.

## 6. Względy bezpieczeństwa
- **Autentykacja i autoryzacja:** Wykorzystanie Supabase Auth, pobieranie `user_id` z `Astro.locals`, aby operacja była przeprowadzana tylko dla zalogowanego użytkownika.
- **Walidacja danych:** Użycie Zod do walidacji struktury i limitów długości pól wejściowych.
- **Bezpieczeństwo bazy danych:** Mechanizmy RLS w tabeli `flashcards` oraz ograniczenie unikalności wpisów zabezpieczają przed duplikatami i nieautoryzowanymi operacjami.
- **Zapobieganie atakom:** Użycie zapytań parametryzowanych eliminuje ryzyko SQL Injection.

## 7. Obsługa błędów
- **400 Bad Request:** Zwracany, gdy walidacja danych wejściowych zawiedzie lub gdy zostanie naruszony unikalny constraint (możliwa strategia: zwrócenie komunikatu o konflikcie).
- **401 Unauthorized:** Zwracany, gdy żądanie pochodzi od niezalogowanego użytkownika.
- **500 Internal Server Error:** Dla niespodziewanych błędów serwera, z odpowiednim logowaniem błędów.

## 8. Rozważania dotyczące wydajności
- Endpoint operuje na pojedynczej insercji rekordu, co czyni go operacją lekką.
- Indeksy na kolumnach takich jak `user_id` w tabelach `flashcards` oraz `action_logs` wspierają szybkie wyszukiwanie i insercje.
- W przyszłości, w przypadku zwiększenia obciążenia, można rozważyć dodatkowe mechanizmy buforowania lub optymalizację zapytań.

## 9. Etapy wdrożenia
1. Stworzenie Zod schema do walidacji `CreateFlashcardCommand`.
2. Implementacja pobierania `user_id` z `Astro.locals` oraz weryfikacja autentykacji użytkownika.
3. Integracja z Supabase do insercji danych do tabeli `flashcards`.
4. Dodanie logiki rejestracji akcji w tabeli `action_logs` (akcja `ADD`), z poprawnym powiązaniem z `flashcard_id`.
5. Obsługa błędów - wdrożenie mechanizmów zwracania odpowiednich kodów statusu (400, 401, 500) z czytelnymi komunikatami błędów.
6. Testowanie endpointu (testy jednostkowe i integracyjne) w celu potwierdzenia poprawności walidacji, autoryzacji i logiki biznesowej.
7. Code review, wdrożenie do środowiska testowego oraz monitorowanie działania endpointu.
8. Optymalizacja na podstawie feedbacku użytkowników i wyników monitoringu. 