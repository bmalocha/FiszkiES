# Plan Testów Aplikacji FiszkiES

## 1. Zakres i cele

### 1.1. Zakres testów

Niniejszy plan obejmuje testowanie aplikacji webowej FiszkiES, której celem jest wspomaganie nauki języka hiszpańskiego dla polskich użytkowników. Testy obejmą następujące obszary funkcjonalne i niefunkcjonalne:

**W zakresie (In Scope):**

*   **Moduł Uwierzytelniania:** Rejestracja użytkownika, logowanie, wylogowywanie, ochrona ścieżek.
*   **Moduł Generowania Fiszek:** Wklejanie tekstu, interakcja z API generującym (w tym obsługa błędów), wyświetlanie sugestii, akceptacja i odrzucanie sugestii.
*   **Moduł Zarządzania Fiszkami ("Moje Fiszki"):** Wyświetlanie listy zapisanych fiszek, usuwanie fiszek (z potwierdzeniem), paginacja listy.
*   **Podstawowy Interfejs Użytkownika:** Nawigacja, layout, responsywność (desktop), podstawowa spójność wizualna (motyw Shadcn/ui).
*   **API Backendowe (Astro Endpoints):** Testowanie logiki biznesowej, walidacji, autoryzacji i integracji z bazą danych dla endpointów: `/api/auth/*`, `/api/generate`, `/api/flashcards`, `/api/flashcards/[flashcardId]`.
*   **Integracja z Usługami Zewnętrznymi:** Poprawność komunikacji i obsługi odpowiedzi/błędów z Supabase (Auth, DB) i OpenRouter.ai (dla generowania).
*   **Podstawowe Testy Niefunkcjonalne:** Wydajność (czas ładowania kluczowych widoków, czas odpowiedzi API), Bezpieczeństwo (podstawowe sprawdzenie autoryzacji, walidacji danych, skanowanie zależności), Użyteczność (zgodność z opisanymi przepływami).
*   **Logowanie Akcji:** Weryfikacja, czy kluczowe akcje (GENERATE, ADD, DELETE) są poprawnie rejestrowane w `action_logs`.

**Poza zakresem (Out of Scope) - w tej wersji planu:**

*   **Pełne testy funkcjonalne modułu "Powtarzanie":** Testowana będzie tylko strona zastępcza ("w budowie"). Pełne testy po implementacji.
*   **Zaawansowane testy jakości generowania AI:** Ocena merytoryczna trafności i poprawności językowej generowanych fiszek poza sprawdzeniem formatu odpowiedzi i podstawowej funkcjonalności.
*   **Testy edycji fiszek:** Funkcjonalność nieujęta w PRD.
*   **Zaawansowane testy bezpieczeństwa:** Pełne testy penetracyjne, audyty bezpieczeństwa.
*   **Testy obciążeniowe/stress testy:** Poza podstawowymi testami wydajności API.
*   **Testy kompatybilności:** Na szerokiej gamie urządzeń mobilnych i starszych przeglądarek (skupiamy się na nowoczesnych desktopowych).
*   **Testowanie panelu administracyjnego/przeglądania logów:** Brak takiego interfejsu w MVP.
*   **Testowanie mechanizmów odzyskiwania hasła/weryfikacji email:** Brak w MVP.

### 1.2. Cele testów

*   **Weryfikacja funkcjonalna:** Potwierdzenie, że wszystkie funkcje aplikacji działają zgodnie z wymaganiami PRD (US-001 do US-009).
*   **Wykrywanie defektów:** Identyfikacja i raportowanie błędów w oprogramowaniu.
*   **Ocena jakości:** Dostarczenie informacji o poziomie jakości aplikacji, w tym stabilności, wydajności i bezpieczeństwie.
*   **Zapewnienie spójności:** Sprawdzenie, czy interfejs użytkownika jest spójny i zgodny z wytycznymi projektowymi (Shadcn/ui, motyw kolorystyczny).
*   **Weryfikacja integracji:** Potwierdzenie poprawnej współpracy między komponentami frontendowymi, backendowymi (API), bazą danych i usługami zewnętrznymi.
*   **Redukcja ryzyka:** Zmniejszenie prawdopodobieństwa wystąpienia krytycznych błędów na środowisku produkcyjnym.
*   **Wsparcie procesu wydawniczego:** Dostarczenie pewności niezbędnej do wdrożenia aplikacji.

## 2. Założenia i ryzyka

### 2.1. Założenia

*   Wymagania funkcjonalne i niefunkcjonalne opisane w PRD i innych dostarczonych dokumentach (`.ai/*.md`) są kompletne i aktualne.
*   Dostępne będzie stabilne środowisko testowe (Staging) odzwierciedlające konfigurację produkcyjną, w tym dostęp do Supabase i OpenRouter.
*   Dostępne będą konta testowe w Supabase i klucze API dla OpenRouter na potrzeby testów.
*   Zespół deweloperski będzie dostarczał buildy na środowisko testowe w sposób regularny.
*   Istnieje dostęp do repozytorium kodu i narzędzi deweloperskich (np. Supabase Studio).
*   Podstawowa konfiguracja CI/CD (linting, formatowanie, pre-commit hooks) działa poprawnie.
*   Zależności zewnętrzne (Supabase, OpenRouter) są generalnie stabilne i dostępne podczas testów (z uwzględnieniem potencjalnych problemów w sekcji Ryzyka).

### 2.2. Ryzyka

| Ryzyko                                      | Prawdopodobieństwo | Wpływ   | Strategia mitygacji                                                                                                                               |
| :------------------------------------------ | :----------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Niestabilność/Błędy OpenRouter API**        | Średnie            | Wysoki  | Testy integracyjne z mockowaniem OpenRouter, testy E2E z obsługą błędów API, fallback do danych mockowych (zgodnie z implementacją), monitoring. |
| **Zmienność jakości generowania AI**        | Wysokie            | Średni  | Testy skupione na formacie odpowiedzi i integracji, monitorowanie metryki akceptacji fiszek (>10%), manualna weryfikacja próbek.               |
| **Problemy z wydajnością generowania**      | Średnie            | Średni  | Podstawowe testy wydajności API `/api/generate`, monitorowanie czasu odpowiedzi na Staging/Prod.                                                 |
| **Niedostępność/Problemy Supabase**         | Niskie             | Wysoki  | Testy integracyjne z mockowaniem Supabase, testy E2E z obsługą błędów DB/Auth, monitoring usług Supabase.                                         |
| **Błędy w logice autoryzacji/RLS**          | Niskie             | Wysoki  | Testy integracyjne API sprawdzające dostęp do zasobów, testy E2E z różnymi użytkownikami (jeśli możliwe), przegląd polityk RLS, testy bezpieczeństwa. |
| **Błędy w obsłudze stanu frontendowego**    | Średnie            | Średni  | Testy komponentów React (RTL), testy E2E sprawdzające spójność UI po różnych akcjach (dodawanie, usuwanie, ładowanie).                             |
| **Problemy z wydajnością frontendu**        | Niskie             | Niski   | Analiza Lighthouse, profilowanie w DevTools dla kluczowych widoków.                                                                               |
| **Niespójności UI / błędy w responsywności** | Średnie            | Niski   | Testy E2E na różnych rozdzielczościach desktopowych, testy eksploracyjne UI.                                                                      |
| **Regresje w trakcie rozwoju**             | Wysokie            | Wysoki  | Regularne uruchamianie zestawu testów regresji (Unit, Integration, E2E) w CI/CD, code review.                                                   |
| **Luki bezpieczeństwa**                      | Średnie            | Wysoki  | Testy bezpieczeństwa (manualne i automatyczne), skanowanie zależności, przeglądy kodu pod kątem bezpieczeństwa.                                  |
| **Niejasne lub zmieniające się wymagania**   | Niskie             | Średni  | Regularna komunikacja z Product Ownerem, aktualizacja planu testów i przypadków testowych w razie zmian.                                         |
| **Ograniczone zasoby/czas na testy**        | Średnie            | Średni  | Priorytetyzacja testów (risk-based testing), automatyzacja krytycznych przepływów, jasne kryteria akceptacji.                                     |

## 3. Strategia testów

Strategia opiera się na piramidzie testów, z naciskiem na testy jednostkowe i integracyjne wspierane przez testy E2E dla kluczowych przepływów użytkownika oraz dedykowane testy niefunkcjonalne.

### 3.1. Testy Jednostkowe (Unit Tests)

*   **Cel:** Weryfikacja poprawności logiki poszczególnych, izolowanych jednostek kodu (funkcje, hooki React, komponenty UI bez złożonych interakcji, funkcje serwisów).
*   **Techniki:** Testowanie oparte na danych wejściowych i oczekiwanych wynikach, testowanie warunków brzegowych, mockowanie zależności zewnętrznych (innych modułów, API).
*   **Narzędzia:** **Vitest** (preferowany ze względu na szybkość i kompatybilność z Vite/Astro), React Testing Library (dla komponentów).
*   **Kryteria Wejścia:** Kod jednostki jest gotowy i zaimplementowany.
*   **Kryteria Wyjścia:** Wszystkie zdefiniowane przypadki testowe dla jednostki przechodzą pomyślnie. Osiągnięcie docelowego pokrycia kodu (np. >70%).
*   **Priorytet:** Wysoki.

### 3.2. Testy Integracyjne (Integration Tests)

*   **Cel:** Weryfikacja poprawnej współpracy pomiędzy różnymi modułami/komponentami systemu. Przykłady:
    *   API Endpoint ↔ Service ↔ Baza Danych (Supabase)
    *   Frontend Component (React) ↔ Custom Hook ↔ API Endpoint Call (mockowany lub na żywo w środowisku testowym)
    *   Middleware ↔ Request/Response Flow
    *   Service ↔ External API (OpenRouter - mockowany lub na żywo)
*   **Techniki:** Testowanie interfejsów API (np. przy użyciu Supertest lub bezpośrednio `fetch` w testach Vitest), testowanie komponentów React z mockowanymi wywołaniami API (RTL), testowanie z wykorzystaniem instancji Supabase (lokalnej lub dedykowanej testowej).
*   **Narzędzia:** **Vitest**, Supertest, React Testing Library, mock-service-worker (msw) lub inne biblioteki do mockowania API.
*   **Kryteria Wejścia:** Moduły przeznaczone do integracji są zaimplementowane i przeszły testy jednostkowe. Środowisko testowe (lub mocki) jest dostępne.
*   **Kryteria Wyjścia:** Wszystkie zdefiniowane scenariusze integracyjne przechodzą pomyślnie. Osiągnięcie docelowego pokrycia kodu/przepływów (np. >60%).
*   **Priorytet:** Wysoki.

### 3.3. Testy End-to-End (E2E Tests)

*   **Cel:** Weryfikacja kompletnych przepływów użytkownika z perspektywy interfejsu graficznego, symulując rzeczywiste interakcje.
*   **Techniki:** Automatyzacja interakcji przeglądarki, testowanie scenariuszy opartych na historyjkach użytkowników (User Stories). Kluczowe przepływy:
    1.  Rejestracja -> Logowanie -> Wylogowanie.
    2.  Logowanie -> Generowanie fiszek -> Akceptacja/Odrzucenie -> Weryfikacja w "Moje Fiszki".
    3.  Logowanie -> Przeglądanie "Moje Fiszki" -> Usuwanie fiszki (z potwierdzeniem) -> Weryfikacja usunięcia.
    4.  Logowanie -> Przejście do "Powtarzanie" (weryfikacja strony "w budowie").
*   **Narzędzia:** **Playwright**.
*   **Kryteria Wejścia:** Aplikacja jest wdrożona na stabilnym środowisku testowym (Staging). Kluczowe funkcjonalności są zaimplementowane.
*   **Kryteria Wyjścia:** Wszystkie zdefiniowane krytyczne scenariusze E2E przechodzą pomyślnie.
*   **Priorytet:** Średnio-Wysoki (skupienie na krytycznych ścieżkach).

### 3.4. Testy Wydajnościowe (Performance Tests)

*   **Cel:** Ocena responsywności aplikacji i czasu odpowiedzi kluczowych operacji. Identyfikacja potencjalnych wąskich gardeł.
*   **Techniki:**
    *   **Frontend:** Analiza czasu ładowania stron (LCP, FCP, TTI) za pomocą Google Lighthouse i narzędzi deweloperskich przeglądarki dla kluczowych widoków (Login, Generate, MyFlashcards).
    *   **Backend API:** Podstawowe testy obciążeniowe (np. 10-20 użytkowników wirtualnych) dla kluczowych endpointów (`/api/flashcards`, `/api/generate`, `/api/auth/login`) w celu zmierzenia czasu odpowiedzi pod umiarkowanym obciążeniem.
*   **Narzędzia:** Google Lighthouse, Chrome DevTools (zakładka Performance, Network), k6 lub Artillery (dla API).
*   **Kryteria Wejścia:** Aplikacja wdrożona na środowisku testowym zbliżonym do produkcyjnego.
*   **Kryteria Wyjścia:** Czasy ładowania i odpowiedzi mieszczą się w akceptowalnych (choć nieformalnie zdefiniowanych) ramach. Brak znaczących regresji wydajnościowych w kolejnych cyklach testowych.
*   **Priorytet:** Średni.

### 3.5. Testy Bezpieczeństwa (Security Tests)

*   **Cel:** Identyfikacja podstawowych luk bezpieczeństwa w aplikacji.
*   **Techniki:**
    *   **Kontrola dostępu:** Manualne próby dostępu do chronionych ścieżek i endpointów API bez uwierzytelnienia lub jako inny użytkownik. Weryfikacja działania RLS (np. przez zapytania SQL w Supabase Studio jako różni użytkownicy testowi).
    *   **Walidacja danych wejściowych:** Manualne próby wstrzyknięcia nieprawidłowych danych (np. długie ciągi, podstawowe skrypty XSS) w polach formularzy (Login, Register, Textarea generowania). Weryfikacja walidacji Zod na backendzie.
    *   **Skanowanie zależności:** Użycie narzędzi typu `npm audit` lub Snyk/Dependabot do wykrywania znanych podatności w bibliotekach.
    *   **Konfiguracja:** Sprawdzenie podstawowych nagłówków bezpieczeństwa HTTP, konfiguracji cookies (HttpOnly, Secure, SameSite).
*   **Narzędzia:** Narzędzia deweloperskie przeglądarki, `npm audit`, Snyk/Dependabot (jeśli skonfigurowane), OWASP ZAP (dla podstawowych automatycznych skanów, jeśli dostępne zasoby).
*   **Kryteria Wejścia:** Aplikacja wdrożona na środowisku testowym.
*   **Kryteria Wyjścia:** Brak zidentyfikowanych krytycznych lub wysokich luk bezpieczeństwa. Wszystkie zależności są aktualne lub mają znane i zaakceptowane ryzyka.
*   **Priorytet:** Wysoki.

### 3.6. Testy Regresji (Regression Tests)

*   **Cel:** Zapewnienie, że nowe zmiany (nowe funkcje, poprawki błędów) nie wprowadziły błędów w istniejących, wcześniej działających częściach aplikacji.
*   **Techniki:** Ponowne wykonanie podzbioru testów z poprzednich poziomów (Unit, Integration, E2E) obejmujących kluczowe funkcjonalności i obszary dotknięte zmianami. Testy eksploracyjne wokół zmodyfikowanych obszarów.
*   **Narzędzia:** Zautomatyzowane zestawy testów (**Vitest**, **Playwright**) uruchamiane w ramach CI/CD, manualne testy eksploracyjne.
*   **Kryteria Wejścia:** Nowy build aplikacji jest gotowy do testowania po wprowadzeniu zmian.
*   **Kryteria Wyjścia:** Wszystkie testy w zestawie regresji przechodzą pomyślnie. Nie zidentyfikowano nowych, nieoczekiwanych błędów w istniejących funkcjach.
*   **Priorytet:** Wysoki (wykonywane często, przed każdym wydaniem).

## 4. Macierz moduł × typ testu

| Moduł / Funkcjonalność          | Testy Jednostkowe | Testy Integracyjne | Testy E2E | Testy Wydajnościowe | Testy Bezpieczeństwa | Testy Regresji |
| :------------------------------ | :---------------- | :----------------- | :-------- | :------------------ | :------------------- | :------------- |
| **Uwierzytelnianie (Frontend)** | Komponenty (M)    | Hook + API (H)     | Login/Reg (H) | Niskie              | Kontrola dostępu (M) | Wysokie        |
| **Uwierzytelnianie (API)**      | Servisy (M)       | API + Supabase (H) | -         | Średnie             | Kontrola API (H)     | Wysokie        |
| **Generowanie (Frontend)**      | Komponenty (H)    | Hook + API (H)     | Generowanie (H) | Niskie              | Walidacja input (M)  | Wysokie        |
| **Generowanie (API)**           | Servisy (H)       | API + OpenRouter(H)| -         | Średnie (API Gen)   | Walidacja Zod (H)    | Wysokie        |
| **Zarządzanie Fiszkami (FE)**   | Komponenty (H)    | Hook + API (H)     | CRUD (H)  | Niskie              | -                    | Wysokie        |
| **Zarządzanie Fiszkami (API)**  | Servisy (H)       | API + Supabase (H) | -         | Średnie (API CRUD)  | Autoryzacja (H)      | Wysokie        |
| **Widok Powtarzania (FE)**      | Placeholder (L)   | Placeholder (L)    | Placeholder (L) | N/A                 | N/A                  | Niskie         |
| **API Powtarzania**             | -                 | -                  | -         | N/A                 | N/A                  | Niskie         |
| **Middleware**                  | -                 | Middleware (H)     | -         | Niskie              | Kontrola dostępu (M) | Średnie        |
| **UI (Layout, Style)**          | Komponenty (L)    | -                  | Podstawowe (M) | Średnie (Lighthouse)| Niskie               | Średnie        |
| **Logowanie Akcji (Service)**   | Service (H)       | API + Log (M)      | -         | Niskie              | -                    | Średnie        |
| **Zależności Zewnętrzne**        | -                 | Mockowanie (H)     | Obsługa błędów(M)| -                   | Skanowanie (H)       | Wysokie        |

*Legenda: H - Wysoki priorytet/pokrycie, M - Średni, L - Niski, N/A - Nie dotyczy*

## 5. Środowiska i narzędzia

### 5.1. Środowiska testowe

*   **Lokalne (Development):** Używane przez deweloperów do uruchamiania testów jednostkowych i integracyjnych podczas kodowania. Wykorzystuje Supabase CLI do lokalnej instancji bazy danych. Może wymagać mockowania OpenRouter.
*   **CI (Continuous Integration):** Środowisko (np. GitHub Actions runner) do automatycznego uruchamiania testów (Unit, Integration, Linting, Formatting) przy każdym pushu/pull requeście. Może używać usług kontenerowych dla bazy danych lub mocków.
*   **Staging/Test:** Dedykowane środowisko wdrożeniowe, możliwie najbardziej zbliżone do produkcji. Używane do testów E2E, wydajnościowych, bezpieczeństwa i UAT. Powinno być zintegrowane z rzeczywistymi (lub testowymi wersjami) usług Supabase i OpenRouter.
*   **Produkcja (Production):** Środowisko live. Testy ograniczone do smoke testów po wdrożeniu i monitoringu.

### 5.2. Narzędzia testowe

*   **Test Runner / Framework:** **Vitest**
*   **Testowanie Komponentów React:** React Testing Library (RTL)
*   **Testowanie API:** Supertest (dla Node.js/Astro endpoints), `fetch` API w testach
*   **Testy E2E:** **Playwright**
*   **Testy Wydajności:** Google Lighthouse, k6 / Artillery
*   **Testy Bezpieczeństwa:** `npm audit`, Snyk/Dependabot (jeśli skonfigurowane), OWASP ZAP (opcjonalnie)
*   **Mockowanie:** Vitest mocks, `msw` (mock-service-worker), Sinon.JS (opcjonalnie)
*   **Kontrola wersji:** Git, GitHub
*   **CI/CD:** GitHub Actions
*   **Konteneryzacja:** Docker (do uruchamiania aplikacji i ew. usług w CI/Staging)
*   **Baza Danych (Lokalnie/Testy):** Supabase CLI, Docker (PostgreSQL)
*   **Zarządzanie Zadaniami / Defektami:** Narzędzie typu Jira, Trello, GitHub Issues (wymaga ustalenia).
*   **Walidacja Danych:** Zod

### 5.3. Dane testowe

*   Konieczne będzie przygotowanie zestawów danych testowych, w tym:
    *   Konta użytkowników testowych (różne role, jeśli dotyczy w przyszłości).
    *   Zestawy fiszek (małe i potencjalnie większe do testów paginacji).
    *   Przykładowe teksty do generowania (krótkie, długie, o różnej tematyce).
    *   Dane do testów negatywnych (nieprawidłowe formaty, przekroczone limity).
*   Należy rozważyć mechanizmy czyszczenia i resetowania danych testowych w środowisku Staging.

## 6. Role i odpowiedzialności

*   **Inżynier QA / Zespół QA:**
    *   Tworzenie i utrzymanie planu testów, przypadków testowych (manualnych i automatycznych).
    *   Projektowanie i implementacja testów automatycznych (Integration, E2E, Performance, Security).
    *   Wykonywanie testów manualnych (eksploracyjne, UAT, weryfikacja błędów).
    *   Raportowanie i śledzenie defektów.
    *   Analiza wyników testów i raportowanie stanu jakości.
    *   Współpraca z deweloperami i Product Ownerem.
    *   Utrzymanie środowisk testowych (we współpracy z DevOps).
*   **Deweloperzy:**
    *   Implementacja testów jednostkowych.
    *   Uczestnictwo w testach integracyjnych.
    *   Poprawianie zgłoszonych defektów.
    *   Code review (w tym przegląd testów).
    *   Zapewnienie testowalności kodu.
    *   Wsparcie w diagnozowaniu problemów znalezionych przez QA.
*   **DevOps / Inżynier Platformy:**
    *   Konfiguracja i utrzymanie potoków CI/CD.
    *   Zarządzanie środowiskami testowymi i produkcyjnymi.
    *   Monitoring aplikacji na produkcji.
    *   Zarządzanie infrastrukturą (DigitalOcean, Supabase).
*   **Product Owner / Manager:**
    *   Dostarczanie i klaryfikacja wymagań (PRD, User Stories).
    *   Priorytetyzacja funkcjonalności i defektów.
    *   Uczestnictwo w User Acceptance Testing (UAT).
    *   Definiowanie kryteriów akceptacji.

## 7. Harmonogram

Harmonogram testów powinien być zintegrowany z cyklem rozwoju aplikacji (np. sprintami w Agile).

*   **Faza Inicjalna (Sprint 0/1):**
    *   Setup narzędzi testowych i środowisk.
    *   Opracowanie i przegląd planu testów.
    *   Rozpoczęcie pisania testów jednostkowych i integracyjnych dla podstawowej architektury i modułu Auth.
    *   Konfiguracja CI dla podstawowych testów.
*   **Cykle Rozwojowe (Sprinty):**
    *   **W każdym Sprincie:**
        *   Testowanie nowych funkcjonalności (Unit, Integration, E2E dla gotowych User Stories).
        *   Testy eksploracyjne nowych funkcji.
        *   Rozwój i utrzymanie automatyzacji testów.
        *   Wykonywanie testów regresji (automatycznych w CI, manualnych w razie potrzeby).
        *   Raportowanie i weryfikacja poprawek błędów.
    *   **Kluczowe Kamienie Milowe (Przykładowe):**
        *   Zakończenie testów modułu Auth.
        *   Zakończenie testów modułu Generowania (w tym integracja z AI).
        *   Zakończenie testów modułu "Moje Fiszki" (CRUD, paginacja).
        *   Gotowość do testów UAT.
*   **Faza Stabilizacji / Przed Wydaniem:**
    *   Pełny cykl testów regresji (automatycznych i manualnych).
    *   Testy wydajnościowe i bezpieczeństwa na środowisku Staging.
    *   User Acceptance Testing (UAT) z Product Ownerem.
    *   Finalna weryfikacja poprawek krytycznych błędów.
*   **Po Wdrożeniu:**
    *   Smoke testy na środowisku produkcyjnym.
    *   Monitoring aplikacji.

**Cykl regresji:** Zautomatyzowany zestaw testów regresji (krytyczne ścieżki Unit, Integration, E2E) powinien być uruchamiany co najmniej raz dziennie w CI oraz przed każdym wdrożeniem na Staging/Produkcję. Pełny cykl regresji (w tym manualny) przed dużymi wydaniami.

## 8. Metryki sukcesu

Jakość procesu testowego i produktu będzie mierzona za pomocą następujących metryk:

*   **Pokrycie kodu testami:**
    *   Testy jednostkowe: > 70% (docelowo).
    *   Testy integracyjne: > 60% (docelowo, mierzone pokryciem kodu lub przepływów).
*   **Gęstość defektów:** Liczba znalezionych defektów (zwłaszcza krytycznych/wysokich) na jednostkę funkcjonalności lub w cyklu czasowym. Cel: malejący trend w miarę dojrzewania produktu.
*   **Odsetek przepuszczonych defektów:** Liczba defektów znalezionych na produkcji w stosunku do liczby defektów znalezionych w fazie testów. Cel: < 10% dla krytycznych/wysokich.
*   **Wskaźnik zdawalności testów automatycznych:** % testów przechodzących w CI/CD. Cel: > 95% (dopuszczalne sporadyczne niestabilności).
*   **Średni czas naprawy (Mean Time To Repair - MTTR):** Czas od zgłoszenia krytycznego/wysokiego defektu do jego naprawy i weryfikacji. Cel: < 1-2 dni robocze.
*   **Metryki z PRD:**
    *   Co najmniej 10% wygenerowanych propozycji fiszek jest akceptowanych przez użytkowników (jako wskaźnik jakości generowania i użyteczności).
*   **Wydajność (Przykładowe cele):**
    *   LCP dla kluczowych widoków < 2.5s.
    *   Czas odpowiedzi API (P95) < 1s (dla CRUD), < 5s (dla generowania - zależne od AI).
*   **Bezpieczeństwo:** Brak otwartych krytycznych/wysokich luk bezpieczeństwa w raporcie końcowym przed wydaniem.

## 9. Załączniki

*   **Repozytorium Kodu:** [https://github.com/bmalocha/FiszkiES](https://github.com/bmalocha/FiszkiES) (Założenie na podstawie struktury wejściowej)
*   **Diagramy Architektury:**
    *   `.ai/diagrams/auth.md`
    *   `.ai/diagrams/ui-components.md`
*   **Dokument Wymagań Produktu (PRD):** `.ai/prd.md`
*   **Plan API:** `.ai/api-plan.md`
*   **Plan Bazy Danych:** `.ai/db-plan.md`
*   **Plany Implementacji UI:**
    *   `.ai/ui-plan.md`
    *   `.ai/generate-ui-implementation-plan.md`
    *   `.ai/my-flashcards-implementation-plan.md`
*   **Backlog Testów / Narzędzie do Zarządzania Testami:** [Link do narzędzia - np. Jira, TestRail, GitHub Issues] (Wymaga uzupełnienia)
*   **Dokumentacja Technologii:**
    *   Astro: [https://docs.astro.build/](https://docs.astro.build/)
    *   React: [https://react.dev/](https://react.dev/)
    *   Supabase: [https://supabase.com/docs](https://supabase.com/docs)
    *   OpenRouter: [https://openrouter.ai/docs](https://openrouter.ai/docs)
    *   Shadcn/ui: [https://ui.shadcn.com/](https://ui.shadcn.com/)
    *   **Vitest:** [https://vitest.dev/](https://vitest.dev/)
    *   **Playwright:** [https://playwright.dev/](https://playwright.dev/)