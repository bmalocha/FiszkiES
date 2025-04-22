# Plan implementacji widoku GenerateFlashcardsView

## 1. Przegląd
Widok `GenerateFlashcardsView` jest głównym interfejsem dla użytkownika do generowania nowych fiszek na podstawie wklejonego tekstu. Umożliwia wprowadzenie tekstu w języku hiszpańskim, wysłanie go do przetworzenia przez API, a następnie przeglądanie wygenerowanych propozycji fiszek. Użytkownik może zaakceptować (dodać do swojej kolekcji) lub odrzucić każdą z propozycji.

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/generate`. Będzie renderowany wewnątrz głównego layoutu aplikacji (`MainLayout`), co oznacza, że powinien zawierać tylko elementy specyficzne dla tej strony, dziedzicząc nawigację i stopkę z layoutu nadrzędnego.

## 3. Struktura komponentów
Widok będzie wykorzystywał architekturę komponentową opartą o React (renderowany wewnątrz Astro Island). Podstawowa hierarchia wygląda następująco:


GenerateFlashcardsView (Astro Page / React Container)
│
├── TextInputForm (React Island/Component)
│ ├── Textarea (shadcn/ui Textarea + Label)
│ ├── CharacterCounter (span/p)
│ └── Button (shadcn/ui Button - "Generuj")
│
├── LoadingIndicator (React Component / shadcn/ui Spinner) [Warunkowo]
│
├── ErrorMessage (React Component / shadcn/ui Alert) [Warunkowo]
│
└── SuggestionsList (React Island/Component) [Warunkowo]
└── SuggestionItem (React Component) [Renderowany w pętli]
├── Text (Słowo PL)
├── Text (Słowo ES)
├── Text (Zdanie Przykładowe)
├── Button (shadcn/ui Button - "Dodaj")
└── Button (shadcn/ui Button - "Odrzuć")
## 4. Szczegóły komponentów

### `GenerateFlashcardsView` (Komponent Kontener / Strona Astro)
- **Opis komponentu:** Główny komponent strony `/generate`. Odpowiedzialny za orkiestrację przepływu danych, zarządzanie głównym stanem (ładowanie, błędy, lista sugestii) oraz komunikację z API za pomocą dedykowanego hooka (`useGenerateFlashcards`). Renderuje komponenty podrzędne (`TextInputForm`, `SuggestionsList`, `LoadingIndicator`, `ErrorMessage`).
- **Główne elementy:** Kontener `div` obejmujący inne komponenty.
- **Obsługiwane interakcje:** Pośrednio, przez komponenty potomne i hook.
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji.
- **Typy:** `SuggestionViewModel[]`, `boolean` (isLoading), `string | null` (error).
- **Propsy:** Brak (jest to komponent najwyższego poziomu dla tej strony).

### `TextInputForm` (React Island/Component)
- **Opis komponentu:** Formularz zawierający pole tekstowe do wklejania tekstu przez użytkownika, licznik znaków oraz przycisk do uruchomienia procesu generowania fiszek. Zarządza lokalnym stanem wprowadzanego tekstu.
- **Główne elementy:** `form`, `div` (wrapper dla textarea i licznika), `Label` (shadcn/ui), `Textarea` (shadcn/ui), `p` (licznik znaków), `Button` (shadcn/ui - type="submit").
- **Obsługiwane interakcje:**
   - `onChange` na `Textarea`: Aktualizuje stan tekstu i licznik znaków. Włącza/wyłącza przycisk "Generuj" na podstawie walidacji.
   - `onSubmit` na `form`: Wywołuje funkcję `generateSuggestions` przekazaną z hooka `useGenerateFlashcards`, przekazując aktualny tekst. Zapobiega domyślnej akcji formularza.
- **Obsługiwana walidacja:**
   - Długość tekstu: Musi być > 0 i <= 10 000 znaków. Textarea blokuje wpisywanie po przekroczeniu limitu.
   - Stan ładowania: Przycisk "Generuj" jest nieaktywny podczas procesu generowania (gdy `isLoading` jest `true`).
   - Komunikat walidacyjny wyświetlany, gdy osiągnięto limit 10 000 znaków.
- **Typy:** `string` (dla tekstu).
- **Propsy:**
   - `isGenerating: boolean` (informuje, czy trwa proces generowania).
   - `onSubmit: (text: string) => void` (funkcja wywoływana po zatwierdzeniu formularza).

### `CharacterCounter` (Element wewnątrz `TextInputForm`)
- **Opis komponentu:** Wyświetla bieżącą liczbę znaków w polu `Textarea` oraz limit (np. "150 / 10000"). Zmienia kolor (np. na czerwony), gdy limit zostanie przekroczony.
- **Główne elementy:** `p` lub `span`.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Wizualnie wskazuje przekroczenie limitu.
- **Typy:** `number` (current count), `number` (limit).
- **Propsy:** `currentLength: number`, `maxLength: number`.

### `SuggestionsList` (React Island/Component)
- **Opis komponentu:** Kontener wyświetlający listę wygenerowanych propozycji fiszek. Renderuje komponenty `SuggestionItem` dla każdej sugestii.
- **Główne elementy:** `div` lub `ul` (kontener listy), mapowanie tablicy `suggestions` na komponenty `SuggestionItem`. Może używać komponentu `Table` z shadcn/ui dla lepszej struktury.
- **Obsługiwane interakcje:** Pośrednio przez `SuggestionItem`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `SuggestionViewModel[]`.
- **Propsy:**
   - `suggestions: SuggestionViewModel[]` (tablica sugestii do wyświetlenia).
   - `onAccept: (suggestion: FlashcardSuggestion) => void` (przekazywana do `SuggestionItem`).
   - `onReject: (suggestionId: string) => void` (przekazywana do `SuggestionItem`).

### `SuggestionItem` (React Component)
- **Opis komponentu:** Reprezentuje pojedynczy wiersz lub kartę z propozycją fiszki. Wyświetla słowo polskie, hiszpańskie, zdanie przykładowe oraz przyciski "Dodaj" i "Odrzuć". Wizualnie odzwierciedla status przetwarzania (oczekujący, dodawany, dodany, odrzucony, błąd).
- **Główne elementy:** `div` lub `TableRow` (shadcn/ui Table), elementy tekstowe (`p`, `span`, `TableCell`), `Button` (shadcn/ui - "Dodaj"), `Button` (shadcn/ui - "Odrzuć", wariant `destructive` lub `outline`). Może zawierać mały wskaźnik ładowania/błędu per item.
- **Obsługiwane interakcje:**
   - `onClick` na przycisku "Dodaj": Wywołuje `props.onAccept` z danymi sugestii (`suggestion.suggestion`). Wyłącza przyciski na czas przetwarzania.
   - `onClick` na przycisku "Odrzuć": Wywołuje `props.onReject` z ID sugestii (`suggestion.suggestion.id`). Wyłącza przyciski.
- **Obsługiwana walidacja:** Przyciski "Dodaj" i "Odrzuć" są nieaktywne, jeśli status sugestii to `ADDING`, `ADDED`, `REJECTING`, `REJECTED` lub `ERROR` (chyba że błąd pozwala na ponowienie próby).
- **Typy:** `SuggestionViewModel`.
- **Propsy:**
   - `suggestion: SuggestionViewModel` (dane i status sugestii).
   - `onAccept: (suggestion: FlashcardSuggestion) => void`.
   - `onReject: (suggestionId: string) => void`.

### `LoadingIndicator` (React Component)
- **Opis komponentu:** Prosty komponent wyświetlający animację ładowania (np. spinner), używany podczas wywołań API (głównie generowania). Prawdopodobnie gotowy komponent z `shadcn/ui`.
- **Główne elementy:** Element SVG lub `div` ze stylami CSS/animacją.
- **Propsy:** Opcjonalnie `size`, `label` (dla dostępności).

### `ErrorMessage` (React Component)
- **Opis komponentu:** Wyświetla komunikaty o błędach (np. błąd API generowania). Może wykorzystywać komponent `Alert` z `shadcn/ui` z wariantem `destructive`.
- **Główne elementy:** `div` (kontener), ikona błędu, tekst błędu.
- **Propsy:** `message: string | null`.

## 5. Typy

```typescript
/** Struktura pojedynczej sugestii fiszki otrzymanej z API /api/generate */
interface FlashcardSuggestion {
 /** Tymczasowy ID generowany na froncie do śledzenia stanu w UI */
 id: string;
 polish_word: string;
 spanish_word: string;
 example_sentence: string;
}

/** Status przetwarzania pojedynczej sugestii w interfejsie użytkownika */
enum SuggestionStatus {
 PENDING = "pending", // Oczekuje na akcję użytkownika
 ADDING = "adding", // Proces dodawania do bazy w toku
 ADDED = "added", // Pomyślnie dodano do bazy
 REJECTING = "rejecting", // Proces odrzucania (zwykle natychmiastowy)
 REJECTED = "rejected", // Odrzucono przez użytkownika
 ERROR = "error", // Wystąpił błąd podczas dodawania
 ALREADY_EXISTS = "already_exists", // Fiszka już istnieje (odpowiedź 409)
}

/** ViewModel reprezentujący sugestię wraz z jej stanem w UI */
interface SuggestionViewModel {
 /** Oryginalne dane sugestii z API */
 suggestion: FlashcardSuggestion;
 /** Aktualny status przetwarzania tej sugestii */
 status: SuggestionStatus;
 /** Komunikat błędu specyficzny dla tej sugestii (jeśli status === ERROR) */
 errorMessage?: string | null;
}

// --- Typy API (dla przypomnienia, zdefiniowane globalnie) ---

/** Payload dla POST /api/generate */
interface GenerateSuggestionsCommand {
 text: string; // Max 10000 znaków
}

/** Odpowiedź z POST /api/generate */
interface GenerateSuggestionsResponseDto {
 suggestions: FlashcardSuggestion[];
}

/** Payload dla POST /api/flashcards (tworzenie nowej fiszki) */
interface CreateFlashcardCommand {
 polish_word: string; // Max 100 znaków
 spanish_word: string; // Max 100 znaków
 example_sentence: string; // Max 300 znaków
}

/** Odpowiedź z POST /api/flashcards */
interface CreateFlashcardResponseDto {
 id: string; // UUID fiszki w bazie
 polish_word: string;
 spanish_word: string;
 example_sentence: string;
 created_at: string; // timestamp
}

6. Zarządzanie stanem
Stan widoku będzie zarządzany głównie wewnątrz komponentu GenerateFlashcardsView przy użyciu hooków React (useState, useCallback) oraz dedykowanego customowego hooka useGenerateFlashcards.
Custom Hook: useGenerateFlashcards
* Cel: Zamknięcie logiki związanej z generowaniem sugestii, akceptacją/odrzucaniem fiszek, obsługą stanu ładowania, błędów oraz zarządzaniem listą SuggestionViewModel.
* Stan wewnętrzny:
   * suggestions: SuggestionViewModel[]
   * isLoading: boolean (dla operacji generowania)
   * error: string | null (dla błędów generowania lub innych globalnych błędów widoku)
* Zwracane wartości i funkcje:
   * suggestions: Aktualna lista sugestii z ich statusami.
   * isLoading: Flaga ładowania dla procesu generowania.
   * error: Komunikat o błędzie globalnym.
   * generateSuggestions(text: string): Promise<void>: Funkcja do wywołania generowania. Ustawia isLoading, wywołuje POST /api/generate, aktualizuje suggestions i error, resetuje isLoading.
   * acceptSuggestion(suggestionData: FlashcardSuggestion): Promise<void>: Funkcja do akceptacji sugestii. Znajduje sugestię w stanie po id, ustawia jej status na ADDING. Wywołuje POST /api/flashcards z danymi (polish_word, spanish_word, example_sentence). Po sukcesie (201) ustawia status na ADDED. Po błędzie (400, 500) ustawia status na ERROR i zapisuje errorMessage. Po konflikcie (409) ustawia status na ALREADY_EXISTS i zapisuje odpowiedni komunikat.
   * rejectSuggestion(suggestionId: string): void: Funkcja do odrzucenia sugestii. Znajduje sugestię po id i ustawia jej status na REJECTED. Jest to operacja czysto frontendowa.
   * resetView(): void: Funkcja do wyczyszczenia stanu (sugestii, błędów), przygotowująca widok do nowego cyklu generowania.
Komponent TextInputForm będzie zarządzał swoim lokalnym stanem dla pola tekstowego. Komponent SuggestionItem nie będzie posiadał własnego stanu, a jego wygląd i zachowanie będą w pełni zależne od propsa suggestion: SuggestionViewModel.
7. Integracja API
Widok będzie korzystał z dwóch endpointów API:
1. Generowanie Sugestii:
   * Endpoint: POST /api/generate
   * Trigger: Kliknięcie przycisku "Generuj" w TextInputForm.
   * Request Payload: GenerateSuggestionsCommand ({ text: string })
   * Response (Success - 200 OK): GenerateSuggestionsResponseDto ({ suggestions: FlashcardSuggestion[] })
   * Response (Error):
      * 400 Bad Request: Jeśli tekst jest pusty lub za długi (walidacja backendowa).
      * 401 Unauthorized: Jeśli użytkownik nie jest zalogowany.
      * 500 Internal Server Error: Błąd serwera lub AI.
   * Obsługa w hooku useGenerateFlashcards: Funkcja generateSuggestions.
2. Dodawanie Fiszki (Akceptacja Sugestii):
   * Endpoint: POST /api/flashcards
   * Trigger: Kliknięcie przycisku "Dodaj" w SuggestionItem.
   * Request Payload: CreateFlashcardCommand ({ polish_word: string, spanish_word: string, example_sentence: string } - dane pobrane z akceptowanej FlashcardSuggestion).
   * Response (Success - 201 Created): CreateFlashcardResponseDto (dane nowo utworzonej fiszki).
   * Response (Error):
      * 400 Bad Request: Błędy walidacji danych (np. puste pola, przekroczone limity znaków - mało prawdopodobne jeśli dane pochodzą z /api/generate).
      * 401 Unauthorized: Jeśli użytkownik nie jest zalogowany.
      * 409 Conflict: Fiszka o tej treści już istnieje dla tego użytkownika.
      * 500 Internal Server Error: Błąd serwera podczas zapisu.
   * Obsługa w hooku useGenerateFlashcards: Funkcja acceptSuggestion.
Do wywołań API zostanie użyta standardowa funkcja fetch lub biblioteka typu axios, opakowana w logikę hooka useGenerateFlashcards. Należy pamiętać o poprawnym ustawieniu nagłówków (Content-Type: application/json) oraz obsłudze autoryzacji (przekazanie tokena JWT, jeśli jest wymagany przez locals.supabase w backendzie).
8. Interakcje użytkownika
* Wpisywanie tekstu w Textarea: Pole tekstowe aktualizuje się na bieżąco. Licznik znaków (CharacterCounter) pokazuje aktualna_długość / 10000. Przycisk "Generuj" jest aktywny tylko, gdy 0 < długość <= 10000 i nie trwa ładowanie (isLoading === false).
* Kliknięcie "Generuj": Przycisk "Generuj" i pole Textarea stają się nieaktywne. Pojawia się LoadingIndicator. Po zakończeniu (sukces lub błąd): LoadingIndicator znika, przycisk i Textarea stają się ponownie aktywne (chyba że wystąpił błąd krytyczny). Jeśli sukces, pojawia się SuggestionsList z nowymi sugestiami. Jeśli błąd, pojawia się ErrorMessage.
* Kliknięcie "Dodaj" na sugestii: Przycisk "Dodaj" i "Odrzuć" na tym konkretnym SuggestionItem stają się nieaktywne. Może pojawić się mały wskaźnik ładowania obok przycisku. Po zakończeniu (sukces lub błąd):
   * Sukces (201): Przedmiot (SuggestionItem) zmienia wygląd, wskazując dodanie (np. zielone tło/ikona, etykieta "Dodano"). Przyciski pozostają nieaktywne.
   * Konflikt (409): Przedmiot zmienia wygląd, wskazując, że fiszka już istnieje (np. informacja tekstowa "Już posiadasz"). Przyciski pozostają nieaktywne.
   * Błąd (400, 500): Pojawia się komunikat błędu w obrębie SuggestionItem. Przyciski mogą stać się ponownie aktywne (szczególnie "Dodaj"), aby umożliwić ponowienie próby, lub pozostać nieaktywne, jeśli błąd jest trwały. Status sugestii zmieniany jest na ERROR.
* Kliknięcie "Odrzuć" na sugestii: Przycisk "Dodaj" i "Odrzuć" na tym SuggestionItem stają się nieaktywne. Przedmiot zmienia wygląd, wskazując odrzucenie (np. przekreślenie, szare tło). Jest to akcja czysto frontendowa. Status sugestii zmieniany jest na REJECTED.
* Przetworzenie wszystkich sugestii: Gdy wszystkie sugestie mają status ADDED, REJECTED, ALREADY_EXISTS lub ERROR, widok może zostać automatycznie wyczyszczony (pole tekstowe opróżnione, lista sugestii ukryta) przez wywołanie resetView() z hooka, przygotowując go do kolejnego użycia.
9. Warunki i walidacja
* Długość tekstu wejściowego:
   * Warunek: text.length > 0 && text.length <= 10000.
   * Komponent: TextInputForm.
   * Walidacja: Sprawdzane przy każdej zmianie w Textarea (onChange).
   * Efekt: Przycisk "Generuj" jest włączony/wyłączony. Jeśli text.length > 10000, wyświetlany jest komunikat walidacyjny (np. pod polem tekstowym, licznik znaków zmienia kolor na czerwony). Próba wysłania formularza z niepoprawną długością jest blokowana.
* Stan ładowania generowania:
   * Warunek: isLoading === true (zarządzane przez useGenerateFlashcards).
   * Komponent: TextInputForm, GenerateFlashcardsView.
   * Efekt: Przycisk "Generuj" i Textarea są nieaktywne. LoadingIndicator jest widoczny.
* Stan przetwarzania sugestii:
   * Warunek: suggestion.status jest ADDING, ADDED, REJECTING, REJECTED, ALREADY_EXISTS lub ERROR.
   * Komponent: SuggestionItem.
   * Walidacja: Sprawdzane przed renderowaniem przycisków i przy obsłudze kliknięć.
   * Efekt: Przyciski "Dodaj" i "Odrzuć" są nieaktywne. Wygląd elementu listy odzwierciedla status.
Walidacja po stronie klienta (długość tekstu) służy głównie poprawie UX. Kluczowa walidacja (długość, format, unikalność fiszki) odbywa się na backendzie (endpointy /api/generate i /api/flashcards używają Zod), a frontend musi być przygotowany na obsługę błędów 400 Bad Request i 409 Conflict.
10. Obsługa błędów
* Błąd walidacji długości tekstu (frontend): Komunikat pod Textarea, czerwony licznik znaków, nieaktywny przycisk "Generuj".
* Błąd API POST /api/generate:
   * 400 Bad Request: Wyświetlić ogólny błąd w ErrorMessage ("Nieprawidłowe dane wejściowe.") lub bardziej szczegółowy, jeśli API go dostarczy.
   * 401 Unauthorized: Przekierować na stronę logowania lub wyświetlić komunikat o konieczności zalogowania.
   * 500 Internal Server Error: Wyświetlić ogólny błąd w ErrorMessage ("Wystąpił błąd serwera podczas generowania fiszek. Spróbuj ponownie później.").
   * Błąd sieci: Wyświetlić ogólny błąd sieci w ErrorMessage ("Błąd połączenia. Sprawdź internet i spróbuj ponownie.").
* Błąd API POST /api/flashcards (na poziomie SuggestionItem):
   * 400 Bad Request: Wyświetlić błąd walidacji przy konkretnej sugestii (np. "Nieprawidłowe dane fiszki."). Ustawić status ERROR.
   * 401 Unauthorized: Mało prawdopodobne na tym etapie, ale obsłużyć jak wyżej (przekierowanie/komunikat).
   * 409 Conflict: Wyświetlić komunikat przy sugestii ("Ta fiszka już istnieje w Twojej kolekcji."). Ustawić status ALREADY_EXISTS. Przyciski dezaktywowane.
   * 500 Internal Server Error: Wyświetlić błąd przy sugestii ("Nie udało się dodać fiszki. Spróbuj ponownie."). Ustawić status ERROR. Umożliwić ponowienie próby (przyciski mogą pozostać aktywne lub pojawić się przycisk "Spróbuj ponownie").
   * Błąd sieci: Wyświetlić błąd sieci przy sugestii. Ustawić status ERROR. Umożliwić ponowienie próby.
Komponent ErrorMessage będzie służył do błędów globalnych (generowanie), a błędy związane z dodawaniem konkretnej fiszki będą wyświetlane w kontekście SuggestionItem. Warto rozważyć użycie komponentu Toast z shadcn/ui do krótkotrwałych powiadomień o sukcesie lub błędzie dodawania.
11. Kroki implementacji
1. Stworzenie pliku widoku: Utwórz plik strony Astro (np. src/pages/generate.astro).
2. Implementacja komponentu kontenera GenerateFlashcardsView: W pliku .astro lub osobnym pliku .tsx (jeśli używamy React wewnątrz Astro). Zintegruj go z MainLayout.
3. Implementacja custom hooka useGenerateFlashcards:
   * Zdefiniuj stany (suggestions, isLoading, error).
   * Zaimplementuj logikę dla generateSuggestions (wywołanie POST /api/generate, obsługa odpowiedzi i błędów, aktualizacja stanu).
   * Zaimplementuj logikę dla acceptSuggestion (wywołanie POST /api/flashcards, obsługa odpowiedzi 201, 409 i innych błędów, aktualizacja statusu SuggestionViewModel).
   * Zaimplementuj logikę dla rejectSuggestion (aktualizacja statusu SuggestionViewModel).
   * Zaimplementuj resetView.
4. Implementacja komponentu TextInputForm:
   * Użyj komponentów Label, Textarea, Button z shadcn/ui.
   * Dodaj logikę licznika znaków (CharacterCounter).
   * Zarządzaj stanem tekstu (useState).
   * Implementuj walidację długości i stanu ładowania (włączanie/wyłączanie przycisku).
   * Połącz onSubmit z funkcją generateSuggestions z hooka.
   * Użyj client:load lub client:idle dla interaktywności (Astro Island).
5. Implementacja komponentu SuggestionsList:
   * Przyjmij suggestions, onAccept, onReject jako propsy.
   * Renderuj listę (map) komponentów SuggestionItem.
   * Rozważ użycie Table z shadcn/ui dla struktury.
   * Użyj client:load lub client:idle.
6. Implementacja komponentu SuggestionItem:
   * Przyjmij suggestion (typu SuggestionViewModel), onAccept, onReject jako propsy.
   * Wyświetl dane fiszki.
   * Dodaj przyciski "Dodaj" i "Odrzuć" (Button z shadcn/ui).
   * Implementuj logikę włączania/wyłączania przycisków na podstawie suggestion.status.
   * Dodaj wizualne wskaźniki statusu (np. zmiana tła, ikony, tekst).
   * Obsłuż kliknięcia przycisków, wywołując onAccept lub onReject.
   * Wyświetl suggestion.errorMessage, jeśli istnieje.
7. Implementacja komponentów pomocniczych: LoadingIndicator i ErrorMessage (mogą to być proste wrappery na komponenty shadcn/ui).
8. Połączenie wszystkiego w GenerateFlashcardsView:
   * Użyj hooka useGenerateFlashcards.
   * Przekaż stan (isLoading, error, suggestions) i funkcje (generateSuggestions, acceptSuggestion, rejectSuggestion) do odpowiednich komponentów potomnych jako propsy.
   * Implementuj warunkowe renderowanie LoadingIndicator, ErrorMessage i SuggestionsList.
9. Styling: Zastosuj style Tailwind zgodnie z motywem aplikacji (kolory flagi Hiszpanii) i wykorzystaj predefiniowane style shadcn/ui.
10. Dostępność (A11y): Upewnij się, że wszystkie elementy interaktywne są dostępne z klawiatury, textarea ma etykietę, licznik jest powiązany przez aria-describedby, wskaźniki ładowania mają odpowiednie atrybuty ARIA (aria-busy), a komunikaty o błędach są ogłaszane przez czytniki ekran