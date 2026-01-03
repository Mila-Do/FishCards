# Plan implementacji widoku Biblioteka (Moje Fiszki)

## 1. Przegląd

Widok "Biblioteka (Moje Fiszki)" służy do zarządzania istniejącą bazą fiszek użytkownika. Umożliwia przeglądanie, edycję, usuwanie oraz ręczne tworzenie nowych fiszek. Widok prezentuje dane w formie tabeli z funkcjami sortowania, filtrowania i paginacji, zapewniając efektywne zarządzanie dużymi zbiorami fiszek.

## 2. Routing widoku

**Ścieżka:** `/flashcards`  
**Typ:** Chroniona strona wymagająca uwierzytelnienia  
**Plik:** `src/pages/flashcards.astro`

## 3. Struktura komponentów

```
FlashcardsPage (src/pages/flashcards.astro)
├── FlashcardsView (src/components/flashcards/FlashcardsView.tsx)
    ├── FlashcardsHeader (src/components/flashcards/FlashcardsHeader.tsx)
    │   ├── SearchBar (src/components/flashcards/SearchBar.tsx)
    │   └── CreateFlashcardButton (src/components/flashcards/CreateFlashcardButton.tsx)
    ├── FlashcardsTable (src/components/flashcards/FlashcardsTable.tsx)
    │   ├── FlashcardRow[] (src/components/flashcards/FlashcardRow.tsx)
    │   │   ├── StatusBadge (src/components/flashcards/StatusBadge.tsx)
    │   │   ├── SourceBadge (src/components/flashcards/SourceBadge.tsx)
    │   │   ├── FlashcardActions (src/components/flashcards/FlashcardActions.tsx)
    │   └── EmptyState (src/components/flashcards/EmptyState.tsx)
    ├── PaginationControls (src/components/flashcards/PaginationControls.tsx)
    ├── CreateFlashcardModal (src/components/flashcards/CreateFlashcardModal.tsx)
    ├── EditFlashcardModal (src/components/flashcards/EditFlashcardModal.tsx)
    └── DeleteAlertDialog (src/components/flashcards/DeleteAlertDialog.tsx)
```

## 4. Szczegóły komponentów

### FlashcardsView

- **Opis komponentu:** Główny kontener widoku zarządzający całą logiką biblioteki fiszek, koordynuje komunikację między podkomponentami i obsługuje zarządzanie stanem
- **Główne elementy:** Container div z układem grid/flex, header section, content section z tabelą, loading states, modales
- **Obsługiwane interakcje:** Ładowanie danych, odświeżanie listy, obsługa błędów, koordynuje wszystkie interakcje użytkownika poprzez funkcje callback
- **Obsługiwana walidacja:** Walidacja odpowiedzi API, sprawdzanie autoryzacji, koordynuje walidację formularzy modali
- **Typy:** `FlashcardsViewState`, `ErrorResponse`
- **Propsy:** Brak (główny komponent)

### FlashcardsHeader

- **Opis:** Nagłówek widoku zawierający tytuł, filtry i przycisk dodawania nowej fiszki
- **Główne elementy:** H1 z tytułem, SearchBar, CreateFlashcardButton
- **Obsługiwane interakcje:** Otwieranie modalu tworzenia fiszki
- **Obsługiwana walidacja:** Brak bezpośredniej walidacji
- **Typy:** FlashcardFilters
- **Propsy:** `onCreateClick: () => void, filters: FlashcardFilters, onFiltersChange: (filters: FlashcardFilters) => void`

### SearchBar

- **Opis:** Panel filtrowania umożliwiający filtrowanie po statusie i źródle fiszek
- **Główne elementy:** Select dla statusu, Select dla źródła, Button do resetowania filtrów
- **Obsługiwane interakcje:** Zmiana filtrów, resetowanie filtrów
- **Obsługiwana walidacja:** Sprawdzenie czy wartości filtrów są z dozwolonych enum
- **Typy:** FlashcardFilters, FlashcardStatus, FlashcardSource
- **Propsy:** `filters: FlashcardFilters, onFiltersChange: (filters: FlashcardFilters) => void`

### FlashcardsTable

- **Opis:** Tabela wyświetlająca listę fiszek z możliwością sortowania według kolumn
- **Główne elementy:** Table component (Shadcn), TableHeader z sortowalnymi kolumnami, TableBody z FlashcardRow
- **Obsługiwane interakcje:** Sortowanie po kolumnach, ładowanie kolejnych stron
- **Obsługiwana walidacja:** Sprawdzenie czy dane w tabeli są kompletne
- **Typy:** FlashcardViewModel[], FlashcardSortField, SortOrder
- **Propsy:** `flashcards: FlashcardViewModel[], loading: boolean, sort: SortState, onSortChange: (field: FlashcardSortField) => void, onEditClick: (flashcard: FlashcardViewModel) => void, onDeleteClick: (flashcard: FlashcardViewModel) => void`

### FlashcardRow

- **Opis:** Wiersz tabeli reprezentujący pojedynczą fiszkę z podglądem treści i akcjami
- **Główne elementy:** TableRow, TableCell dla każdej kolumny (przód, tył, status, źródło, data, akcje)
- **Obsługiwane interakcje:** Edycja fiszki, usuwanie fiszki
- **Obsługiwana walidacja:** Sprawdzenie długości wyświetlanego tekstu (obcinanie długich tekstów)
- **Typy:** FlashcardViewModel
- **Propsy:** `flashcard: FlashcardViewModel, onEditClick: (flashcard: FlashcardViewModel) => void, onDeleteClick: (flashcard: FlashcardViewModel) => void`

### StatusBadge

- **Opis:** Kolorowy znaczek wyświetlający status fiszki z odpowiednimi kolorami
- **Główne elementy:** Badge component (Shadcn) z wariantami kolorów
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Sprawdzenie czy status jest z dozwolonej listy
- **Typy:** FlashcardStatus
- **Propsy:** `status: FlashcardStatus`

### SourceBadge

- **Opis:** Znaczek wyświetlający źródło pochodzenia fiszki (manual, ai, mixed)
- **Główne elementy:** Badge component z ikonami dla każdego typu źródła
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Sprawdzenie czy źródło jest z dozwolonej listy
- **Typy:** FlashcardSource
- **Propsy:** `source: FlashcardSource`

### CreateFlashcardModal

- **Opis:** Modal do tworzenia nowej fiszki z formularzem zawierającym pola przód, tył i źródło
- **Główne elementy:** Dialog (Shadcn), form z polami textarea dla przodu i tyłu, select dla źródła
- **Obsługiwane interakcje:** Wysłanie formularza, anulowanie, walidacja w czasie rzeczywistym
- **Obsługiwana walidacja:** front (1-200 znaków), back (1-500 znaków), source (enum values)
- **Typy:** CreateFlashcardForm, CreateFlashcardCommand
- **Propsy:** `isOpen: boolean, onClose: () => void, onSubmit: (data: CreateFlashcardCommand) => Promise<void>`

### EditFlashcardModal

- **Opis:** Modal do edycji istniejącej fiszki ze wszystkimi dostępnymi polami do modyfikacji
- **Główne elementy:** Dialog z formularzem edycji (front, back, status, source, repetition_count)
- **Obsługiwane interakcje:** Aktualizacja fiszki, anulowanie, resetowanie do oryginalnych wartości
- **Obsługiwana walidacja:** front (1-200 znaków), back (1-500 znaków), status (enum), source (enum), repetition_count (≥0)
- **Typy:** EditFlashcardForm, UpdateFlashcardCommand, FlashcardViewModel
- **Propsy:** `flashcard: FlashcardViewModel | null, isOpen: boolean, onClose: () => void, onSubmit: (id: number, data: UpdateFlashcardCommand) => Promise<void>`

### DeleteAlertDialog

- **Opis:** Dialog potwierdzający usunięcie fiszki z ostrzeżeniem o trwałości operacji
- **Główne elementy:** AlertDialog (Shadcn) z tytułem, opisem i przyciskami anuluj/usuń
- **Obsługiwane interakcje:** Potwierdzenie usunięcia, anulowanie
- **Obsługiwana walidacja:** Sprawdzenie czy fiszka została wybrana do usunięcia
- **Typy:** FlashcardViewModel
- **Propsy:** `flashcard: FlashcardViewModel | null, isOpen: boolean, onClose: () => void, onConfirm: (id: number) => Promise<void>`

### PaginationControls

- **Opis:** Kontrolki nawigacji po stronach z informacjami o aktualnej stronie i łącznej liczbie elementów
- **Główne elementy:** Div z przyciskami poprzednia/następna strona, numerami stron, informacjami o zakresie
- **Obsługiwane interakcje:** Przejście do konkretnej strony, nawigacja przód/wstecz
- **Obsługiwana walidacja:** Sprawdzenie czy numer strony jest w dozwolonym zakresie
- **Typy:** PaginationMeta
- **Propsy:** `pagination: PaginationMeta, onPageChange: (page: number) => void`

### EmptyState

- **Opis:** Komponent wyświetlany gdy brak jest fiszek spełniających kryteria filtrowania
- **Główne elementy:** Div z ikoną, tekstem informacyjnym i przyciskiem dodania pierwszej fiszki
- **Obsługiwane interakcje:** Otworzenie modalu tworzenia fiszki
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** `onCreateClick: () => void, hasFilters: boolean`

## 5. Typy

### FlashcardViewModel

```typescript
interface FlashcardViewModel extends FlashcardDTO {
  isLoading?: boolean; // Stan ładowania dla operacji na konkretnej fiszce
  isEditing?: boolean; // Flaga dla trybu edycji inline (opcjonalnie)
}
```

### FlashcardsViewState

```typescript
interface FlashcardsViewState {
  flashcards: FlashcardViewModel[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: FlashcardFilters;
  sort: SortState;
  modals: ModalState;
  selectedCount: number;
}
```

### FlashcardFilters

```typescript
interface FlashcardFilters {
  status: FlashcardStatus | null;
  source: FlashcardSource | null;
}
```

### SortState

```typescript
interface SortState {
  field: FlashcardSortField;
  order: SortOrder;
}
```

### ModalState

```typescript
interface ModalState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedFlashcard: FlashcardViewModel | null;
}
```

### CreateFlashcardForm

```typescript
interface CreateFlashcardForm {
  front: string;
  back: string;
  source: FlashcardSource;
}
```

### EditFlashcardForm

```typescript
interface EditFlashcardForm {
  front: string;
  back: string;
  status: FlashcardStatus;
  source: FlashcardSource;
  repetition_count: number;
}
```

### API Types (wykorzystane z src/types.ts)

```typescript
// Import z src/types.ts
import type {
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  DeleteFlashcardResponse,
  FlashcardQueryParams,
  PaginatedFlashcardsResponse,
  PaginationMeta,
  ErrorResponse,
  FlashcardStatus,
  FlashcardSource,
  FlashcardSortField,
  SortOrder,
} from "../types";
```

## 6. Zarządzanie stanem

### Główny hook: useFlashcardsState

```typescript
const useFlashcardsState = () => {
  const [state, setState] = useState<FlashcardsViewState>({
    flashcards: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
    filters: { status: null, source: null },
    sort: { field: "created_at", order: "desc" },
    modals: { isCreateModalOpen: false, isEditModalOpen: false, isDeleteDialogOpen: false, selectedFlashcard: null },
    selectedCount: 0,
  });

  const fetchFlashcards = async () => {
    /* pobieranie listy z API z zastosowaniem filtrów i sortowania */
  };
  const createFlashcard = async (data: CreateFlashcardCommand) => {
    /* tworzenie nowej fiszki */
  };
  const updateFlashcard = async (id: number, data: UpdateFlashcardCommand) => {
    /* edycja fiszki */
  };
  const deleteFlashcard = async (id: number) => {
    /* usuwanie fiszki z potwierdzeniem */
  };
  const applyFilters = (filters: FlashcardFilters) => {
    /* zastosowanie filtrów i odświeżenie listy */
  };
  const applySort = (field: FlashcardSortField) => {
    /* zmiana sortowania i odświeżenie listy */
  };
  const changePage = (page: number) => {
    /* zmiana strony i pobranie danych */
  };

  return {
    state,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    applyFilters,
    applySort,
    changePage,
  };
};
```

### Pomocnicze hooki

```typescript
const useFlashcardModals = () => {
  // Zarządzanie stanem modali i dialogów
  // Zwraca: { modalState, openCreateModal, openEditModal, openDeleteDialog, closeModals }
};

const useApiCalls = () => {
  // Centralizacja wywołań API dla fiszek
  // Zwraca: { fetchFlashcards, createFlashcard, updateFlashcard, deleteFlashcard }
};
```

## 7. Integracja API

### GET /api/flashcards

- **Typy żądania:** FlashcardQueryParams (page, limit, status, source, sort, order)
- **Typy odpowiedzi:** PaginatedFlashcardsResponse
- **Użycie:** Pobieranie listy fiszek z filtrami i paginacją

### POST /api/flashcards

**Typ żądania:** `CreateFlashcardCommand`

```typescript
{
  front: string; // 1-200 znaków
  back: string; // 1-500 znaków
  source: 'manual' | 'ai' | 'mixed';
  generation_id?: number | null;
}
```

**Typ odpowiedzi:** `FlashcardDTO`
**Użycie:** Tworzenie nowej fiszki ręcznie przez użytkownika

### PATCH /api/flashcards/:id

**Typ żądania:** `UpdateFlashcardCommand` (wszystkie pola opcjonalne)

```typescript
{
  front?: string; // 1-200 znaków
  back?: string; // 1-500 znaków
  status?: FlashcardStatus;
  source?: FlashcardSource;
  repetition_count?: number;
}
```

**Typ odpowiedzi:** `FlashcardDTO`
**Użycie:** Edycja istniejącej fiszki

### DELETE /api/flashcards/:id

**Typ żądania:** Brak (tylko ID w URL)
**Typ odpowiedzi:** `DeleteFlashcardResponse`
**Użycie:** Usuwanie fiszki po potwierdzeniu

### Obsługa błędów API

- **400 Bad Request:** Błędy walidacji - wyświetlenie komunikatów przy odpowiednich polach
- **401 Unauthorized:** Przekierowanie do logowania
- **404 Not Found:** Komunikat o braku fiszki lub braku dostępu
- **500 Internal Server Error:** Toast o błędzie serwera z możliwością ponownej próby

## 8. Interakcje użytkownika

### Przeglądanie fiszek

- Użytkownik wchodzi na `/flashcards`
- Automatyczne ładowanie pierwszej strony fiszek
- Wyświetlenie tabeli z paginacją

### Filtrowanie

- Użytkownik wybiera filter statusu lub źródła z rozwijanej listy
- Automatyczne odświeżenie listy z zastosowanymi filtrami
- Reset filtrów przywraca pełną listę

### Sortowanie

- Kliknięcie na nagłówek kolumny zmienia sortowanie
- Ponowne kliknięcie odwraca kolejność sortowania
- Wizualna wskazówka kierunku sortowania (strzałki)

### Tworzenie fiszki

- Kliknięcie "Dodaj fiszkę" otwiera modal
- Wypełnienie formularza z walidacją
- Zapisanie dodaje fiszkę do listy i zamyka modal

### Edycja fiszki

- Kliknięcie ikony edycji otwiera modal z danymi fiszki
- Modyfikacja pól z walidacją
- Zapisanie aktualizuje fiszkę na liście

### Usuwanie fiszki

- Kliknięcie ikony usuwania otwiera dialog potwierdzenia
- Potwierdzenie usuwa fiszkę z bazy i listy
- Anulowanie zamyka dialog bez zmian

## 9. Warunki i walidacja

### Walidacja formularzy (CreateFlashcardModal, EditFlashcardModal)

- **front:** wymagane, min 1 znak, max 200 znaków
- **back:** wymagane, min 1 znak, max 500 znaków
- **status:** musi być jedną z wartości enum FlashcardStatus
- **source:** musi być jedną z wartości enum FlashcardSource
- **repetition_count:** musi być liczbą całkowitą ≥ 0

### Walidacja UI

- Wyłączenie przycisku zapisu gdy formularz jest nieprawidłowy
- Wyświetlenie błędów walidacji pod polami formularza
- Wskazanie wymaganych pól

### Walidacja danych z API

- Sprawdzenie formatu odpowiedzi z API
- Obsługa błędów walidacji zwracanych przez backend (400)
- Fallback dla nieprawidłowych danych

## 10. Obsługa błędów

### Błędy autoryzacji (401)

- Automatyczne przekierowanie do strony logowania
- Wyświetlenie komunikatu o wygaśnięciu sesji

### Błędy walidacji (400)

- Wyświetlenie konkretnych błędów przy polach formularza
- Blokada zapisu do czasu naprawienia błędów
- Highlighting nieprawidłowych pól

### Błędy serwera (500)

- Toast notification z komunikatem o błędzie
- Możliwość ponowienia operacji
- Logowanie błędów do konsoli deweloperskiej

### Błędy sieci

- Retry mechanism dla failed requests
- Loading states podczas ponownych prób
- Fallback UI dla braku połączenia

### Błędy nie znaleziono (404)

- Komunikat o braku fiszki (dla operacji na konkretnej fiszce)
- Odświeżenie listy po błędzie 404

## 11. Kroki implementacji

1. **Przygotowanie struktury plików**
   - Utworzenie `src/pages/flashcards.astro`
   - Utworzenie folderu `src/components/flashcards/`
   - Konfiguracja routingu w Astro

2. **Implementacja głównego komponentu FlashcardsView**
   - Definicja interfejsów TypeScript
   - Podstawowa struktura komponentu React
   - Hook `useFlashcardsState`

3. **Utworzenie podstawowych komponentów UI**
   - StatusBadge - kolorowe znaczki statusów
   - SourceBadge - znaczki źródeł fiszek
   - EmptyState - stan pusty dla brak fiszek

4. **Integracja API zarządzania fiszkami**
   - Hook `useApiCalls` dla wywołań API
   - Obsługa GET /api/flashcards z filtrami i paginacją
   - Obsługa CRUD operations
   - Obsługa błędów API

5. **Implementacja komponentów tabeli**
   - FlashcardRow - wiersz z pojedynczą fiszką
   - FlashcardsTable - tabela z sortowaniem
   - PaginationControls - nawigacja po stronach

6. **Implementacja komponentów filtrowania**
   - SearchBar - filtry statusu i źródła
   - FlashcardsHeader - nagłówek z filtrami i przyciskiem dodawania

7. **Implementacja modali**
   - CreateFlashcardModal - tworzenie nowej fiszki
   - EditFlashcardModal - edycja istniejącej fiszki
   - DeleteAlertDialog - potwierdzenie usunięcia

8. **Implementacja zarządzania stanem**
   - useFlashcardsState z pełną logiką biznesową
   - useFlashcardModals dla zarządzania modalami
   - Integracja wszystkich komponentów w FlashcardsView
   - Event handling dla wszystkich interakcji

9. **Utworzenie strony Astro**
   - src/pages/flashcards.astro
   - Integracja z layoutem aplikacji
   - SEO i meta tags

10. **Testowanie i optymalizacja**
    - Testowanie wszystkich flow użytkownika
    - Optymalizacja wydajności dla dużych list
    - Responsive design testing
    - Accessibility testing

11. **Stylowanie i UX**
    - Implementacja designu zgodnie z Tailwind 4
    - Animacje przejść i micro-interactions
    - Dark mode support
    - Keyboard navigation

12. **Obsługa błędów i edge cases**
    - Error boundaries dla komponentów React
    - Graceful degradation przy błędach API
    - Loading states i skeleton screens
    - Empty states i komunikaty użytkownika
