# Plan implementacji widoku Dashboard

## 1. Przegląd
Dashboard jest głównym widokiem aplikacji FishCards, dostępnym po zalogowaniu użytkownika. Jego celem jest zapewnienie szybkiego przeglądu najważniejszych statystyk użytkownika oraz łatwego dostępu do kluczowych funkcji aplikacji. Widok priorytetyzuje akcję nauki poprzez wizualne wyróżnienie przycisku "Start Nauki" i wyświetlanie liczby fiszek oczekujących na powtórkę.

## 2. Routing widoku
- **Ścieżka:** `/dashboard`
- **Dostęp:** Wymagana autoryzacja użytkownika (AuthGuard)
- **Przekierowanie:** Po pomyślnym logowaniu użytkownik jest automatycznie przekierowywany na dashboard

## 3. Struktura komponentów
```
DashboardView (główny kontener)
├── StatsOverview (sekcja statystyk)
│   ├── StatCard (Fiszki do powtórki dziś)
│   ├── StatCard (Całkowita liczba fiszek)
│   ├── StatCard (Wskaźnik akceptacji AI)
│   └── StatCard (Ostatnia aktywność)
└── QuickActionButtons (sekcja szybkich akcji)
    ├── Button (Start Nauki) - primary
    ├── Button (Nowy Generator) - secondary
    ├── Button (Moje Fiszki) - outline
    └── Button (Historia Generowania) - outline
```

## 4. Szczegóły komponentów

### DashboardView
- **Opis:** Główny kontener widoku dashboard odpowiedzialny za layout, pobieranie danych i orkiestrację komponentów potomnych
- **Główne elementy:** Header z tytułem, sekcja StatsOverview, sekcja QuickActionButtons, loading states, error boundaries
- **Obsługiwane interakcje:** Inicjalizacja danych przy mount, handling błędów, odświeżanie danych
- **Obsługiwana walidacja:** Sprawdzenie autoryzacji użytkownika, walidacja otrzymanych danych z API
- **Typy:** DashboardViewProps, DashboardStats, User (z auth context)
- **Propsy:** Brak - główny widok

### StatsOverview
- **Opis:** Kontener grupujący karty statystyk w responsywnym grid layout
- **Główne elementy:** Grid container z 4 kartami StatCard, loading skeleton, empty state
- **Obsługiwane interakcje:** Przekazywanie kliknięć do StatCard
- **Obsługiwana walidacja:** Sprawdzenie czy otrzymane dane są kompletne i poprawne
- **Typy:** StatsOverviewProps zawierający DashboardStats
- **Propsy:** `{ stats: DashboardStats | null, loading: boolean, onCardClick?: (cardType: string) => void }`

### StatCard
- **Opis:** Pojedyncza karta wyświetlająca statystykę z tytułem, wartością, opcjonalnym podtytułem i ikoną
- **Główne elementy:** Card z Shadcn/ui, tytuł, główna wartość, opcjonalny subtitle, opcjonalna ikona, loading skeleton
- **Obsługiwane interakcje:** onClick dla nawigacji do szczegółowych widoków
- **Obsługiwana walidacja:** Sprawdzenie czy value nie jest null/undefined, formatowanie liczb
- **Typy:** StatCardProps
- **Propsy:** `{ title: string, value: number | string, subtitle?: string, icon?: React.ReactNode, loading?: boolean, onClick?: () => void, className?: string }`

### QuickActionButtons
- **Opis:** Sekcja z przyciskami umożliwiającymi szybki dostęp do głównych funkcji aplikacji
- **Główne elementy:** Flex container z przyciskami Button z Shadcn/ui, każdy z różnym variant
- **Obsługiwane interakcje:** Nawigacja do odpowiednich widoków poprzez router
- **Obsługiwana walidacja:** Sprawdzenie uprawnień użytkownika do poszczególnych akcji
- **Typy:** QuickActionButtonsProps zawierający array QuickAction
- **Propsy:** `{ actions: QuickAction[], disabled?: boolean }`

## 5. Typy

### DashboardStats
```typescript
interface DashboardStats {
  flashcardsToReviewToday: number;        // Liczba fiszek do powtórki dziś
  totalFlashcards: number;                // Całkowita liczba fiszek użytkownika
  aiAcceptanceRate: number;               // Wskaźnik akceptacji AI w procentach (0-100)
  totalGenerations: number;               // Całkowita liczba generacji AI
  lastActivityDate?: Date;                // Data ostatniej aktywności
  weeklyProgress?: {                      // Opcjonalne statystyki tygodniowe
    reviewedCount: number;
    createdCount: number;
  };
}
```

### StatCardProps
```typescript
interface StatCardProps {
  title: string;                          // Tytuł karty (np. "Fiszki do powtórki")
  value: number | string;                 // Główna wartość do wyświetlenia
  subtitle?: string;                      // Dodatkowy opis pod główną wartością
  icon?: React.ReactNode;                 // Opcjonalna ikona z Lucide React
  loading?: boolean;                      // Stan ładowania
  onClick?: () => void;                   // Handler kliknięcia
  className?: string;                     // Dodatkowe klasy CSS
}
```

### QuickAction
```typescript
interface QuickAction {
  id: string;                            // Unikalny identyfikator akcji
  title: string;                         // Tytuł przycisku
  description: string;                   // Opis akcji
  href: string;                          // Ścieżka nawigacji
  icon?: React.ReactNode;                // Opcjonalna ikona
  variant: 'primary' | 'secondary' | 'outline';  // Wariant stylu przycisku
  disabled?: boolean;                    // Status wyłączenia
}
```

## 6. Zarządzanie stanem
Stan widoku jest zarządzany przez custom hook `useDashboardStats`, który:
- Pobiera dane statystyk z API przy inicjalizacji komponentu
- Zarządza stanami loading, error, data
- Udostępnia metodę `refetchStats()` do odświeżania danych
- Implementuje cache z TTL dla optymalizacji wydajności

Dodatkowy hook `useDashboardNavigation` zarządza nawigacją i enkapsuluje logikę przekierowań do różnych sekcji aplikacji.

Stan globalny (użytkownik, autoryzacja) jest pobierany z istniejącego Auth Context.

## 7. Integracja API
Dashboard korzysta z następujących endpointów:

### Pobieranie statystyk fiszek
- **Request:** `GET /api/flashcards?page=1&limit=1`
- **Response:** `PaginatedFlashcardsResponse` - wykorzystywana jest wartość `pagination.total`

### Pobieranie fiszek do powtórki
- **Request:** `GET /api/flashcards?status=review&page=1&limit=50`
- **Response:** `PaginatedFlashcardsResponse` - wykorzystywana jest wartość `pagination.total`

### Pobieranie statystyk generacji AI
- **Request:** `GET /api/generations?page=1&limit=50`
- **Response:** `PaginatedGenerationsResponse` - analiza danych do wyliczenia wskaźnika akceptacji

## 8. Interakcje użytkownika
- **Kliknięcie "Start Nauki":** Przekierowanie do `/learning` (lub `/flashcards?mode=learning`)
- **Kliknięcie "Nowy Generator":** Przekierowanie do `/generator`
- **Kliknięcie "Moje Fiszki":** Przekierowanie do `/flashcards`
- **Kliknięcie "Historia Generowania":** Przekierowanie do `/generations`
- **Kliknięcie StatCard:** Opcjonalne przekierowanie do szczegółowego widoku danej statystyki
- **Pull-to-refresh:** Odświeżenie wszystkich danych dashboard (mobile)

## 9. Warunki i walidacja
- **Autoryzacja:** Cały widok wymaga zalogowania - weryfikacja przez AuthGuard na poziomie routingu
- **Dane API:** Walidacja wszystkich otrzymanych danych przed wyświetleniem
- **Liczby:** Formatowanie dużych liczb (np. 1000+ -> 1K+)
- **Daty:** Formatowanie dat względnych (np. "2 dni temu")
- **Procenty:** Walidacja zakresu 0-100% dla wskaźnika akceptacji AI
- **Empty states:** Graceful handling gdy użytkownik nie ma jeszcze żadnych danych

## 10. Obsługa błędów
- **401 Unauthorized:** Przekierowanie do `/auth/login` z komunikatem o wygaśnięciu sesji
- **5xx Server Error:** Wyświetlenie error state z przyciskiem "Spróbuj ponownie"
- **Network Error:** Offline indicator z automatycznym retry po powrocie połączenia
- **Timeout:** Loading timeout z możliwością manual retry
- **Partial Data:** Wyświetlenie dostępnych danych z ostrzeżeniem o niepełnych informacjach
- **Empty Data:** Empty state z zachętą do stworzenia pierwszych fiszek

## 11. Kroki implementacji

1. **Przygotowanie typów**
   - Utworzenie `DashboardStats`, `StatCardProps`, `QuickAction` w pliku types
   - Rozszerzenie istniejących typów jeśli potrzeba

2. **Implementacja custom hooks**
   - `useDashboardStats` - pobieranie i zarządzanie danymi statystyk
   - `useDashboardNavigation` - enkapsulacja logiki nawigacji

3. **Komponenty atomowe**
   - `StatCard` - pojedyncza karta statystyki z loading state
   - Testowanie różnych wariantów danych

4. **Komponenty kompozytowe**
   - `StatsOverview` - kontener dla kart statystyk
   - `QuickActionButtons` - sekcja przycisków akcji

5. **Główny komponent widoku**
   - `DashboardView` - integracja wszystkich komponentów
   - Implementacja AuthGuard
   - Error boundaries

6. **Strona Astro**
   - Utworzenie `/dashboard.astro`
   - Konfiguracja hydratacji dla DashboardView
   - SEO metadata

7. **Stylowanie i responsywność**
   - Implementacja responsive grid dla StatCard
   - Mobile-first approach
   - Dark mode support

8. **Testy i optymalizacja**
   - Unit testy dla hooks i komponentów
   - Performance testing i optimization
   - Accessibility audit

9. **Integracja z routingiem**
   - Konfiguracja ścieżek w Astro
   - Middleware dla autoryzacji
   - Redirect logic po logowaniu