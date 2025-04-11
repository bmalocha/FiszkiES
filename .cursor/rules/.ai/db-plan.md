```markdown
# Schemat Bazy Danych PostgreSQL - Aplikacja do nauki hiszpańskiego (Wersja 2)

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Typy niestandardowe

```sql
-- Typ wyliczeniowy dla rodzajów akcji logowanych w systemie
CREATE TYPE public.action_enum AS ENUM (
    'GENERATE',    -- Wygenerowanie propozycji fiszek
    'ADD',         -- Dodanie fiszki do bazy użytkownika
    'DELETE',      -- Usunięcie fiszki przez użytkownika
    'START_SESSION', -- Rozpoczęcie sesji powtarzania
    'END_SESSION'    -- Zakończenie sesji powtarzania
);
```

### Tabele

**Tabela `flashcards`**

Przechowuje fiszki utworzone przez użytkowników.

```sql
CREATE TABLE public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    polish_word VARCHAR(100) NOT NULL,
    spanish_word VARCHAR(100) NOT NULL,
    example_sentence VARCHAR(300) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ograniczenie unikalności: użytkownik nie może mieć dwóch identycznych fiszek
    CONSTRAINT unique_flashcard_content_for_user UNIQUE (user_id, polish_word, spanish_word, example_sentence)
);

COMMENT ON TABLE public.flashcards IS 'Stores user-created flashcards with Polish word, Spanish word, and example sentence.';
COMMENT ON COLUMN public.flashcards.id IS 'Primary key for the flashcard.';
COMMENT ON COLUMN public.flashcards.user_id IS 'Foreign key referencing the user who owns the flashcard (from auth.users).';
COMMENT ON COLUMN public.flashcards.polish_word IS 'The word or phrase in Polish.';
COMMENT ON COLUMN public.flashcards.spanish_word IS 'The corresponding word or phrase in Spanish.';
COMMENT ON COLUMN public.flashcards.example_sentence IS 'An example sentence using the Spanish word/phrase.';
COMMENT ON COLUMN public.flashcards.created_at IS 'Timestamp when the flashcard was created.';

```

**Tabela `action_logs`**

Rejestruje kluczowe akcje wykonywane przez użytkowników w aplikacji.

```sql

CREATE TABLE public.action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type public.action_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    related_flashcard_id UUID NULL REFERENCES public.flashcards(id) ON DELETE SET NULL,
    input_text_length INTEGER NULL,
    cards_count INTEGER NULL -- Liczba kart (np. wygenerowanych w GENERATE, użytych w START_SESSION)
);

COMMENT ON TABLE public.action_logs IS 'Logs key user actions within the application for future analysis.';
COMMENT ON COLUMN public.action_logs.id IS 'Primary key for the log entry.';
COMMENT ON COLUMN public.action_logs.user_id IS 'Foreign key referencing the user who performed the action (from auth.users).';
COMMENT ON COLUMN public.action_logs.action_type IS 'The type of action performed (e.g., GENERATE, ADD, DELETE).';
COMMENT ON COLUMN public.action_logs.created_at IS 'Timestamp when the action occurred.';
COMMENT ON COLUMN public.action_logs.related_flashcard_id IS 'Optional foreign key linking the action to a specific flashcard (e.g., for ADD, DELETE actions). Set to NULL if the related flashcard is deleted.';
COMMENT ON COLUMN public.action_logs.input_text_length IS 'Length of the input text used in a GENERATE action.';
COMMENT ON COLUMN public.action_logs.cards_count IS 'Number of cards involved in the action (e.g., generated in GENERATE, included in START_SESSION).';

```

## 2. Relacje między tabelami

* **`auth.users` (1) <-> (N) `flashcards`**: Jeden użytkownik może mieć wiele fiszek. Fiszka należy tylko do jednego użytkownika. Relacja zaimplementowana przez klucz obcy `user_id` w tabeli `flashcards`. `ON DELETE CASCADE` zapewnia, że usunięcie użytkownika powoduje usunięcie wszystkich jego fiszek.
* **`auth.users` (1) <-> (N) `action_logs`**: Jeden użytkownik może wygenerować wiele wpisów w logu akcji. Wpis w logu dotyczy akcji jednego użytkownika. Relacja zaimplementowana przez klucz obcy `user_id` w tabeli `action_logs`. `ON DELETE CASCADE` zapewnia, że usunięcie użytkownika powoduje usunięcie wszystkich jego logów akcji.
* **`flashcards` (1) <-> (N) `action_logs` (opcjonalnie)**: Jedna fiszka może być powiązana z wieloma logami akcji (np. akcją `ADD` i późniejszą akcją `DELETE`). Log akcji (np. `ADD` lub `DELETE`) jest powiązany z co najwyżej jedną fiszką. Relacja zaimplementowana przez klucz obcy `related_flashcard_id` w tabeli `action_logs`. Relacja jest opcjonalna (`NULL` dozwolone), ponieważ nie wszystkie akcje (np. `GENERATE`, `START_SESSION`) odnoszą się bezpośrednio do konkretnej, istniejącej fiszki. `ON DELETE SET NULL` zapewnia, że usunięcie fiszki nie usuwa powiązanych logów, ale zeruje w nich referencję.

## 3. Indeksy

Oprócz indeksów automatycznie tworzonych dla kluczy głównych (`PRIMARY KEY`) i ograniczeń unikalności (`UNIQUE`), zaleca się utworzenie następujących indeksów w celu poprawy wydajności zapytań:

* **Na kluczach obcych:**
    * `CREATE INDEX idx_flashcards_user_id ON public.flashcards (user_id);`
    * `CREATE INDEX idx_action_logs_user_id ON public.action_logs (user_id);`
    * `CREATE INDEX idx_action_logs_related_flashcard_id ON public.action_logs (related_flashcard_id);`
* **Na kolumnach często używanych w warunkach `WHERE` lub `ORDER BY`:**
    * `CREATE INDEX idx_action_logs_created_at ON public.action_logs (created_at);` (Przydatny do sortowania lub filtrowania logów wg czasu - zaktualizowano nazwę kolumny)

## 4. Zasady PostgreSQL (Row-Level Security - RLS)

**Tabela `flashcards`**

RLS zostanie włączone dla tabeli `flashcards`, aby zapewnić, że użytkownicy mogą manipulować tylko swoimi własnymi fiszkami.

```sql
-- Włącz RLS dla tabeli flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Polityka pozwalająca użytkownikom na odczyt (SELECT) tylko własnych fiszek
CREATE POLICY "Allow authenticated users to SELECT their own flashcards"
ON public.flashcards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Polityka pozwalająca użytkownikom na wstawianie (INSERT) fiszek tylko dla siebie
CREATE POLICY "Allow authenticated users to INSERT flashcards for themselves"
ON public.flashcards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Polityka pozwalająca użytkownikom na usuwanie (DELETE) tylko własnych fiszek
CREATE POLICY "Allow authenticated users to DELETE their own flashcards"
ON public.flashcards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Tabela `action_logs`**

Zgodnie z decyzjami z sesji planowania, RLS *nie* zostanie włączone dla tabeli `action_logs` w ramach MVP. Dostęp do logów (jeśli będzie potrzebny w przyszłości) będzie kontrolowany na poziomie aplikacji/API lub przez dedykowane role z odpowiednimi uprawnieniami.

```sql
-- Upewnij się, że RLS jest wyłączone (domyślnie) lub wyłącz, jeśli było włączone
-- ALTER TABLE public.action_logs DISABLE ROW LEVEL SECURITY;
```

## 5. Dodatkowe uwagi i wyjaśnienia

* **Zarządzanie użytkownikami**: Schemat opiera się na systemie uwierzytelniania Supabase (`auth.users`). Nie ma potrzeby tworzenia osobnej tabeli użytkowników w schemacie `public`. Identyfikator użytkownika (`user_id`) typu `UUID` jest kluczem łączącym dane z użytkownikiem.
* **Typy danych**: Użyto `UUID` jako kluczy głównych zgodnie z praktykami Supabase. `VARCHAR` z określonymi limitami (`100`, `300`) zapewnia spójność danych i pewną optymalizację przechowywania. `TIMESTAMPTZ` jest używany dla znaczników czasu (`created_at`), przechowując informację o strefie czasowej, co jest najlepszą praktyką. `ENUM` (`action_enum`) zapewnia integralność i wydajność przechowywania typów akcji. Kolumny `generated_count`, `input_text_length`, `cards_count` są typu `INTEGER` i dopuszczają `NULL`, ponieważ są relevantne tylko dla określonych typów akcji.
* **Uprawnienia**: Rola `authenticated` (standardowa rola Supabase dla zalogowanych użytkowników) powinna otrzymać następujące uprawnienia:
    * `GRANT SELECT, INSERT, DELETE ON TABLE public.flashcards TO authenticated;`
    * `GRANT SELECT, INSERT ON TABLE public.action_logs TO authenticated;`
    * `GRANT USAGE ON TYPE public.action_enum TO authenticated;`
* **Kaskadowość operacji**: `ON DELETE CASCADE` dla `user_id` w obu tabelach zapewnia, że dane powiązane z użytkownikiem są usuwane wraz z nim. `ON DELETE SET NULL` dla `related_flashcard_id` w `action_logs` zachowuje historię akcji nawet po usunięciu fiszki, zerując jedynie powiązanie.
* **MVP**: Schemat jest zaprojektowany z myślą o wymaganiach MVP. Nie uwzględnia zaawansowanych funkcji, takich jak algorytmy powtórek (spaced repetition), współdzielenie fiszek czy zaawansowana analityka, które mogłyby wymagać dodatkowych tabel lub modyfikacji istniejących. Brak polityki retencji dla logów (`action_logs`).
```