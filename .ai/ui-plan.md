# Architektura UI dla FishCards

## 1. Przegląd struktury UI

Interfejs użytkownika aplikacji FishCards został zaprojektowany jako nowoczesna aplikacja webowa (Single Page Application w ramach wysp Astro), zorientowana na maksymalną wydajność pracy z fiszkami. Architektura opiera się na podejściu "Desktop-first", optymalizując przestrzeń roboczą dla użytkowników PC, korzystających z dużych ilości tekstu i skrótów klawiszowych.

Kluczowym elementem jest podział na proces **Generowania** (asynchroniczny, nieblokujący), **Zarządzania** (biblioteka fiszek) oraz **Nauki** (tryb Zen z algorytmem powtórek).

## 2. Lista widoków

### Widok Logowania / Rejestracji

- **Ścieżka:** `/login` | `/register`
- **Główny cel:** Autentykacja użytkownika i dostęp do prywatnej bazy danych.
- **Kluczowe informacje:** Formularze e-mail/hasło, komunikaty o błędach walidacji.
- **Kluczowe komponenty:** `Card`, `Input`, `Button`, `Tabs` (do przełączania Login/Rejestracja).
- **UX, dostępność i bezpieczeństwo:** Walidacja pól w czasie rzeczywistym, obsługa błędów z Supabase Auth, ukrywanie haseł, Aria-labels dla pól formularza.

### Dashboard (Ekran Główny)

- **Ścieżka:** `/dashboard`
- **Główny cel:** Szybki przegląd postępów i przejście do najważniejszych akcji.
- **Kluczowe informacje:** Liczba fiszek do powtórki na dziś, ogólne statystyki (wskaźnik akceptacji AI, całkowita liczba fiszek).
- **Kluczowe komponenty:** `StatCard`, `QuickActionButtons` (Start Nauki, Nowy Generator).
- **UX, dostępność i bezpieczeństwo:** Priorytetyzacja najważniejszej akcji (Nauka) poprzez wizualne wyróżnienie (Primary Button).

### widok generowania fiszek

- **Ścieżka:** `/generator`
- **Główny cel:** umożliwia użytkownikowi generowanie propozycji fiszek poprzez AI i ich rewizję (zaakceptuj, edytuj lub odrzuć)
- **Kluczowe informacje:** Pole tekstowe (1k-10k znaków), licznik znaków, lista propozycji AI (Staging).przycisk akceptacji, edycji lub odrzucenia dla każdej fiszki
- **Kluczowe komponenty:** `Textarea`, `CharacterCounter`, `ProposalCard` (z opcją edycji in-place), `LoadingOverlay` (nieblokujący).
- **UX, dostępność i bezpieczeństwo:** Możliwość nawigacji po aplikacji podczas generowania (powiadomienie Toast po zakończeniu), walidacja długości tekstu blokująca przycisk "Generuj".

### Biblioteka (Moje Fiszki)

- **Ścieżka:** `/flashcards`
- **Główny cel:** Zarządzanie istniejącą bazą fiszek.
- **Kluczowe informacje:** Lista fiszek z podglądem przodu i tyłu, status (new, learning, review, mastered), źródło (AI, manual, mixed).
- **Kluczowe komponenty:** `DataTable`, `EditFlashcardModal`, `DeleteAlertDialog`, `SearchBar` (podstawowy).
- **UX, dostępność i bezpieczeństwo:** Wymuszenie potwierdzenia usunięcia przez `AlertDialog`. Responsywne tabele z paginacją.

### Sesja Nauki (Tryb Zen)

- **Ścieżka:** `/study`
- **Główny cel:** Skoncentrowana nauka z wykorzystaniem algorytmu powtórek.
- **Kluczowe informacje:** Przód/tył fiszki, system ocen 0-5, postęp sesji (pasek postępu).
- **Kluczowe komponenty:** `FlashcardFlip`, `RatingButtons` (0-5), `ProgressBar`, `ExitButton`.
- **UX, dostępność i bezpieczeństwo:** Obsługa klawiatury (Spacja do odwrócenia, 0-5 do oceny). Tryb pełnoekranowy/uproszczony (minimalizacja dystraktorów).

### Podsumowanie Sesji

- **Ścieżka:** `/study/summary`
- **Główny cel:** Prezentacja wyników zakończonej sesji nauki.
- **Kluczowe informacje:** Liczba przejrzanych fiszek, czas trwania, rozkład ocen.
- **Kluczowe komponenty:** `SummaryChart`, `DoneButton`.

### Profil Użytkownika / Ustawienia

- **Ścieżka:** `/profile`
- **Główny cel:** Zarządzanie kontem i danymi.
- **Kluczowe informacje:** dane urżytkownika, opcjie edycji profilu, o przycisk wylogowania
- **Kluczowe komponenty:** `UserProfileForm`, `DangerZone` (usuwanie konta).
- **UX, dostępność i bezpieczeństwo:** Podwójna weryfikacja przy usuwaniu konta, prosty i czytelny interfejs, bezpieczne wylogowanie

## 3. Mapa podróży użytkownika

1. **Start:** Użytkownik loguje się i ląduje na Dashboardzie.
2. **Generowanie:**
   - Przechodzi do Generatora.
   - Wkleja tekst (np. 5000 znaków).
   - Klika "Generuj". Podczas gdy AI pracuje, użytkownik przechodzi do Biblioteki, by przejrzeć stare fiszki.
   - Otrzymuje Toast: "Fiszki wygenerowane!".
   - Wraca do Generatora, edytuje propozycje, odrzuca i akceptuje resztę.
   - Klika "Zapisz", fiszki trafiają do bazy.
3. **Nauka:**
   - Klika "Rozpocznij Naukę" na Dashboardzie.
   - Wchodzi w Tryb Zen. Szybko ocenia fiszki używając klawiatury.
   - Po 20 fiszkach widzi podsumowanie i wraca do Dashboardu.
4. **Zarządzanie:**
   - Wchodzi w Bibliotekę, by ręcznie poprawić błąd w fiszce znaleziony podczas nauki (Modal edycji).

## 4. Układ i struktura nawigacji

- **Główny Layout:** Stały pasek boczny lub górny (NavigationMenu).
- **NavigationMenu (shadcn/ui):**
  - **Lewa/Góra:** `Nauka`, `Generator`, `Moje Fiszki`.
  - **Prawa:** `Profil` (Avatar z dropdownem: Ustawienia, Wyloguj).
- **Dynamiczne elementy:** Spinner/Wskaźnik postępu generowania AI widoczny w rogu nawigacji, jeśli proces trwa w tle.

## 5. Kluczowe komponenty

- **`NavigationMenu`:** Centralny punkt sterowania aplikacją.
- **`Flashcard`:** Reprezentacja wizualna fiszki (przód/tył) używana w Bibliotece i Sesji Nauki.
- **`StagingArea`:** Specjalistyczny widok w Generatorze do masowej edycji i zatwierdzania propozycji.
- **`RatingScale` (0-5):** Intuicyjny zestaw przycisków do oceny stopnia zapamiętania.
- **`StatusBadge`:** Kolorowe oznaczenie statusu fiszki (np. zielony dla 'mastered').
- **`Toast`:** System powiadomień o sukcesach (zapisanie fiszek) i błędach API.
