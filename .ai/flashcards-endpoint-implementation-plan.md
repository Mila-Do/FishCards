# API Endpoint Implementation Plan: Flashcards Endpoints

## 1. Przegląd punktu końcowego

Zestaw pięciu endpointów REST API do zarządzania fiszkami użytkowników:

- **GET /api/flashcards** - pobieranie paginowanej listy fiszek z filtrowaniem i sortowaniem
- **GET /api/flashcards/:id** - pobieranie pojedynczej fiszki
- **POST /api/flashcards** - tworzenie jednej lub wielu fiszek (manualne lub z generacji AI)
- **PATCH /api/flashcards/:id** - aktualizacja istniejącej fiszki
- **DELETE /api/flashcards/:id** - usuwanie fiszki

Wszystkie endpointy wymagają autentykacji przez Bearer token. RLS w bazie danych zapewnia, że użytkownicy mają dostęp tylko do swoich fiszek.

## 2. Szczegóły żądania

### GET /api/flashcards

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards`
- **Parametry**:
  - Opcjonalne: `page` (integer, default: 1), `limit` (integer, default: 20, max: 100), `status` (string: `new`, `learning`, `review`, `mastered`), `source` (string: `manual`, `ai`, `mixed`), `sort` (string, default: `created_at`: `created_at`, `updated_at`, `repetition_count`), `order` (string, default: `desc`: `asc`, `desc`)
- **Request Body**: Brak

### GET /api/flashcards/:id

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards/:id`
- **Parametry**: `id` (integer, wymagany w URL)
- **Request Body**: Brak

### POST /api/flashcards

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Parametry**: Brak parametrów URL
- **Request Body**: Pojedynczy obiekt lub tablica obiektów:
  ```json
  {
    "front": "string (max 200 znaków)",
    "back": "string (max 500 znaków)",
    "source": "manual | ai | mixed (opcjonalne, default: manual)",
    "generation_id": "number | null (opcjonalne, dla fiszek z generacji AI)"
  }
  ```

### PATCH /api/flashcards/:id

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/flashcards/:id`
- **Parametry**: `id` (integer, wymagany w URL)
- **Request Body**: Wszystkie pola opcjonalne:
  ```json
  {
    "front": "string (max 200 znaków)",
    "back": "string (max 500 znaków)",
    "status": "new | learning | review | mastered",
    "source": "manual | ai | mixed",
    "repetition_count": "integer (min: 0)"
  }
  ```

### DELETE /api/flashcards/:id

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/flashcards/:id`
- **Parametry**: `id` (integer, wymagany w URL)
- **Request Body**: Brak

**Nagłówek autoryzacji**: `Authorization: Bearer <supabase_jwt_token>` (wymagany dla wszystkich endpointów)

## 3. Wykorzystywane typy

- `FlashcardDTO`: Pełny DTO fiszki
- `CreateFlashcardCommand`: `{ front: string, back: string, source?: FlashcardSource, generation_id?: number | null }`
- `CreateFlashcardsCommand`: Pojedynczy obiekt lub tablica `CreateFlashcardCommand`
- `UpdateFlashcardCommand`: `{ front?: string, back?: string, status?: FlashcardStatus, source?: FlashcardSource, repetition_count?: number }`
- `DeleteFlashcardResponse`: `{ message: string, id: number }`
- `PaginatedFlashcardsResponse`: `{ data: FlashcardDTO[], pagination: PaginationMeta }`
- `FlashcardQueryParams`: Parametry zapytania dla GET /api/flashcards
- `ErrorResponse`: `{ error: { code: string, message: string, details?: Record<string, unknown> } }`

**Uwaga**: `generation_id` jest opcjonalne i powinno odnosić się do istniejącej generacji lub być null. Przy tworzeniu fiszek z `generation_id` należy zaktualizować statystyki generacji (zwiększyć `accepted_unedited_count` dla `source: 'ai'` lub `accepted_edited_count` dla `source: 'mixed'`).

## 4. Szczegóły odpowiedzi

### GET /api/flashcards (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "user_id": "uuid",
      "generation_id": 123,
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces",
      "source": "ai",
      "status": "new",
      "repetition_count": 0,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### GET /api/flashcards/:id (200 OK)

```json
{
  "id": 1,
  "user_id": "uuid",
  "generation_id": 123,
  "front": "What is React?",
  "back": "A JavaScript library for building user interfaces",
  "source": "ai",
  "status": "new",
  "repetition_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### POST /api/flashcards (201 Created)

- If single flashcard was created:

```json
{
  "id": 2,
  "user_id": "uuid",
  "generation_id": null,
  "front": "What is TypeScript?",
  "back": "A typed superset of JavaScript that compiles to plain JavaScript",
  "source": "manual",
  "status": "new",
  "repetition_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

- If multiple flashcards were created:

```json
[
  {
    "id": 2,
    "user_id": "uuid",
    "generation_id": null,
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual",
    "status": "new",
    "repetition_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 3,
    "user_id": "uuid",
    "generation_id": 132,
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces",
    "source": "ai",
    "status": "new",
    "repetition_count": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### PATCH /api/flashcards/:id (200 OK)

```json
{
  "id": 1,
  "user_id": "uuid",
  "generation_id": 123,
  "front": "Updated question?",
  "back": "Updated answer",
  "source": "mixed",
  "status": "learning",
  "repetition_count": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T01:00:00Z"
}
```

### DELETE /api/flashcards/:id (200 OK)

```json
{
  "message": "Flashcard deleted successfully",
  "id": 1
}
```

**Kody błędów**: 400, 401, 404, 500

## 5. Przepływ danych

1. **GET /flashcards**: Walidacja parametrów → Filtrowanie + sortowanie + paginacja → Pobranie z bazy → Formatowanie odpowiedzi
2. **GET /flashcards/:id**: Walidacja ID → Pobranie rekordu → Sprawdzenie własności → Zwrot danych
3. **POST /flashcards**: Walidacja body → Parsowanie (pojedynczy obiekt lub tablica) → Zapis do bazy → Zwrot utworzonych fiszek
4. **PATCH /flashcards/:id**: Walidacja ID i body → Aktualizacja rekordu → Sprawdzenie własności → Zwrot zaktualizowanych danych
5. **DELETE /flashcards/:id**: Walidacja ID → Usunięcie rekordu → Sprawdzenie własności → Zwrot potwierdzenia

## 6. Względy bezpieczeństwa

- **Autoryzacja**: JWT token validation przez Supabase
- **Autoryzacja**: RLS policies zapewniają dostęp tylko do własnych danych
- **Walidacja inputu**: Zod schemas dla wszystkich danych wejściowych
- **Sanityzacja**: Limity długości stringów (front: 200, back: 500) zapobiegają abuse
- **Error handling**: Bezpieczne logowanie błędów bez ujawniania wrażliwych danych
- **SQL Injection**: Supabase client używa prepared statements, automatyczna ochrona

## 7. Obsługa błędów

- **400 Bad Request**: Błąd walidacji (źle sformatowane dane, długość stringów poza zakresem, nieprawidłowe enum values)
- **401 Unauthorized**: Brak lub nieprawidłowy token JWT
- **404 Not Found**: Fiszka nie znaleziona lub brak dostępu
- **500 Internal Server Error**: Błąd bazy danych, błąd serwera

Wszystkie błędy zwracane w formacie `ErrorResponse` z odpowiednimi kodami błędów.

## 8. Rozważania dotyczące wydajności

- **Indeksy**: Indeksy na `user_id` i `generation_id` zapewniają szybkie zapytania
- **Paginacja**: Ograniczona do 100 rekordów na stronę
- **Connection pooling**: Wykorzystanie Supabase connection pooling
- **Async processing**: Wszystkie operacje I/O asynchroniczne
- **Batch operations**: POST z wieloma fiszkami używa batch insert w jednej transakcji
- **RLS**: Działa na poziomie bazy, nie wymaga dodatkowych zapytań

## 9. Kroki implementacji

1. **Zaimplementować Zod schemas** (`src/lib/validation/flashcard.ts`):
   - `flashcardQuerySchema` dla GET query parameters
   - `createFlashcardSchema` dla pojedynczej fiszki
   - `createFlashcardsSchema` dla pojedynczej lub tablicy fiszek
   - `updateFlashcardSchema` dla PATCH request body
   - `flashcardIdSchema` dla ID z path parameter

2. **Utworzyć service layer** (`src/lib/services/flashcard.service.ts`):
   - `getFlashcards()` - paginacja z filtrowaniem i sortowaniem
   - `getFlashcardById()` - pojedynczy rekord
   - `createFlashcards()` - tworzenie jednej lub wielu fiszek
   - `updateFlashcard()` - aktualizacja fiszki
   - `deleteFlashcard()` - usuwanie fiszki

3. **Utworzyć API endpoints** (`src/pages/api/`):
   - `flashcards.ts` - GET i POST /api/flashcards
   - `flashcards/[id].ts` - GET, PATCH i DELETE /api/flashcards/:id

4. **Dodać helper functions**:
   - `jsonResponse()` i `errorResponse()` (lub użyć istniejących z generations.ts)

5. **Zaktualizować types** (`src/types.ts`):
   - Zapewnić kompatybilność z bazą danych (typy już istnieją)

6. **Przetestować integrację**:
   - Sprawdzić, że RLS działa poprawnie
   - Zweryfikować walidację dla wszystkich edge cases
   - Przetestować wszystkie endpointy

7. **Dodać dokumentację** (opcjonalnie):
   - Zaktualizować POSTMAN_REQUESTS.md z przykładami requestów
