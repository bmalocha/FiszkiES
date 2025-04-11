# Dokument wymagań produktu (PRD) - Aplikacja do nauki języka hiszpańskiego

## 1. Przegląd produktu
Aplikacja ma na celu wspomóc Polaków w nauce języka hiszpańskiego poprzez automatyczne generowanie fiszek (flashcards) z dowolnego wklejonego tekstu. Wygenerowane fiszki zawierają podstawowe informacje (słowo po polsku, słowo po hiszpańsku, przykładowe zdanie) i mogą być zapisywane do bazy. Użytkownik ma możliwość przeglądania swoich fiszek, usuwania tych, których nie chce dłużej przechowywać, a także powtarzania ich w trybie interaktywnym. Aplikacja będzie dostępna jako aplikacja webowa i obejmuje podstawowy system rejestracji oraz logowania użytkowników.

## 2. Problem użytkownika
Wiele osób chce uczyć się języka hiszpańskiego, ale brakuje im skutecznego narzędzia do wyłuskiwania nowych słówek z interesującego ich kontekstu (artykuły, posty, inne teksty). Ręczne tworzenie fiszek bywa czasochłonne, a dostępne rozwiązania nie zawsze pozwalają na zautomatyzowane pozyskiwanie treści z wybranego fragmentu tekstu. Aplikacja adresuje ten problem, umożliwiając wklejenie dowolnego tekstu (do 10 000 znaków) i szybkie uzyskanie propozycji fiszek, które następnie można dodać do własnej bazy i powtarzać.

## 3. Wymagania funkcjonalne
1. Generowanie fiszek:
   - Użytkownik wkleja tekst (maksymalnie 10 000 znaków).
   - Aplikacja wykorzystuje moduł AI do wygenerowania od 6 do 12 propozycji fiszek na podstawie wklejonego tekstu.
   - System deduplikuje fiszki w obrębie jednej sesji generowania, aby nie proponować identycznych rekordów.
   - Użytkownik może zaakceptować (dodać do bazy) lub odrzucić każdą zaproponowaną fiszkę.
   - Każda zapisana fiszka zawiera: słowo po polsku, słowo po hiszpańsku oraz zdanie z przykładem użycia.

2. Przeglądanie fiszek:
   - Użytkownik ma wgląd w listę wszystkich zapisanych fiszek.
   - Fiszki nie są edytowalne po zapisaniu (możliwy jest tylko wgląd w ich treść).
   - Użytkownik może usuwać fiszki, potwierdzając każdorazowo akcję usunięcia.

3. Powtarzanie fiszek:
   - Użytkownik może rozpocząć sesję powtarzania, w której system losowo wybiera karty z bazy.
   - Każda karta wyświetla się w dwóch etapach: górna część (słowo po polsku) oraz dolna część (tłumaczenie + przykładowe zdanie). Ujawnienie dolnej części następuje po naciśnięciu spacji.
   - Sesja powtarzania ma limit 20 fiszek. Jeśli w bazie jest mniej kart, sesja kończy się wcześniej, a system informuje o tym użytkownika.
   - Postęp w trakcie sesji wizualizowany jest za pomocą paska postępu.

4. System kont użytkowników:
   - Możliwość rejestracji konta za pomocą adresu e-mail i hasła.
   - Możliwość logowania z wykorzystaniem zarejestrowanych danych.
   - Brak zaawansowanych mechanizmów bezpieczeństwa (np. resetowanie hasła czy wylogowywanie po czasie).

5. Interfejs użytkownika:
   - Całość interfejsu wykorzystuje motyw oparty na kolorach flagi Hiszpanii (odcienie czerwieni i żółci).
   - Przy usuwaniu fiszki wyświetlany jest komunikat potwierdzenia "Czy na pewno chcesz usunąć?".

6. Logowanie kluczowych akcji:
   - Generowanie, dodawanie i powtarzanie fiszek rejestrowane są w osobnej tabeli w bazie danych, co umożliwia w przyszłości analizę zachowań i aktywności użytkowników.

## 4. Granice produktu
1. Wersja MVP nie obejmuje:
   - Integracji z zaawansowanymi algorytmami powtórek (np. spaced repetition).
   - Współdzielenia zestawów fiszek między różnymi użytkownikami.
   - Zaawansowanej analityki zaangażowania czy skuteczności nauki.
   - Integracji z innymi platformami edukacyjnymi.
   - Importu plików w formatach PDF, DOCX czy innych.
   - Aplikacji mobilnych (produkt dostępny wyłącznie przez przeglądarkę).
2. Brak rozbudowanych mechanizmów bezpieczeństwa:
   - Brak wylogowywania po określonym czasie braku aktywności.
   - Brak weryfikacji adresu e-mail czy resetowania hasła.
3. Limity i prostota interakcji:
   - Generowany tekst ograniczony do 10 000 znaków.
   - Brak możliwości edycji fiszek po ich zaakceptowaniu i zapisaniu.
   - Maksymalnie 20 fiszek w jednej sesji powtarzania.

## 5. Historyjki użytkowników

### US-001
ID: US-001  
Tytuł: Rejestracja konta  
Opis: Jako nowy użytkownik, chcę móc utworzyć konto w aplikacji, aby zapisywać i przeglądać swoje fiszki.  
Kryteria akceptacji:
- Użytkownik podaje adres e-mail i hasło.
- System tworzy nowe konto i przechowuje dane w bazie.
- Brak mechanizmu weryfikacji e-mail ani resetowania hasła (z góry określone w granicach produktu).
- Po utworzeniu konta użytkownik może się zalogować tymi samymi danymi.

### US-002
ID: US-002  
Tytuł: Logowanie do aplikacji  
Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji, aby uzyskać dostęp do moich fiszek.  
Kryteria akceptacji:
- Użytkownik podaje poprawne dane logowania (e-mail i hasło).
- W przypadku poprawnych danych system kieruje do ekranu głównego aplikacji.
- W przypadku niepoprawnych danych wyświetlany jest komunikat o błędzie.
- System nie wylogowuje automatycznie po czasie nieaktywności.

### US-003
ID: US-003  
Tytuł: Wklejenie tekstu i wygenerowanie fiszek  
Opis: Jako zalogowany użytkownik, chcę wkleić dowolny tekst, aby aplikacja zaproponowała mi zestaw fiszek na jego podstawie.  
Kryteria akceptacji:
- Użytkownik może wkleić tekst o długości do 10 000 znaków.
- Po kliknięciu przycisku generowania system zwraca od 6 do 12 propozycji fiszek (słowo PL, słowo ES, przykładowe zdanie).
- Aplikacja sprawdza duplikaty w obrębie tej samej sesji i nie wyświetla powtarzających się fiszek.
- Akcja generowania zostaje zalogowana w tabeli logów.

### US-004
ID: US-004  
Tytuł: Akceptowanie i odrzucanie zaproponowanych fiszek  
Opis: Jako zalogowany użytkownik, po wygenerowaniu propozycji fiszek, chcę każdą z nich indywidualnie zaakceptować lub odrzucić, aby dodać do bazy tylko te, które mnie interesują.  
Kryteria akceptacji:
- Przy każdej wygenerowanej fiszce dostępne są dwa przyciski: Akceptuj (dodaje do bazy) i Odrzuć (pomija).
- Po zaakceptowaniu fiszka jest zapisana w bazie i przypisana do bieżącego użytkownika.
- Po odrzuceniu fiszka jest ignorowana i nie trafia do bazy.
- Akcja dodania fiszki zostaje zalogowana w tabeli logów.

### US-005
ID: US-005  
Tytuł: Przeglądanie zapisanych fiszek  
Opis: Jako zalogowany użytkownik, chcę mieć wgląd w listę wszystkich zaakceptowanych fiszek, aby szybko przeglądać posiadane słownictwo.  
Kryteria akceptacji:
- Widok listy fiszek jest dostępny po zalogowaniu.
- Każda fiszka prezentuje: słowo po polsku, słowo po hiszpańsku oraz przykładowe zdanie.
- Fiszki nie są edytowalne po dodaniu – brak możliwości zmiany treści.
- Widok listy nie wymaga paginacji na etapie MVP (brak ograniczenia liczby fiszek).

### US-006
ID: US-006  
Tytuł: Usuwanie fiszek  
Opis: Jako zalogowany użytkownik, chcę usuwać poszczególne fiszki, które nie są mi już potrzebne, aby utrzymać aktualną bazę słówek.  
Kryteria akceptacji:
- Przy każdej fiszce w widoku przeglądania widoczny jest przycisk usuń.
- Po kliknięciu przycisku usuń wyświetla się komunikat "Czy na pewno chcesz usunąć?".
- Potwierdzenie powoduje trwałe usunięcie fiszki z bazy.
- Akcja usunięcia nie jest możliwa do cofnięcia.
- Usunięcie fiszki jest odnotowane w tabeli logów.

### US-007
ID: US-007  
Tytuł: Rozpoczęcie i przeprowadzenie sesji powtarzania  
Opis: Jako zalogowany użytkownik, chcę powtarzać moje zapisane fiszki w trybie interaktywnym, aby lepiej utrwalić słownictwo.  
Kryteria akceptacji:
- Sesja powtarzania działa na losowych fiszkach z bazy użytkownika.
- Użytkownik widzi górną część (słowo po polsku), a po naciśnięciu spacji – dolną część (hiszpańskie tłumaczenie i przykładowe zdanie).
- Akcja rozpoczęcia sesji jest logowana.
- Wyświetlany jest pasek postępu informujący o liczbie wyświetlonych fiszek w stosunku do limitu (20).

### US-008
ID: US-008  
Tytuł: Zakończenie sesji powtarzania  
Opis: Jako zalogowany użytkownik, chcę otrzymać wyraźną informację o zakończeniu sesji, aby wiedzieć, że nie mam więcej fiszek do powtarzania.  
Kryteria akceptacji:
- Jeżeli w bazie dostępnych jest mniej niż 20 fiszek, sesja kończy się po ich wyczerpaniu.
- Po wykorzystaniu limitu 20 fiszek lub wyczerpaniu dostępnych kart system wyświetla komunikat o zakończeniu sesji.
- Koniec sesji jest logowany w tabeli logów.

### US-009
ID: US-009  
Tytuł: Logowanie kluczowych akcji w bazie danych  
Opis: Jako właściciel produktu, chcę mieć w bazie informacji logi z najważniejszych akcji, aby móc potencjalnie analizować zachowanie użytkowników w przyszłości.  
Kryteria akceptacji:
- Akcje generowania fiszek, akceptowania (dodawania do bazy), usuwania oraz rozpoczynania i kończenia sesji powtarzania są rejestrowane w osobnej tabeli w bazie.
- Każdy rekord logu zawiera co najmniej: typ akcji, identyfikator użytkownika, datę i godzinę zdarzenia.
- Wersja MVP nie obejmuje interfejsu do przeglądania logów.

## 6. Metryki sukcesu
1. Co najmniej 10% wygenerowanych propozycji fiszek jest akceptowanych przez użytkowników (podstawowy wskaźnik jakości generowanych treści).
