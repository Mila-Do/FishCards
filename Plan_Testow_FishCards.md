# Plan Testów - FishCards
## Aplikacja do Inteligentnego Tworzenia Fiszek z AI

**Wersja:** 1.0  
**Data:** 6 stycznia 2025  
**Status:** MVP w rozwoju  

---

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cel Planu Testów
Niniejszy plan testów określa strategię, zakres i metodologię testowania aplikacji FishCards - platformy do tworzenia i zarządzania fiszkami edukacyjnymi z wykorzystaniem sztucznej inteligencji.

### 1.2 Cele Testowania
- **Funkcjonalne:** Weryfikacja poprawności działania wszystkich funkcji aplikacji
- **Bezpieczeństwo:** Zapewnienie ochrony danych użytkowników i bezpiecznej autentykacji  
- **Wydajność:** Potwierdzenie akceptowalnych czasów odpowiedzi i stabilności
- **Użyteczność:** Sprawdzenie intuicyjności interfejsu i doświadczenia użytkownika
- **Integracje:** Weryfikacja poprawności komunikacji z zewnętrznymi API (Supabase, OpenRouter)

### 1.3 Kryteria Sukcesu MVP
- 75% akceptacji fiszek generowanych przez AI
- 75% nowych fiszek tworzonych z pomocą AI
- Czas generacji fiszek <30 sekund
- Dostępność aplikacji >99%

---

## 2. Zakres Testów

### 2.1 Obszary Objęte Testami

#### 2.1.1 Funkcjonalności Podstawowe (Krytyczne)
- **Autentykacja użytkowników**
  - Rejestracja nowych kont
  - Logowanie/wylogowywanie
  - Zarządzanie sesjami i tokenami
  - Resetowanie hasła
  - Walidacja uprawnień dostępu

- **Zarządzanie fiszkami**
  - Tworzenie fiszek (ręczne i z AI)
  - Edycja istniejących fiszek
  - Usuwanie fiszek
  - Przeglądanie biblioteki fiszek
  - Filtrowanie i sortowanie
  - Paginacja wyników

- **Generator AI**
  - Wprowadzanie tekstu źródłowego (1000-10000 znaków)
  - Generowanie propozycji fiszek
  - Podgląd i edycja propozycji
  - Akceptacja/odrzucanie propozycji
  - Zapisywanie zaakceptowanych fiszek

#### 2.1.2 Funkcjonalności Dodatkowe (Ważne)
- **Dashboard i statystyki**
  - Wyświetlanie statystyk użytkownika
  - Wskaźniki akceptacji AI
  - Historia generacji
  - Szybki dostęp do funkcji

- **Bezpieczeństwo danych**
  - Row Level Security (RLS)
  - Ochrona przed atakami (XSS, CSRF)
  - Rate limiting API
  - Walidacja danych wejściowych

#### 2.1.3 Funkcjonalności Drugorzędne (Średnie)
- **Interfejs użytkownika**
  - Responsywność na różnych urządzeniach
  - Dostępność (ARIA, kontrasty kolorów)
  - Dark/Light mode
  - Internationalization (i18n)

### 2.2 Obszary Wyłączone z Testów
- Funkcje spaced repetition (planowane na przyszłość)
- Mobilne aplikacje natywne
- Funkcje społecznościowe
- Import dokumentów (PDF, DOCX)
- Zaawansowane wyszukiwanie
- Publiczne API

---

## 3. Typy Testów

### 3.1 Testy Funkcjonalne

#### 3.1.1 Testy Jednostkowe (Unit Tests)
**Zakres:** Pojedyncze funkcje i metody  
**Narzędzia:** Vitest + React Testing Library  
**Pokrycie:** >80% dla logiki biznesowej  

**Komponenty do testowania:**

##### Funkcje Walidacji (`src/lib/validation/`) - **PRIORYTET KRYTYCZNY**
- **flashcard.ts**
  - `validateCreateFlashcard()` - walidacja danych do tworzenia fiszki
  - `validateUpdateFlashcard()` - walidacja aktualizacji fiszki 
  - `validateStatusTransition()` - reguły biznesowe przejść statusów
  - `validateFlashcardUniqueness()` - wykrywanie duplikatów
  - `calculateTextSimilarity()` - algorytm podobieństwa Levenshtein
  - `isValidFlashcardStatus()` - walidacja statusów
  - `isValidFlashcardSource()` - walidacja źródeł
  - Zod schemas: `createFlashcardSchema`, `updateFlashcardSchema`, `flashcardQuerySchema`

- **text.ts** 
  - `validateText()` - generyczna walidacja tekstu z constraints
  - `validateSourceText()` - walidacja tekstu do generacji AI (1000-10000 znaków)
  - `validateFlashcardFront()` - walidacja przodu fiszki (max 200 znaków)
  - `validateFlashcardBack()` - walidacja tyłu fiszki (max 500 znaków)
  - `validateEmail()` - walidacja formatów email
  - `validatePassword()` - walidacja siły hasła z oceną
  - `validateUsername()` - walidacja nazw użytkowników
  - `validateFields()` - wsadowa walidacja wielu pól

##### Funkcje Uwierzytelniania (`src/lib/auth/`) - **PRIORYTET KRYTYCZNY**
- **token-utils.ts**
  - `isValidBearerToken()` - walidacja formatu JWT (3 części oddzielone kropkami)
  - `extractBearerToken()` - wyciąganie tokenu z nagłówka Authorization
  - `generateTokenJti()` - generowanie unikalnych identyfikatorów tokenów

- **auth-service.ts**
  - `mapAuthError()` - mapowanie błędów Supabase na komunikaty użytkownika
  - Logika cache i TTL dla sesji
  - Obsługa stanów loading/error

##### Serwisy API (`src/lib/`) - **PRIORYTET WYSOKI**
- **api-client.ts**
  - `handleResponse()` - parsowanie odpowiedzi API (JSON/text/błędy)
  - `isApiSuccess()` - type guard dla rezultatów API
  - `getApiError()` - wyciąganie komunikatów błędów
  - `apiCall()` - wrapper dla wywołań HTTP z obsługą retry
  - Error classes: `ApiClientError`, `NetworkError`, `TimeoutError`, `ValidationError`

- **response-helpers.ts**
  - `jsonResponse()` - tworzenie standaryzowanych odpowiedzi JSON
  - `errorResponse()` - tworzenie standaryzowanych odpowiedzi błędów
  - `logApiEvent()` - strukturalne logowanie requestów API

##### Funkcje Pomocnicze (`src/lib/utils.ts`) - **PRIORYTET WYSOKI**
- **Manipulacja Tekstu**
  - `truncateText()` - obcinanie tekstu z wielokropkiem
  - `capitalizeWords()` - kapitalizacja pierwszych liter
  - `generateSlug()` - generowanie slug'ów URL-friendly
  - `cn()` - łączenie klas CSS z Tailwind merge

- **Formatowanie Dat**
  - `formatDate()` - formatowanie dat w polskiej lokalizacji
  - `formatRelativeTime()` - relatywny czas ("2 godz temu")
  - `isToday()` - sprawdzanie czy data to dzisiaj

- **Operacje na Tablicach**
  - `groupBy()` - grupowanie elementów według klucza
  - `uniqueBy()` - usuwanie duplikatów według klucza
  - `chunk()` - dzielenie tablicy na mniejsze fragmenty

- **Operacje na Obiektach**
  - `deepMerge()` - głębokie łączenie obiektów
  - `pick()` - wybieranie określonych kluczy
  - `omit()` - usuwanie określonych kluczy

- **Utilities Asynchroniczne**
  - `debounce()` - debouncing funkcji
  - `throttle()` - throttling funkcji
  - `sleep()` - opóźnienie asynchroniczne

- **Storage API**
  - `storage.get()` - bezpieczne pobieranie z localStorage
  - `storage.set()` - bezpieczne zapisywanie do localStorage
  - Obsługa błędów quota exceeded

- **Walidacje**
  - `isValidEmail()` - sprawdzanie formatu email
  - `isValidUrl()` - walidacja URL
  - `isAlphanumeric()` - sprawdzanie znaków alfanumerycznych

##### Hooki React (`src/lib/hooks/`) - **PRIORYTET ŚREDNI**
- **useDashboardStats.ts**
  - Logika cache z TTL (Time To Live)
  - `isCacheValid()` - sprawdzanie ważności cache
  - Agregacja danych z wielu endpoint'ów
  - Obliczanie wskaźnika akceptacji AI
  - Obsługa błędów i retry

- **useDashboardNavigation.ts** 
  - `handleQuickAction()` - nawigacja według ID akcji
  - `handleStatCardClick()` - nawigacja według typu karty statystyk
  - Konfiguracja Quick Actions z metadanymi
  - URL routing helpers

##### Komponenty UI z Logiką (`src/components/`) - **PRIORYTET ŚREDNI**
- Komponenty formularzy z walidacją
- Komponenty z logiką kondycjonalną
- Event handlers z transformacją danych
- State management w komponentach

#### 3.1.2 Testy Integracyjne
**Zakres:** Komunikacja między modułami  
**Narzędzia:** Playwright + Supabase Test Client  

**Obszary testowania:**
- API endpoints z bazą danych
- Przepływ autentykacji end-to-end
- Integracja z OpenRouter API
- Middleware i routing
- RLS policies w Supabase

#### 3.1.3 Testy End-to-End (E2E)
**Zakres:** Pełne przepływy użytkownika  
**Narzędzia:** Playwright  

**Scenariusze testowe:**
- Rejestracja → Logowanie → Tworzenie fiszki → Wylogowanie
- Generowanie fiszek AI → Edycja → Zapisanie
- Zarządzanie biblioteką fiszek
- Responsywność interfejsu

### 3.2 Testy Niefunkcjonalne

#### 3.2.1 Testy Wydajności
**Narzędzia:** Lighthouse, WebPageTest, K6  

**Metryki:**
- Czas ładowania strony <3s
- First Contentful Paint <1.5s
- Time to Interactive <4s
- Czas generacji AI <30s
- Przepustowość API >100 req/s

#### 3.2.2 Testy Bezpieczeństwa
**Narzędzia:** OWASP ZAP, Burp Suite, npm audit  

**Obszary:**
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Autoryzacja i autentykacja
- Szyfrowanie komunikacji
- Walidacja danych wejściowych

#### 3.2.3 Testy Dostępności
**Narzędzia:** axe-core, Lighthouse Accessibility  

**Standardy:** WCAG 2.1 AA  
**Obszary:**
- Navigation z klawiaturą
- Screen reader compatibility
- Kontrast kolorów
- ARIA attributes
- Focus management

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 Autentykacja Użytkowników

#### TC-AUTH-001: Rejestracja Nowego Użytkownika
**Priorytet:** Krytyczny  
**Warunki wstępne:** Użytkownik nie jest zalogowany  
**Kroki:**
1. Przejdź do `/auth/register`
2. Wprowadź prawidłowy adres email
3. Wprowadź silne hasło (min 8 znaków, mix znaków)
4. Potwierdź hasło
5. Kliknij "Zarejestruj się"
6. Potwierdź email (jeśli wymagane)

**Oczekiwany rezultat:**
- Konto zostaje utworzone
- Użytkownik otrzymuje email potwierdzający
- Przekierowanie na dashboard lub stronę powitalną
- Token uwierzytelniający zapisany w localStorage

#### TC-AUTH-002: Logowanie Istniejącego Użytkownika
**Priorytet:** Krytyczny  
**Warunki wstępne:** Użytkownik ma utworzone i potwierdzone konto  
**Kroki:**
1. Przejdź do `/auth/login`
2. Wprowadź zarejestrowany email
3. Wprowadź prawidłowe hasło
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat:**
- Pomyślne uwierzytelnienie
- Przekierowanie na `/generator` lub zapamiętaną stronę
- Token JWT zapisany w localStorage
- Nagłówek aplikacji pokazuje opcje zalogowanego użytkownika

#### TC-AUTH-003: Wylogowanie
**Priorytet:** Krytyczny  
**Warunki wstępne:** Użytkownik jest zalogowany  
**Kroki:**
1. Kliknij przycisk wylogowania w nagłówku
2. Potwierdź wylogowanie (jeśli wymagane)

**Oczekiwany rezultat:**
- Token usunięty z localStorage
- Przekierowanie na stronę główną
- Brak dostępu do stron chronionych
- Nagłówek pokazuje opcje dla niezalogowanych

### 4.2 Generator AI

#### TC-GEN-001: Generowanie Fiszek z Tekstu
**Priorytet:** Krytyczny  
**Warunki wstępne:** Użytkownik jest zalogowany  
**Kroki:**
1. Przejdź do `/generator`
2. Wklej tekst o długości 1000-10000 znaków do pola tekstowego
3. Kliknij "Generuj fiszki"
4. Poczekaj na wygenerowanie propozycji

**Oczekiwany rezultat:**
- Generowanie zakończone w <30s
- Wyświetlenie 5-15 propozycji fiszek
- Każda propozycja zawiera front i back
- Możliwość edycji każdej propozycji
- Licznik wybranych propozycji

#### TC-GEN-002: Edycja Propozycji AI
**Priorytet:** Ważny  
**Warunki wstępne:** Propozycje fiszek zostały wygenerowane  
**Kroki:**
1. Kliknij "Edytuj" na wybranej propozycji
2. Zmodyfikuj tekst na froncie fiszki
3. Zmodyfikuj tekst na tyle fiszki
4. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Propozycja przechodzi w stan "editing"
- Zmiany są zachowane
- Status propozycji zmienia się na "edited"
- Propozycja nadal jest dostępna do akceptacji

#### TC-GEN-003: Zapisywanie Zaakceptowanych Fiszek
**Priorytet:** Krytyczny  
**Warunki wstępne:** Co najmniej jedna propozycja jest zaakceptowana  
**Kroki:**
1. Zaakcepuj wybrane propozycje (checkbox/przycisk)
2. Kliknij "Zapisz fiszki"
3. Poczekaj na potwierdzenie

**Oczekiwany rezultat:**
- Fiszki zapisane w bazie danych
- Aktualizacja statystyk generacji
- Komunikat o sukcesie
- Możliwość przejścia do biblioteki fiszek

### 4.3 Zarządzanie Fiszkami

#### TC-FLASH-001: Przeglądanie Biblioteki Fiszek
**Priorytet:** Ważny  
**Warunki wstępne:** Użytkownik ma co najmniej kilka fiszek  
**Kroki:**
1. Przejdź do `/flashcards`
2. Przejrzyj listę fiszek
3. Użyj filtrów (status, źródło)
4. Użyj sortowania
5. Nawiguj między stronami

**Oczekiwany rezultat:**
- Lista fiszek użytkownika
- Działające filtry i sortowanie
- Paginacja dla dużych zbiorów
- Wyświetlanie metadanych (data utworzenia, źródło, status)

#### TC-FLASH-002: Tworzenie Fiszki Ręcznej
**Priorytet:** Ważny  
**Warunki wstępne:** Użytkownik jest zalogowany  
**Kroki:**
1. W `/flashcards` kliknij "Dodaj fiszkę"
2. Wprowadź tekst na froncie (max 200 znaków)
3. Wprowadź tekst na tyle (max 500 znaków)
4. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Modal tworzenia się otwiera
- Walidacja długości tekstu
- Fiszka zapisana ze statusem "new"
- Modal się zamyka, lista fiszek się odświeża

#### TC-FLASH-003: Edycja Istniejącej Fiszki
**Priorytet:** Ważny  
**Warunki wstępne:** Użytkownik ma istniejące fiszki  
**Kroki:**
1. W `/flashcards` kliknij "Edytuj" przy fiszce
2. Zmodyfikuj treść na froncie lub tyle
3. Zmień status fiszki (opcjonalnie)
4. Kliknij "Zapisz"

**Oczekiwany rezultat:**
- Modal edycji z wypełnionymi polami
- Zmiany są zapisywane
- Lista fiszek pokazuje zaktualizowane dane
- Modal się zamyka

#### TC-FLASH-004: Usuwanie Fiszki
**Priorytet:** Ważny  
**Warunki wstępne:** Użytkownik ma istniejące fiszki  
**Kroki:**
1. W `/flashcards` kliknij "Usuń" przy fiszce
2. Potwierdź usunięcie w dialogu
3. Poczekaj na potwierdzenie

**Oczekiwany rezultat:**
- Dialog potwierdzenia się pojawia
- Po potwierdzeniu fiszka jest usuwana z bazy danych
- Lista fiszek się odświeża bez usuniętej fiszki
- Komunikat o sukcesie

### 4.4 Dashboard i Statystyki

#### TC-DASH-001: Wyświetlanie Statystyk Użytkownika
**Priorytet:** Średni  
**Warunki wstępne:** Użytkownik ma fiszki i historię generacji  
**Kroki:**
1. Przejdź do `/dashboard`
2. Przejrzyj karty statystyk
3. Sprawdź wskaźniki AI

**Oczekiwany rezultat:**
- Wyświetlenie liczby fiszek do powtórki
- Całkowita liczba fiszek
- Wskaźnik akceptacji AI (%)
- Liczba generacji AI
- Dane ładują się szybko (<2s)

### 4.5 Testy Jednostkowe - Scenariusze Szczegółowe

#### 4.5.1 Walidacja Fiszek (src/lib/validation/flashcard.ts)

##### TC-UNIT-VAL-001: Walidacja Tworzenia Fiszki
**Priorytet:** Krytyczny  
**Funkcja:** `validateCreateFlashcard()`  
**Przypadki testowe:**

```typescript
// Pozytywne przypadki
- Poprawne dane (front: "Pytanie", back: "Odpowiedź", source: "manual")
- Minimalne wymagania (front: "A", back: "B")
- Maksymalne długości (front: 200 znaków, back: 500 znaków)
- Opcjonalne pola (generation_id: null, source: undefined)

// Negatywne przypadki  
- Pusty front (błąd: "Przód fiszki nie może być pusty")
- Pusty back (błąd: "Tył fiszki nie może być pusty")
- Front > 200 znaków (błąd: "max 200 znaków")  
- Back > 500 znaków (błąd: "max 500 znaków")
- Nieprawidłowe source ("invalid" → błąd źródła)
- Nieprawidłowy generation_id (-1, 0, "string")
```

##### TC-UNIT-VAL-002: Walidacja Przejść Statusów
**Priorytet:** Krytyczny  
**Funkcja:** `validateStatusTransition()`  
**Przypadki testowe:**

```typescript
// Poprawne przejścia
- new → learning (zawsze dozwolone)
- learning → review (po nauce)  
- learning → new (powrót przy trudnościach)
- review → mastered (po 3+ powtórzeniach)
- review → learning (jeśli zapomniano)
- mastered → review (odświeżenie)

// Niepoprawne przejścia
- new → review (błąd: "musi przejść przez naukę")
- new → mastered (błąd: niedozwolone przejście)
- learning → mastered bez 3 powtórzeń (błąd reguły biznesowej)
- mastered → new (błąd: niedozwolone przejście)

// Edge cases
- repetitionCount = 0, 1, 2, 3, 10, -1 (sprawdzenie reguł)
```

##### TC-UNIT-VAL-003: Algorytm Podobieństwa Tekstu  
**Priorytet:** Wysoki  
**Funkcja:** `calculateTextSimilarity()`, `levenshteinDistance()`  
**Przypadki testowe:**

```typescript
// Identyczne teksty
- ("test", "test") → 1.0
- ("", "") → 1.0

// Podobne teksty
- ("test", "tests") → ~0.8
- ("hello", "helo") → ~0.8
- ("abc", "abcd") → 0.75

// Różne teksty  
- ("abc", "xyz") → ~0.0
- ("test", "") → 0.0
- ("", "test") → 0.0

// Polskie znaki
- ("kraków", "krakow") → sprawdzenie obsługi
- ("żółć", "zolc") → sprawdzenie diakrytyków

// Case sensitivity
- ("Test", "test") → sprawdzenie wielkości liter
```

#### 4.5.2 Walidacja Tekstu (src/lib/validation/text.ts)

##### TC-UNIT-TEXT-001: Walidacja Tekstu Źródłowego AI
**Priorytet:** Krytyczny  
**Funkcja:** `validateSourceText()`  
**Przypadki testowe:**

```typescript
// Poprawne długości
- 1000 znaków (min boundary)
- 5000 znaków (middle)
- 10000 znaków (max boundary)

// Niepoprawne długości
- 999 znaków (błąd: "minimum 1000 znaków")
- 10001 znaków (błąd: "maksimum 10000 znaków")  
- "" (błąd: "pole wymagane")
- "   " (whitespace only)

// Specjalne znaki
- Unicode, emoji, HTML tags
- Polskie znaki diakrytyczne
- Znaki specjalne (@#$%^&*)
```

##### TC-UNIT-TEXT-002: Walidacja Hasła
**Priorytet:** Krytyczny  
**Funkcja:** `validatePassword()`  
**Przypadki testowe:**

```typescript
// Silne hasła (strength: "strong")
- "StrongPass123!" (12+ znaków, wszystkie typy)
- "MySecure!Password2024" (długie z wszystkimi)

// Średnie hasła (strength: "medium")  
- "Password123" (8+ znaków, 3 kryteria)
- "mypass!123" (małe litery, cyfry, specjalne)

// Słabe hasła (strength: "weak")
- "password" (tylko małe litery)
- "12345678" (tylko cyfry)  
- "Pass123" (za krótkie)

// Błędy walidacji
- "" (błąd: wymagane)
- "short" (błąd: min 8 znaków)
- "nouppercase123!" (błąd: brak wielkich)
- "NOLOWERCASE123!" (błąd: brak małych)
- "NoNumbers!" (błąd: brak cyfr)
```

#### 4.5.3 API Client (src/lib/api-client.ts)

##### TC-UNIT-API-001: Obsługa Odpowiedzi HTTP
**Priorytet:** Krytyczny  
**Funkcja:** `handleResponse()`  
**Przypadki testowe:**

```typescript
// Sukces responses
- 200 + JSON data → {success: true, data: parsed}
- 201 + JSON data → {success: true, data: parsed}  
- 204 No Content → {success: true, data: null}
- 200 + text/plain → {success: true, data: string}

// Error responses  
- 400 + JSON error → {success: false, error: message}
- 401 + text error → {success: false, error: text}
- 404 + empty body → {success: false, error: statusText}
- 500 + malformed JSON → {success: false, error: text fallback}

// Parsing errors
- Response.json() throws → {success: false, details: {parseError: true}}
- Invalid content-type → fallback do tekstu
- Network timeout → NetworkError z odpowiednim message
```

##### TC-UNIT-API-002: Type Guards i Utilities
**Priorytet:** Wysoki  
**Funkcje:** `isApiSuccess()`, `getApiError()`  
**Przypadki testowe:**

```typescript
// isApiSuccess()
- {success: true, data: "test"} → true (type narrowing)
- {success: false, error: "fail"} → false
- {success: true} (bez data) → true
- undefined/null → false

// getApiError()
- {success: true, data: "test"} → null
- {success: false, error: "message"} → "message"  
- {success: false} (bez error) → null
- malformed objects → null
```

#### 4.5.4 Utility Functions (src/lib/utils.ts)

##### TC-UNIT-UTIL-001: Manipulacja Tekstu
**Priorytet:** Wysoki  
**Funkcje:** `truncateText()`, `generateSlug()`, `capitalizeWords()`  
**Przypadki testowe:**

```typescript
// truncateText()
- ("short", 10) → "short" (bez zmiany)
- ("very long text", 8) → "very lon..."
- ("exact length", 12) → "exact length" 
- ("", 5) → ""
- ("text", 0) → "..."

// generateSlug()
- "Hello World" → "hello-world"
- "Kraków, Żółć!" → "krakow-zolc" 
- "  Multiple   Spaces  " → "multiple-spaces"
- "Special@#$Chars" → "specialchars"
- "---dashes---" → "dashes"

// capitalizeWords()  
- "hello world" → "Hello World"
- "UPPERCASE" → "Uppercase"
- "mixed CaSe" → "Mixed Case"
- "" → ""
- "one" → "One"
```

##### TC-UNIT-UTIL-002: Formatowanie Dat
**Priorytet:** Wysoki  
**Funkcje:** `formatRelativeTime()`, `isToday()`  
**Przypadki testowe:**

```typescript
// formatRelativeTime() - relatywne do "teraz"
- 30 sekund temu → "przed chwilą"
- 5 minut temu → "5 min temu"  
- 2 godziny temu → "2 godz temu"
- 1 dzień temu → "1 dni temu"
- 35 dni temu → formatDate() output
- przyszła data → edge case handling

// isToday() 
- new Date() → true (dzisiaj)
- wczoraj → false  
- jutro → false
- ten sam dzień, inna godzina → true
- string dates vs Date objects
- invalid dates → false
```

##### TC-UNIT-UTIL-003: Storage API
**Priorytet:** Średni  
**Funkcje:** `storage.get()`, `storage.set()`, `storage.remove()`  
**Przypadki testowe:**

```typescript
// storage.get()
- istniejący klucz → parsed value
- nieistniejący klucz → defaultValue
- malformed JSON → defaultValue
- localStorage.getItem throws → defaultValue
- null/undefined defaultValue → proper handling

// storage.set()  
- prawidłowy JSON → successful save
- nieprawidłowy JSON (circular) → silent fail
- quota exceeded → silent fail
- localStorage disabled → silent fail

// storage.remove()
- istniejący klucz → successful removal
- nieistniejący klucz → no error  
- localStorage.removeItem throws → silent fail
```

##### TC-UNIT-UTIL-004: Operacje na Tablicach
**Priorytet:** Średni  
**Funkcje:** `groupBy()`, `uniqueBy()`, `chunk()`  
**Przypadki testowe:**

```typescript
// groupBy()
- [{type: 'A'}, {type: 'B'}, {type: 'A'}] by 'type' → {A: [2 items], B: [1 item]}
- pusta tablica → {}
- klucz nieistniejący → wszystko w "undefined"

// uniqueBy()
- duplikaty według 'id' → tylko unikalne
- pusta tablica → []
- wszystkie unikalne → bez zmian
- null/undefined values w kluczu

// chunk()  
- [1,2,3,4,5] chunk 2 → [[1,2], [3,4], [5]]
- pusta tablica → []
- chunk size 0 → []
- chunk size > length → [original array]
```

#### 4.5.5 Hooks React (src/lib/hooks/)

##### TC-UNIT-HOOK-001: Dashboard Stats Cache
**Priorytet:** Średni  
**Funkcja:** `useDashboardStats()` - logika cache  
**Przypadki testowe:**

```typescript
// Cache validity
- świeży cache (< TTL) → zwraca z cache
- przestarzały cache (> TTL) → fetch nowych danych  
- brak cache → fetch nowych danych
- TTL = 0 → zawsze fetch

// Error handling
- API call fails → error state, zachowa stary cache jeśli jest
- network timeout → appropriate error message
- malformed response → parsing error handling

// Stats calculation  
- AI acceptance rate calculation z różnymi danymi
- puste datasety → 0% lub appropriate defaults
- edge cases: wszystkie odrzucone, wszystkie zaakceptowane
```

##### TC-UNIT-HOOK-002: Dashboard Navigation
**Priorytet:** Niski  
**Funkcje:** `handleQuickAction()`, `handleStatCardClick()`  
**Przypadki testowe:**

```typescript
// handleQuickAction()
- prawidłowy actionId → navigateTo() z href
- nieprawidłowy actionId → no navigation
- disabled action → no navigation
- undefined/null actionId → no navigation

// handleStatCardClick()
- "flashcardsToReview" → "/flashcards?status=review"
- "totalFlashcards" → "/flashcards"  
- "aiAcceptanceRate" → "/generations"
- unknown cardType → console.warn, no navigation
- undefined cardType → no navigation
```

---

## 5. Środowisko Testowe

### 5.1 Środowiska

#### 5.1.1 Development
- **URL:** `http://localhost:3000`
- **Baza danych:** Supabase Development Project
- **AI API:** OpenRouter z kluczem testowym
- **Logi:** Pełne logowanie debug

#### 5.1.2 Staging/Testing
- **URL:** `https://staging-fishcards.example.com`
- **Baza danych:** Supabase Staging Project
- **AI API:** OpenRouter z kluczem produkcyjnym (ograniczony)
- **Logi:** Logowanie na poziomie info

#### 5.1.3 Production
- **URL:** `https://fishcards.example.com`
- **Baza danych:** Supabase Production Project
- **AI API:** OpenRouter z kluczem produkcyjnym
- **Logi:** Logowanie błędów

### 5.2 Dane Testowe

#### 5.2.1 Użytkownicy Testowi
- **Tester Admin:** `admin.test@fishcards.com`
- **Tester Basic:** `user.test@fishcards.com`
- **Tester Premium:** `premium.test@fishcards.com`

#### 5.2.2 Zbiory Danych
- **Małe:** <100 fiszek
- **Średnie:** 100-1000 fiszek
- **Duże:** >1000 fiszek
- **Teksty do generacji:** Różne długości i języki

### 5.3 Konfiguracja Narzędzi

#### 5.3.1 Testy Jednostkowe

##### Konfiguracja Vitest
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/**/*.stories.tsx',
        'src/**/*.config.ts'
      ],
      thresholds: {
        global: {
          lines: 80,
          branches: 70,
          functions: 80,
          statements: 80
        },
        // Wyższe progi dla krytycznych modułów
        'src/lib/validation/': {
          lines: 95,
          branches: 90,
          functions: 100,
          statements: 95
        },
        'src/lib/auth/': {
          lines: 90,
          branches: 85,
          functions: 90,
          statements: 90
        },
        'src/lib/api-client.ts': {
          lines: 85,
          branches: 80,
          functions: 85,
          statements: 85
        }
      }
    }
  }
})
```

##### Setup Testów - src/test/setup.ts
```typescript
// Dodatkowe matchers dla walidacji
expect.extend({
  toBeValidationResult(received, expected) {
    const pass = received.isValid === expected.isValid &&
                 received.errors.length === expected.errors.length;
    return { pass, message: () => `Expected validation result` };
  },
  
  toMatchApiResult(received, expected) {
    const pass = received.success === expected.success;
    return { pass, message: () => `Expected API result format` };
  }
});

// Mock dla localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock dla Date dla testów względnego czasu
vi.useFakeTimers();
```

##### Struktura Plików Testowych
```
src/test/unit/
├── validation/
│   ├── flashcard.test.ts           # ✅ DONE - Testy walidacji fiszek
│   ├── text.test.ts                # ✅ DONE - Testy walidacji tekstu  
│   └── schemas.test.ts             # Testy Zod schemas
├── auth/
│   ├── token-utils.test.ts         # ✅ DONE - Testy utility tokenów
│   ├── auth-service.test.ts        # ✅ DONE - Testy serwisu uwierzytelniania
│   └── error-mapping.test.ts       # Testy mapowania błędów
├── api/
│   ├── api-client.test.ts          # ✅ DONE - Testy klienta API
│   ├── response-helpers.test.ts    # ✅ DONE - Testy helper'ów odpowiedzi
│   └── error-handling.test.ts      # Testy obsługi błędów
├── utils/
│   ├── text-utils.test.ts          # ✅ DONE - Testy manipulacji tekstu
│   ├── date-utils.test.ts          # ✅ DONE - Testy formatowania dat
│   ├── array-utils.test.ts         # ✅ DONE - Testy operacji na tablicach
│   ├── storage-utils.test.ts       # ✅ DONE - Testy localStorage wrapper
│   └── validation-utils.test.ts    # Testy walidacji
├── hooks/
│   ├── useDashboardStats.test.ts   # ✅ DONE - Testy hook'a statystyk
│   ├── useDashboardNavigation.test.ts # ✅ DONE - Testy hook'a nawigacji
│   └── useApiCall.test.ts          # Testy hook'a API calls
└── helpers/
    ├── test-utils.ts               # Wspólne utility testowe
    ├── mock-data.ts                # ✅ DONE - Mock data generators
    └── custom-matchers.ts          # Custom Jest/Vitest matchers
```

##### Mock Data Generators - src/test/helpers/mock-data.ts
```typescript
// Generatory danych testowych
export const createMockFlashcard = (overrides = {}) => ({
  id: 1,
  front: 'Test question',
  back: 'Test answer', 
  status: 'new',
  source: 'manual',
  repetition_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});

export const createMockApiResponse = (success = true, data = null) => ({
  success,
  ...(success ? { data } : { error: 'Test error', details: {} })
});

export const createLongText = (length: number) => 
  'A'.repeat(length);

export const createValidationTestCases = () => [
  // Test cases for boundary conditions
  { input: '', expected: { isValid: false, errors: ['Required'] } },
  { input: 'A'.repeat(200), expected: { isValid: true, errors: [] } },
  { input: 'A'.repeat(201), expected: { isValid: false, errors: ['Too long'] } }
];
```

##### Przykład Testu Walidacji
```typescript  
// src/test/unit/validation/flashcard.test.ts
describe('validateCreateFlashcard', () => {
  describe('when valid data provided', () => {
    it('should return valid result for correct flashcard', () => {
      const input = {
        front: 'Valid question?',
        back: 'Valid answer.',
        source: 'manual' as const
      };
      
      const result = validateCreateFlashcard(input);
      
      expect(result).toBeValidationResult({
        isValid: true,
        errors: []
      });
      expect(result.fieldErrors).toEqual({});
    });
  });
  
  describe('when invalid data provided', () => {
    it('should return field-specific errors', () => {
      const input = {
        front: '', // Empty - invalid
        back: 'A'.repeat(501), // Too long - invalid  
        source: 'invalid' as any
      };
      
      const result = validateCreateFlashcard(input);
      
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.front).toContain('Przód fiszki nie może być pusty');
      expect(result.fieldErrors.back).toContain('maksymalnie 500 znaków');
      expect(result.fieldErrors.source).toContain('Nieprawidłowe źródło');
    });
  });
});

#### 5.3.2 Testy E2E
```javascript
// playwright.config.ts
export default {
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' }
  ]
}
```

---

## 6. Narzędzia do Testowania

### 6.1 Narzędzia Automatyczne

#### 6.1.1 Testy Jednostkowe i Komponentów
- **Vitest** - Framework testowy
- **React Testing Library** - Testowanie komponentów React
- **@testing-library/user-event** - Symulacja interakcji użytkownika
- **msw (Mock Service Worker)** - Mockowanie API calls

#### 6.1.2 Testy E2E i Integracyjne
- **Playwright** - Automacja przeglądarek
- **Supabase Test Helpers** - Testowanie bazy danych
- **Docker** - Izolowane środowiska testowe

#### 6.1.3 Testy Wydajności
- **Lighthouse CI** - Audyty wydajności w CI/CD
- **WebPageTest** - Szczegółowa analiza ładowania
- **K6** - Testy obciążenia API

#### 6.1.4 Analiza Jakości Kodu
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatowanie kodu
- **TypeScript Compiler** - Sprawdzanie typów
- **SonarQube** - Analiza jakości i pokrycia testów

### 6.2 Narzędzia Manualne

#### 6.2.1 Testowanie Funkcjonalne
- **Chrome DevTools** - Debug i analiza
- **React Developer Tools** - Debug komponentów React
- **Postman** - Testowanie API
- **Browser Stack** - Testowanie na różnych przeglądarkach

#### 6.2.2 Testowanie Dostępności
- **axe DevTools** - Audyty dostępności
- **NVDA/JAWS** - Screen readers
- **Colour Contrast Analyser** - Sprawdzanie kontrastów

### 6.3 Monitoring i Raportowanie
- **GitHub Actions** - CI/CD pipeline
- **Vitest Coverage Reports** - Pokrycie testów jednostkowych
- **Playwright HTML Reporter** - Raporty E2E
- **Allure** - Zaawansowane raporty testowe

---

## 7. Harmonogram Testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1-2)
**Termin:** 6-19 stycznia 2025

**Zadania:**
- Konfiguracja środowisk testowych
- Instalacja i konfiguracja narzędzi
- Przygotowanie danych testowych
- Tworzenie szkieletów testów

**Deliverables:**
- Skonfigurowane środowiska dev/staging
- Działający pipeline CI/CD
- Zbiory danych testowych
- Dokumentacja setup'u

### 7.2 Faza 2: Testy Podstawowe (Tydzień 3-4)
**Termin:** 20 stycznia - 2 lutego 2025

**Zadania:**

*Testy Jednostkowe (Tydzień 3):*
- **Dzień 1-2:** ✅ **DONE** - Funkcje walidacji (`src/lib/validation/`) - PRIORYTET 1
  - ✅ `validateCreateFlashcard()`, `validateUpdateFlashcard()`
  - ✅ `validateStatusTransition()` - reguły biznesowe
  - ✅ `calculateTextSimilarity()` - algorytm Levenshtein
  - ✅ `validateFlashcardUniqueness()` - wykrywanie duplikatów
  - ✅ `isValidFlashcardStatus()`, `isValidFlashcardSource()`, `validateRepetitionCount()`
  - ✅ 75 testów, wszystkie przechodzące, 87.45% pokrycia linii
- **Dzień 3-4:** ✅ **DONE** - API Client (`src/lib/api-client.ts`) - PRIORYTET 1  
  - ✅ `handleResponse()` dla wszystkich HTTP status codes
  - ✅ Error classes i type guards
  - ✅ Retry logic i timeout handling
- **Dzień 5:** ✅ **DONE** - Auth utilities (`src/lib/auth/`) - PRIORYTET 1
  - ✅ `isValidBearerToken()`, `extractBearerToken()`
  - ✅ `mapAuthError()` dla wszystkich błędów Supabase

*Testy Jednostkowe (Tydzień 4):*
- **Dzień 1-2:** ✅ **DONE** - Utility functions (`src/lib/utils.ts`) - PRIORYTET 2
  - ✅ Text manipulation: `truncateText()`, `generateSlug()`, `capitalizeWords()`
  - ✅ Date formatting: `formatRelativeTime()`, `isToday()`
  - ✅ Array operations: `groupBy()`, `uniqueBy()`, `chunk()`
- **Dzień 3:** ✅ **DONE** - Storage i async utilities - PRIORYTET 2
  - ✅ `storage.get/set/remove()` z error handling
  - ✅ `debounce()`, `throttle()`, `sleep()`
- **Dzień 4:** ✅ **DONE** - React hooks - PRIORYTET 3
  - ✅ `useDashboardStats()` cache logic
  - ✅ `useDashboardNavigation()` routing
- **Dzień 5:** ✅ **DONE** - Text validation (`src/lib/validation/text.ts`) - PRIORYTET 2
  - ✅ `validateSourceText()`, `validatePassword()`
  - ✅ Email, URL, username validation

*Pozostałe zadania:*
- Testy integracyjne API
- Podstawowe testy E2E dla głównych przepływów  
- Testy bezpieczeństwa autentykacji

**Cel pokrycia:**
- ✅ Testy jednostkowe ogólnie: >80% - **OSIĄGNIĘTE**
- ✅ Funkcje walidacji: >95% (krytyczne) - **OSIĄGNIĘTE** 
- ✅ Auth utilities: >90% (krytyczne) - **OSIĄGNIĘTE**
- ✅ API Client: >85% (wysokie) - **OSIĄGNIĘTE**
- ✅ Utility functions: >80% (wysokie) - **OSIĄGNIĘTE**
- ✅ React hooks: >70% (średnie) - **OSIĄGNIĘTE**
- API endpoints: 100%
- Krytyczne przepływy: 100%

### 7.3 Faza 3: Testy Zaawansowane (Tydzień 5-6)
**Termin:** 3-16 lutego 2025

**Zadania:**
- Testy wydajności i obciążenia
- Testy dostępności
- Testy responsywności UI
- Testy integracji AI (OpenRouter)

**Metryki:**
- Lighthouse Score: >90
- Czas ładowania: <3s
- WCAG 2.1 AA compliance: >95%

### 7.4 Faza 4: Testy Akceptacyjne (Tydzień 7)
**Termin:** 17-23 lutego 2025

**Zadania:**
- User Acceptance Testing (UAT)
- Testy regresji
- Performance testing na danych produkcyjnych
- Bug fixing i retesting

**Kryteria:**
- Brak błędów krytycznych
- <5 błędów średnich
- Akceptacja przez stakeholders

### 7.5 Faza 5: Pre-Production (Tydzień 8)
**Termin:** 24 lutego - 2 marca 2025

**Zadania:**
- Smoke tests na środowisku produkcyjnym
- Monitoring setup
- Dokumentacja finalna
- Go-live readiness review

---

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria Funkcjonalne

#### 8.1.1 Testy Jednostkowe

##### Ogólne Kryteria
- **Pokrycie kodu:** ≥80% dla logiki biznesowej
- **Pokrycie branches:** ≥70%
- **Wszystkie testy muszą przechodzić:** 100%
- **Czas wykonania:** <5 minut dla pełnego suite

##### Szczegółowe Kryteria Pokrycia według Modułów

**Funkcje Walidacji (PRIORYTET KRYTYCZNY) - Pokrycie: ≥95%**
- `src/lib/validation/flashcard.ts`: ≥95% lines, ≥90% branches
  - Wszystkie funkcje walidacyjne: 100% przypadków pozytywnych i negatywnych
  - Algorytm podobieństwa: 100% edge cases (empty, identical, different)
  - Zod schemas: 100% validation rules i error messages
- `src/lib/validation/text.ts`: ≥90% lines, ≥85% branches
  - Boundary conditions: min/max length dla wszystkich funkcji
  - Regex patterns: wszystkie formaty (email, password, username)
  - Special characters handling: Unicode, diakrytyki, HTML

**Uwierzytelnianie (PRIORYTET KRYTYCZNY) - Pokrycie: ≥90%**
- `src/lib/auth/token-utils.ts`: ≥95% lines
  - JWT format validation: wszystkie przypadki (valid/invalid format)
  - Bearer token extraction: wszystkie formaty nagłówków
- `src/lib/auth/auth-service.ts`: ≥85% lines  
  - Error mapping: wszystkie typy błędów Supabase
  - State management: loading/success/error states

**API Client (PRIORYTET WYSOKI) - Pokrycie: ≥85%**
- `src/lib/api-client.ts`: ≥90% lines, ≥80% branches
  - Response handling: wszystkie HTTP status codes (2xx, 4xx, 5xx)
  - Content-Type parsing: JSON, text, empty responses
  - Error scenarios: network, timeout, parsing errors
- `src/lib/response-helpers.ts`: ≥95% lines
  - Response formatting: success i error cases
  - Logging: wszystkie poziomy (INFO, WARN, ERROR)

**Utility Functions (PRIORYTET WYSOKI) - Pokrycie: ≥80%**
- `src/lib/utils.ts`: ≥85% lines, ≥75% branches
  - Text manipulation: edge cases (empty, null, very long)
  - Date formatting: różne timezone i locale
  - Array operations: empty arrays, single items, large datasets
  - Storage API: localStorage availability i quota limits
  - Deep merge: circular references, nested objects

**React Hooks (PRIORYTET ŚREDNI) - Pokrycie: ≥70%**
- `src/lib/hooks/useDashboardStats.ts`: ≥75% lines
  - Cache logic: TTL expiration, memory management
  - API integration: success/error scenarios
- `src/lib/hooks/useDashboardNavigation.ts`: ≥80% lines
  - Navigation logic: wszystkie action types
  - URL generation: wszystkie route patterns

##### Metryki Jakości Testów
- **Assertion density:** ≥3 assertions per test case
- **Test isolation:** 100% - brak shared state między testami
- **Mock usage:** <30% real dependencies, ≥70% mocked
- **Test naming:** Consistent BDD format (should/when/given)
- **Documentation:** 100% critical functions mają example usage

##### Automatyczna Analiza Jakości
- **Mutation testing score:** ≥75% dla krytycznych funkcji
- **Code duplication:** <5% w test files
- **Complexity score:** Średnia cyklomatyczna <10 per function
- **Maintainability index:** >70 dla test suites

#### 8.1.2 Testy Integracyjne
- **Wszystkie API endpoints:** 100% przetestowane
- **Scenariusze błędów:** 100% pokryte
- **Testy bazy danych:** Wszystkie operacje CRUD
- **RLS policies:** Wszystkie zasady zweryfikowane

#### 8.1.3 Testy E2E
- **Krytyczne przepływy:** 100% automatyczne pokrycie
- **Cross-browser:** Chrome, Firefox, Safari
- **Responsive design:** Desktop, tablet, mobile
- **Wskaźnik sukcesu:** ≥95% przechodzących testów

### 8.2 Kryteria Niefunkcjonalne

#### 8.2.1 Wydajność
- **Czas ładowania strony:** <3 sekundy
- **First Contentful Paint:** <1.5 sekundy
- **Time to Interactive:** <4 sekundy
- **Generowanie AI:** <30 sekund
- **Lighthouse Performance Score:** ≥90

#### 8.2.2 Bezpieczeństwo
- **OWASP Top 10:** 0 krytycznych podatności
- **Audyt npm:** 0 wysokich podatności
- **Headers security:** A+ rating na securityheaders.com
- **SSL/TLS:** A+ rating na ssllabs.com

#### 8.2.3 Dostępność
- **WCAG 2.1 AA compliance:** ≥95%
- **Lighthouse Accessibility Score:** ≥95
- **Keyboard navigation:** 100% funkcjonalność
- **Screen reader compatibility:** Podstawowe funkcje

### 8.3 Kryteria Biznesowe

#### 8.3.1 MVP Goals
- **AI acceptance rate:** ≥75%
- **AI-generated flashcards ratio:** ≥75%
- **User task completion rate:** ≥90%
- **System availability:** ≥99%

#### 8.3.2 User Experience
- **Task success rate:** ≥95%
- **User error rate:** <5%
- **Time to complete key tasks:** Określone benchmarki
- **User satisfaction score:** ≥4/5

---

## 9. Role i Odpowiedzialności

### 9.1 Test Manager
**Odpowiedzialny:** Senior QA Engineer

**Zadania:**
- Planowanie i koordynacja aktivności testowych
- Zarządzanie harmonogramem i zasobami
- Raportowanie postępu do stakeholders
- Zarządzanie ryzykiem testowym
- Review i approve test case'ów

### 9.2 Test Engineers

#### 9.2.1 Automation Test Engineer
**Zadania:**
- Rozwój i maintenance frameworku testowego
- Implementacja testów automatycznych
- CI/CD integration
- Performance testing setup
- Code review testów

#### 9.2.2 Manual Test Engineer
**Zadania:**
- Eksekucja testów manualnych
- Exploratory testing
- User acceptance testing coordination
- Bug reporting i tracking
- Test case development

#### 9.2.3 Security Tester
**Zadania:**
- Security audits i penetration testing
- Vulnerability assessment
- Security test cases development
- Compliance verification
- Security risk assessment

### 9.3 Development Team
**Zadania:**
- Unit tests development
- Code review pod kątem testability
- Bug fixing
- Test environment support
- Technical test data preparation

### 9.4 Product Owner
**Zadania:**
- Acceptance criteria definition
- User story validation
- UAT coordination
- Business risk assessment
- Go-live decision

### 9.5 DevOps Engineer
**Zadania:**
- Test environments setup i maintenance
- CI/CD pipeline configuration
- Test data management
- Monitoring setup
- Infrastructure support

---

## 10. Procedury Raportowania Błędów

### 10.1 Klasyfikacja Błędów

#### 10.1.1 Krytyczne (P1)
**Definicja:** Aplikacja nie działa lub blokuje kluczowe funkcjonalności
**Przykłady:**
- Niemożność logowania
- Utrata danych użytkownika
- Naruszenie bezpieczeństwa
- Całkowita awaria systemu

**SLA:** Zgłoszenie w ciągu 1 godziny, fix w ciągu 24 godzin

#### 10.1.2 Wysokie (P2)
**Definicja:** Ważne funkcjonalności działają niepoprawnie
**Przykłady:**
- Generator AI nie działa
- Nie można zapisać fiszek
- Problemy z wydajnością
- Błędy UI w kluczowych przepływach

**SLA:** Zgłoszenie w ciągu 4 godzin, fix w ciągu 3 dni

#### 10.1.3 Średnie (P3)
**Definicja:** Mniejsze problemy funkcjonalne lub UI
**Przykłady:**
- Błędy walidacji
- Problemy z filtrowaniem
- Drobne błędy UI
- Problemy z dostępnością

**SLA:** Zgłoszenie w ciągu 1 dnia, fix w ciągu 1 tygodnia

#### 10.1.4 Niskie (P4)
**Definicja:** Kosmetyczne błędy i ulepszenia
**Przykłady:**
- Błędy językowe
- Drobne problemy z układem
- Suggestions for improvement
- Nice-to-have features

**SLA:** Zgłoszenie w ciągu 3 dni, fix w następnym sprint'cie

### 10.2 Format Zgłoszenia Błędu

#### 10.2.1 Wymagane Pola
```
**Bug ID:** AUTO-GENERATED
**Title:** [Krótki opis problemu]
**Priority:** P1/P2/P3/P4
**Severity:** Critical/High/Medium/Low
**Environment:** Development/Staging/Production
**Browser/Device:** Chrome 119/Windows 11
**Reporter:** [Imię Nazwisko]
**Assigned to:** [Developer/Team]
**Status:** Open/In Progress/Fixed/Closed

**Steps to Reproduce:**
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

**Expected Result:**
[Co powinno się stać]

**Actual Result:**
[Co się rzeczywiście stało]

**Screenshots/Videos:**
[Załączone pliki]

**Additional Information:**
- Console errors
- Network logs
- User data context
- Workaround (if any)
```

#### 10.2.2 Proces Workflow
1. **Open** → Nowo zgłoszony błąd
2. **Triaged** → Przeanalizowany i przypisany
3. **In Progress** → Developer pracuje nad fix'em
4. **Fixed** → Fix zaimplementowany, czeka na test
5. **Verified** → Tester potwierdził fix
6. **Closed** → Błąd zamknięty
7. **Reopened** → Błąd powrócił lub fix niewystarczający

### 10.3 Narzędzia Bug Tracking
- **Primary:** GitHub Issues
- **Integration:** Linear/Jira (jeśli używane)
- **Communication:** Slack/Discord channels
- **Documentation:** Confluence/Notion

### 10.4 Metryki i Reporting

#### 10.4.1 Daily Metrics
- Liczba otwartych błędów według priorytetu
- Liczba rozwiązanych błędów
- Average resolution time
- Backlog trends

#### 10.4.2 Weekly Reports
- Bug discovery rate
- Fix rate
- Regression issues
- Test execution progress
- Risk assessment update

#### 10.4.3 Sprint/Release Reports
- Test completion rate
- Bug leakage to production
- Test automation coverage
- Performance benchmarks
- Quality gates status

#### 10.4.4 Unit Test Specific Metrics
- **Coverage drift:** Tracking pokrycia w czasie (target: no decrease)
- **Flaky test rate:** Procent testów które czasem failują (<2%)
- **Test execution time:** Czas wykonania suite testów (<5 min)
- **Mock vs integration ratio:** Balance między izolacją a realnością
- **Assertion density:** Średnia liczba assertion'ów per test (target: ≥3)

**Red flags dla testów jednostkowych:**
- Spadek pokrycia >5% między commity
- Test suite time >10 minut
- Więcej niż 3 flaky tests w sprint'cie  
- Testy z <2 assertions (zbyt słabe)
- Mock coverage >80% w business logic (za dużo mock'ów)

---

## 11. Zarządzanie Ryzykiem Testowym

### 11.1 Identyfikacja Ryzyk

#### 11.1.1 Ryzyka Techniczne (Wysokie)
**R1: Niestabilność integracji OpenRouter API**
- **Prawdopodobieństwo:** Średnie
- **Wpływ:** Wysoki  
- **Mitigation:** Mock API, circuit breakers, retry logic
- **Monitoring:** API uptime, response times, error rates

**R2: Problemy z wydajnością przy dużych zbiorach danych**
- **Prawdopodobieństwo:** Średnie
- **Wpływ:** Średni
- **Mitigation:** Pagination, lazy loading, performance testing
- **Monitoring:** Database query times, UI response times

**R3: Bezpieczeństwo RLS i token management**
- **Prawdopodobieństwo:** Niskie
- **Wpływ:** Krytyczny
- **Mitigation:** Penetration testing, code review, audit
- **Monitoring:** Security scans, unauthorized access attempts

#### 11.1.2 Ryzyka Biznesowe (Średnie)
**R4: Nieakceptowalne czasy generacji AI**
- **Prawdopodobieństwo:** Średnie
- **Wpływ:** Wysoki
- **Mitigation:** Load testing, optimization, fallback mechanisms
- **Monitoring:** Generation times, user abandonment rate

**R5: Niska jakość generowanych fiszek**
- **Prawdopodobieństwo:** Średnie
- **Wpływ:** Wysoki
- **Mitigation:** Prompt engineering, user feedback, A/B testing
- **Monitoring:** Acceptance rates, user satisfaction

#### 11.1.3 Ryzyka Projektowe (Średnie)
**R6: Opóźnienia w dostarczeniu funkcjonalności**
- **Prawdopodobieństwo:** Średnie
- **Wpływ:** Średni
- **Mitigation:** Agile methodology, regular checkpoints
- **Monitoring:** Sprint burndown, velocity tracking

**R7: Niepełne pokrycie testami**
- **Prawdopodobieństwo:** Niskie
- **Wpływ:** Średni
- **Mitigation:** Automated coverage tracking, code review
- **Monitoring:** Coverage reports, test execution rates

### 11.2 Plan Reagowania na Ryzyka

#### 11.2.1 Immediate Actions (0-24h)
- Activation of incident response team
- Rollback procedures (if applicable)
- User communication
- Stakeholder notification

#### 11.2.2 Short-term Actions (1-7 days)
- Root cause analysis
- Temporary workarounds
- Increased monitoring
- Communication updates

#### 11.2.3 Long-term Actions (1-4 weeks)
- Permanent fixes implementation
- Process improvements
- Additional testing
- Post-mortem review

---

## 12. Podsumowanie i Wnioski

### 12.1 Kluczowe Założenia
- Plan testów skoncentrowany na funkcjonalnościach MVP
- Priorytet na bezpieczeństwo i stabilność podstawowych funkcji
- Zbalansowane podejście automatyzacja vs. testy manualne
- Ciągłe doskonalenie procesu opartego na metrykach

### 12.2 Oczekiwane Korzyści
- **Jakość:** Wysoka jakość oprogramowania przez systematyczne testowanie
- **Bezpieczeństwo:** Ochrona danych użytkowników i aplikacji
- **Wydajność:** Optymalne czasy odpowiedzi i stabilność
- **Satysfakcja:** Pozytywne doświadczenie użytkowników

### 12.3 Obszary do Rozwoju
- Rozbudowa testów AI/ML po MVP
- Implementacja testów performance na większą skalę
- Rozwój testów accessibility
- Testy międzynarodowych wersji aplikacji

### 12.4 Sukces MVP
Plan testów został zaprojektowany aby zagwarantować osiągnięcie celów MVP:
- ✅ 75% akceptacji fiszek generowanych przez AI  
- ✅ 75% nowych fiszek tworzonych z pomocą AI
- ✅ Czas generacji fiszek <30 sekund
- ✅ Dostępność aplikacji >99%

---

**Dokument zatwierdzony przez:**
- Test Manager: _________________ Data: _________
- Development Lead: _____________ Data: _________  
- Product Owner: _______________ Data: _________

**Wersja dokumentu:** 1.0  
**Następny przegląd:** 13 stycznia 2025