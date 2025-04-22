**b. Kluczowe widoki, ekrany i przepływy użytkownika:**
*   **Logowanie/Rejestracja:** Standardowe formularze (email/hasło). Po pomyślnym logowaniu użytkownik trafia do głównego interfejsu. Błąd 401 z API przekierowuje do logowania.
*   **Widok Główny (po zalogowaniu):** Zawiera stały górny pasek nawigacyjny z linkami: "Generowanie", "Moje Fiszki", "Powtarzanie" oraz rozwijane menu użytkownika (email + przycisk Wyloguj).
*   **Generowanie Fiszek (`/generate`):** Widok z polem `textarea` (limit 10 000 znaków) i przyciskiem "Generuj". Wyniki (6-12 sugestii) wyświetlane są w tabeli (kolumny: PL, ES, Zdanie, Akcje). Przyciski "Dodaj" (wywołuje `POST /api/flashcards`, po sukcesie wiersz podświetla się na zielono) i "Odrzuć" (tylko akcja UI, po kliknięciu wiersz znika). Po przetworzeniu wszystkich sugestii widok jest czyszczony. Operacja generowania (`POST /api/generate`) sygnalizowana spinnerem.
*   **Moje Fiszki (`/my-flashcards`):** Wyświetla listę zapisanych fiszek użytkownika w tabeli (kolumny: PL, ES, Zdanie, Akcja). Dane ładowane są stronami (`GET /api/flashcards`) za pomocą przycisku "Załaduj więcej". W kolumnie Akcja dostępna jest opcja usunięcia (`DELETE /api/flashcards/{id}`) przy każdej fiszce, poprzedzona modalem potwierdzającym. Ładowanie i usuwanie sygnalizowane spinnerem. Dodanie nowej fiszki nie odświeża tej listy automatycznie.
*   **Sesja Powtarzania (`/repeat`):** Rozpoczyna się po kliknięciu linku/przycisku (wywołuje `POST /api/sessions/start`). Wyświetla fiszki (max 20) jedna po drugiej. Początkowo widoczne słowo PL, naciśnięcie spacji odkrywa tłumaczenie ES i zdanie. Ponowne naciśnięcie spacji przechodzi do kolejnej fiszki. Wyświetlany jest pasek postępu. Sesja kończy się automatycznie (wywołuje `POST /api/sessions/end`), ale dostępny jest też przycisk jawnego zakończenia. Rozpoczęcie sesji sygnalizowane spinnerem.
*   **Profil Użytkownika:** Dostępny z rozwijanego menu w top barze, pokazuje email użytkownika i przycisk wylogowania.

**c. Strategia integracji z API i zarządzania stanem:**
*   Komunikacja z backendem odbywa się przez zdefiniowane endpointy REST API.
*   Uwierzytelnianie oparte na JWT (Supabase Auth), token przesyłany w nagłówku `Authorization`.
*   Stan aplikacji (dane użytkownika, lista fiszek, stan sesji powtarzania) zarządzany po stronie klienta (np. React Context, Zustand).
*   Lista fiszek jest ładowana dynamicznie ("Załaduj więcej").
*   Obsługa błędów API: Modale dla błędów krytycznych/walidacyjnych/serwera (4xx, 5xx), przekierowanie do logowania dla 401, toasty dla sukcesów.
*   Stany ładowania sygnalizowane globalnymi spinnerami, które nie zasłaniają górnego paska nawigacyjnego.

**d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa:**
*   Interfejs musi być responsywny (RWD).
*   Należy zwrócić uwagę na dostępność (a11y): nawigacja klawiaturą (szczególnie spacja w powtarzaniu), semantyczny HTML, atrybuty ARIA (jeśli potrzebne).
*   **Konieczna weryfikacja kontrastu** dla wybranej kombinacji kolorów przycisków (czerwone tło, żółty tekst/ramka) zgodnie z WCAG.
*   Bezpieczeństwo na poziomie UI: obsługa wylogowania, przekierowanie przy błędzie 401.

**e. Strategia logowania akcji:**
*   Frontend nie implementuje bezpośrednio logowania, ale wywołuje odpowiednie endpointy API (`POST /api/flashcards`, `DELETE /api/flashcards/*`, `POST /api/generate`, `POST /api/sessions/start`, `POST /api/sessions/end`), które po stronie backendu zapisują logi akcji w bazie danych.
</ui_architecture_planning_summary>
