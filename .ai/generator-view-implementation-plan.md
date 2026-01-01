# Plan implementacji widoku Generowania fiszek

## 1. Przegląd

Widok generowania fiszek umożliwia użytkownikom tworzenie propozycji fiszek przy użyciu sztucznej inteligencji na podstawie dostarczonego tekstu źródłowego. Użytkownicy mogą wkleić tekst (1000-10000 znaków), wygenerować propozycje fiszek przez AI, a następnie przejrzeć, edytować i zatwierdzać wybrane propozycje przed zapisaniem ich do bazy danych. Widok zapewnia nieblokujące doświadczenie użytkownika z możliwością nawigacji podczas procesu generowania.

## 2. Routing widoku

**Ścieżka:** `/generator`  
**Typ:** Chroniona strona wymagająca uwierzytelnienia  
**Plik:** `src/pages/generator.astro`

## 3. Struktura komponentów

```
GeneratorView (React)
├── TextInputSection
│   ├── Textarea (Shadcn/ui)
│   ├── CharacterCounter
│   └── GenerateButton (Shadcn/ui Button)
├── LoadingOverlay
├── ProposalsSection
│   ├── ProposalsSkeleton (podczas ładowania)
│   ├── ProposalCard (wielokrotnie)
│   │   ├── Card (Shadcn/ui)
│   │   ├── EditableField (custom)
│   │   └── ActionButtons
│   └── SaveSection
│       └── SaveButton (Shadcn/ui Button)
└── ErrorDisplay (Toast notifications)
```

## 4. Szczegóły komponentów

### GeneratorView
- **Opis komponentu:** Główny kontener widoku generowania fiszek, zarządza całym stanem aplikacji i koordynuje komunikację między podkomponentami
- **Główne elementy:** Container div z układem grid/flex, zawiera wszystkie sekcje widoku
- **Obsługiwane interakcje:** Koordynuje wszystkie interakcje użytkownika poprzez funkcje callback
- **Obsługiwana walidacja:** Koordynuje walidację tekstów wejściowych i propozycji fiszek
- **Typy:** `GeneratorViewState`, `ErrorResponse`
- **Propsy:** Brak (główny komponent)

### TextInputSection
- **Opis komponentu:** Sekcja zawierająca pole tekstowe do wprowadzania tekstu źródłowego wraz z licznikiem znaków i przyciskiem generowania
- **Główne elementy:** `<div>` z `<Textarea>`, `<CharacterCounter>`, `<GenerateButton>`
- **Obsługiwane interakcje:** `onChange` (zmiana tekstu), `onGenerate` (rozpoczęcie generowania)
- **Obsługiwana walidacja:** 
  - Długość tekstu: minimum 1000 znaków, maksimum 10000 znaków
  - Walidacja w czasie rzeczywistym z debounce 300ms
  - Blokada przycisku generowania przy niepoprawnej długości
- **Typy:** `TextInputProps`, `TextInputState`
- **Propsy:** `value: string`, `onChange: (value: string) => void`, `onGenerate: () => void`, `isLoading: boolean`, `errors: string[]`

### CharacterCounter
- **Opis komponentu:** Wizualny wskaźnik liczby znaków z kolorowym oznaczeniem statusu walidacji
- **Główne elementy:** `<span>` z tekstem licznika i ikonami stanu
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Obsługiwana walidacja:** 
  - Wizualne oznaczenie: czerwony (za mało/za dużo), zielony (poprawnie)
  - Wyświetlanie progresu: "1250 / 10000 znaków"
- **Typy:** `CharacterCounterProps`
- **Propsy:** `count: number`, `min: number`, `max: number`, `isValid: boolean`

### GenerateButton
- **Opis komponentu:** Przycisk uruchamiający proces generowania propozycji przez AI
- **Główne elementy:** Shadcn/ui `<Button>` z ikoną i tekstem
- **Obsługiwane interakcje:** `onClick` (uruchomienie generowania)
- **Obsługiwana walidacja:** 
  - Aktywny tylko gdy tekst ma poprawną długość (1000-10000 znaków)
  - Wyłączony podczas trwającego generowania
- **Typy:** `GenerateButtonProps`
- **Propsy:** `onClick: () => void`, `isDisabled: boolean`, `isLoading: boolean`

### ProposalsSection
- **Opis komponentu:** Sekcja zawierająca listę wygenerowanych propozycji fiszek i przycisk zapisu wybranych
- **Główne elementy:** `<div>` z nagłówkiem, ProposalsSkeleton (podczas ładowania) lub listą `<ProposalCard>` i `<SaveSection>`
- **Obsługiwane interakcje:** `onSave` (zapis wybranych propozycji)
- **Obsługiwana walidacja:** 
  - Minimum jedna propozycja musi być zaakceptowana przed zapisem
  - Walidacja edytowanych propozycji (długość front/back)
- **Logika wyświetlania:** 
  - `isLoading: true` → wyświetla ProposalsSkeleton
  - `isLoading: false` + `proposals.length > 0` → wyświetla ProposalCard
  - `isLoading: false` + `proposals.length === 0` → komunikat o braku propozycji
- **Typy:** `ProposalsSectionProps`, `ProposalState[]`
- **Propsy:** `proposals: ProposalState[]`, `onSave: () => void`, `isVisible: boolean`, `isLoading: boolean`, `selectedCount: number`

### ProposalCard
- **Opis komponentu:** Karta reprezentująca pojedynczą propozycję fiszki z możliwością akceptacji, edycji lub odrzucenia
- **Główne elementy:** Shadcn/ui `<Card>` z polami front/back, przyciskami akcji i statusem
- **Obsługiwane interakcje:** 
  - `onAccept` (akceptacja propozycji - zachowuje `source: 'ai'`)
  - `onEdit` (przełączenie trybu edycji)
  - `onReject` (odrzucenie propozycji)
  - `onSave` (zapisanie edycji - automatycznie zmienia `source: 'mixed'`)
- **Obsługiwana walidacja:**
  - Front: 1-200 znaków (walidacja w czasie rzeczywistym)
  - Back: 1-500 znaków (walidacja w czasie rzeczywistym)
  - Oznaczenie wizualne zmian względem oryginału
- **Logika source:**
  - Propozycja inicjalizowana z `source: 'ai'`
  - Przy edycji treści automatyczna zmiana na `source: 'mixed'`
  - Wizualne oznaczenie czy fiszka została zmodyfikowana
- **Typy:** `ProposalCardProps`, `ProposalState`
- **Propsy:** `proposal: ProposalState`, `onAccept: () => void`, `onEdit: () => void`, `onReject: () => void`, `onSave: (front: string, back: string) => void`

### ProposalsSkeleton
- **Opis komponentu:** Skeleton UI wyświetlający szablon kart propozycji podczas ładowania danych z API
- **Główne elementy:** 4 skeleton cards imitujących strukturę ProposalCard, używa Shadcn/ui Skeleton component z animacją pulsowania
- **Struktura skeleton card:** Card container + 2 skeleton rectangles (front/back) + 3 skeleton buttons (actions)
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Obsługiwana walidacja:** Brak
- **Zastosowanie:** Wyświetlany podczas generowania propozycji przez AI (POST /api/generations) - może trwać 2-10 sekund
- **UX korzyści:** Pokazuje użytkownikowi strukturę oczekiwanych danych, nie blokuje interfejsu, nowoczesny UX
- **Typy:** `ProposalsSkeletonProps`
- **Propsy:** `count?: number` (liczba skeleton cards, domyślnie 4)

### LoadingOverlay
- **Opis komponentu:** Nieblokujący indicator ładowania wyświetlany podczas krótkich operacji API
- **Główne elementy:** Półprzezroczysty overlay z spinnerem i komunikatem
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie)
- **Obsługiwana walidacja:** Brak
- **Zastosowanie:** Używany podczas zapisywania fiszek (POST /api/flashcards) i innych krótkich operacji
- **Typy:** `LoadingOverlayProps`
- **Propsy:** `isVisible: boolean`, `message: string`

## 5. Typy

### Główne interfejsy stanu

```typescript
interface GeneratorViewState {
  sourceText: string;
  proposals: ProposalState[];
  isLoadingProposals: boolean; // dla ProposalsSkeleton
  isSavingFlashcards: boolean; // dla LoadingOverlay
  errors: ValidationErrors;
  generationId: number | null;
  selectedCount: number;
}

interface ProposalState {
  id: string; // lokalne UUID dla UI
  front: string;
  back: string;
  source: 'ai' | 'mixed';
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  isEdited: boolean;
  originalFront: string;
  originalBack: string;
  validationErrors: {
    front?: string[];
    back?: string[];
  };
}

interface TextInputState {
  value: string;
  isValid: boolean;
  characterCount: number;
  errors: string[];
}

interface ValidationErrors {
  textInput?: string[];
  proposals?: Record<string, string[]>;
  api?: string;
}
```

### Propsy komponentów

```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  errors: string[];
}

interface CharacterCounterProps {
  count: number;
  min: number;
  max: number;
  isValid: boolean;
}

interface ProposalCardProps {
  proposal: ProposalState;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
  onSave: (front: string, back: string) => void;
}

interface ProposalsSectionProps {
  proposals: ProposalState[];
  onSave: () => void;
  isVisible: boolean;
  selectedCount: number;
  isLoading: boolean; // dla wyświetlania skeleton
}

interface ProposalsSkeletonProps {
  count?: number; // liczba skeleton cards, domyślnie 4
}
```

### API Types (wykorzystane z src/types.ts)

```typescript
// Import z src/types.ts
import type {
  CreateGenerationCommand,
  GenerationProposalsResponse,
  FlashcardProposal,
  CreateFlashcardsCommand,
  FlashcardDTO,
  ErrorResponse
} from '../types';
```

## 6. Zarządzanie stanem

### Główny hook: useGeneratorState

```typescript
const useGeneratorState = () => {
  const [state, setState] = useState<GeneratorViewState>({
    sourceText: '',
    proposals: [],
    isLoading: false,
    errors: {},
    generationId: null,
    selectedCount: 0
  });

  const updateSourceText = (text: string) => { /* walidacja i aktualizacja */ };
  const generateProposals = async () => { /* wywołanie API generowania - propozycje inicjalizowane z source: 'ai' */ };
  const updateProposal = (id: string, updates: Partial<ProposalState>) => { 
    /* aktualizacja propozycji - przy edycji automatyczna zmiana source: 'mixed' */
    if (updates.front !== undefined || updates.back !== undefined) {
      updates.source = 'mixed';
      updates.isEdited = true;
    }
  };
  const saveSelectedProposals = async () => { /* zapis wybranych fiszek z odpowiednim source */ };

  return { state, updateSourceText, generateProposals, updateProposal, saveSelectedProposals };
};
```

### Pomocnicze hooki

```typescript
const useTextValidation = (text: string) => {
  // Walidacja tekstu z debounce
  // Zwraca: { isValid, errors, characterCount }
};

const useApiCalls = () => {
  // Centralizacja wywołań API
  // Zwraca: { generateProposals, saveFlashcards }
};
```

## 7. Integracja API

### POST /api/generations

**Typ żądania:** `CreateGenerationCommand`
```typescript
{
  source_text: string; // 1000-10000 znaków
}
```

**Typ odpowiedzi:** `GenerationProposalsResponse`
```typescript
{
  generation_id: number;
  flashcards_proposals: FlashcardProposal[];
  metadata: {
    generated_count: number;
    source_text_length: number;
    generation_duration_ms: number;
  };
}
```

### POST /api/flashcards

**Typ żądania:** `CreateFlashcardsCommand` (tablica)
```typescript
[
  {
    front: string; // 1-200 znaków
    back: string; // 1-500 znaków
    source: 'ai' | 'mixed';
    generation_id: number;
  }
]
```

**Typ odpowiedzi:** `FlashcardDTO[]`

### Obsługa błędów API

- **400 Bad Request:** Błędy walidacji - wyświetlenie komunikatów pod polami
- **401 Unauthorized:** Przekierowanie do logowania
- **429 Too Many Requests:** Toast o przekroczeniu limitów
- **500/502:** Toast o błędzie serwera z możliwością ponownej próby

## 8. Interakcje użytkownika

### Wpisywanie tekstu źródłowego
1. **Akcja:** Użytkownik wprowadza tekst w polu tekstowym
2. **Obsługa:** `onChange` z debounce 300ms → walidacja długości → aktualizacja licznika znaków
3. **Wynik:** Wizualne oznaczenie poprawności, aktywacja/dezaktywacja przycisku Generate

### Generowanie propozycji
1. **Akcja:** Kliknięcie przycisku "Generuj fiszki"
2. **Obsługa:** Walidacja → wywołanie API → wyświetlenie ProposalsSkeleton (4 skeleton cards) → przetworzenie odpowiedzi
3. **Wynik:** Lista ProposalCard lub komunikat o błędzie

### Zarządzanie propozycjami
1. **Akceptacja:** Kliknięcie ✓ → zmiana statusu na 'accepted' → zachowanie `source: 'ai'` → aktualizacja licznika wybranych
2. **Edycja:** Kliknięcie ✏️ → tryb edycji → walidacja w czasie rzeczywistym → zapisanie zmian → automatyczna zmiana `source: 'mixed'` → zmiana statusu na 'accepted'
3. **Odrzucenie:** Kliknięcie ✗ → zmiana statusu na 'rejected' → ukrycie karty

### Zapis fiszek
1. **Akcja:** Kliknięcie "Zapisz wybrane fiszki"
2. **Obsługa:** Walidacja wybranych → przygotowanie payload z odpowiednimi wartościami `source` ('ai' lub 'mixed') → wywołanie API POST /api/flashcards → feedback użytkownikowi
3. **Wynik:** Komunikat o sukcesie i przekierowanie lub błąd z możliwością ponownej próby

## 9. Warunki i walidacja

### Walidacja tekstu źródłowego (TextInputSection)
- **Warunek:** Długość 1000-10000 znaków
- **Wpływ na UI:** Aktywność przycisku Generate, kolor licznika znaków
- **Komunikaty:** "Minimum 1000 znaków", "Maksimum 10000 znaków"

### Walidacja propozycji (ProposalCard)
- **Warunek Front:** 1-200 znaków, nie może być pusty
- **Warunek Back:** 1-500 znaków, nie może być pusty
- **Wpływ na UI:** Oznaczenie błędnych pól, blokada zapisywania edycji
- **Komunikaty:** Wyświetlane pod polami w trybie edycji

### Walidacja zapisu (ProposalsSection)
- **Warunek:** Minimum jedna propozycja ze statusem 'accepted'
- **Wpływ na UI:** Aktywność przycisku "Zapisz wybrane fiszki"
- **Komunikaty:** "Wybierz co najmniej jedną fiszkę do zapisania"

### Logika ustawiania pola source
- **Inicjalizacja:** Wszystkie propozycje z API generowania otrzymują `source: 'ai'`
- **Akceptacja bez zmian:** Propozycja zachowuje `source: 'ai'` przy zapisie
- **Edycja treści:** Automatyczna zmiana na `source: 'mixed'` przy modyfikacji front/back
- **Wysyłanie do API:** Pole `source` jest dynamicznie ustawiane na podstawie stanu propozycji

## 10. Obsługa błędów

### Błędy walidacji
- **Lokalizacja:** Pod polami formularzy
- **Styl:** Czerwony tekst, ikony ostrzeżenia
- **Zachowanie:** Walidacja w czasie rzeczywistym z debounce

### Błędy API
- **400 Bad Request:** Wyświetlenie szczegółów walidacji w odpowiednich polach
- **429 Rate Limit:** Toast: "Przekroczono limit żądań. Spróbuj ponownie za chwilę"
- **500/502 Server Error:** Toast z opcją "Spróbuj ponownie"
- **Network Error:** Toast: "Błąd połączenia. Sprawdź internet i spróbuj ponownie"

### Błędy biznesowe
- **Brak propozycji:** Komunikat: "AI nie wygenerowało propozycji. Spróbuj z innym tekstem"
- **Timeout:** Automatyczne anulowanie po 60s z komunikatem

### Fallback states
- **Częściowa utrata połączenia:** Zapisanie stanu w localStorage
- **Odświeżenie strony:** Przywrócenie stanu z localStorage (jeśli < 1h)

## 11. Kroki implementacji

1. **Przygotowanie struktury plików**
   - Utworzenie `src/pages/generator.astro`
   - Utworzenie foldera `src/components/generator/`
   - Konfiguracja routingu w Astro

2. **Implementacja głównego komponentu GeneratorView**
   - Definicja interfejsów TypeScript
   - Podstawowa struktura komponentu React
   - Hook `useGeneratorState`

3. **Implementacja TextInputSection**
   - Komponent Textarea z Shadcn/ui
   - Hook `useTextValidation` z debounce
   - CharacterCounter z wizualną walidacją
   - GenerateButton z obsługą stanów

4. **Integracja API generowania**
   - Hook `useApiCalls` dla wywołań API
   - Obsługa POST /api/generations
   - LoadingOverlay podczas generowania
   - Obsługa błędów API

5. **Implementacja ProposalsSection**
   - ProposalsSkeleton dla stanu ładowania (4 skeleton cards z animacją)
   - Komponenty ProposalCard
   - Zarządzanie stanem propozycji z logiką `source` ('ai' vs 'mixed')
   - Edycja in-place z walidacją i automatyczną zmianą source
   - Mechanizmy akceptacji/odrzucenia z zachowaniem odpowiedniego source

6. **Implementacja zapisu fiszek**
   - SaveSection z walidacją wybranych
   - Integracja POST /api/flashcards z dynamicznym ustawianiem `source` ('ai'/'mixed')
   - Obsługa odpowiedzi i błędów
   - Feedback użytkownikowi

7. **Stylowanie i UX**
   - Implementacja designu z Tailwind CSS
   - Responsywność dla różnych urządzeń
   - Animacje i przejścia
   - Dostępność (a11y)

8. **Testowanie i optymalizacja**
   - Testy jednostkowe komponentów
   - Testy integracyjne API
   - Testowanie scenariuszy błędów
   - Optymalizacja wydajności

9. **Dokumentacja i finalizacja**
   - Komentarze w kodzie
   - Dokumentacja komponentów
   - Przewodnik użytkowania
   - Code review i refaktoryzacja