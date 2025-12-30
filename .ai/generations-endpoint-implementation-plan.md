# API Endpoint Implementation Plan: Generations

## 1. Przegląd punktu końcowego
Endpointy `/api/generations` umożliwiają generowanie fiszek przez AI z wykorzystaniem OpenRouter.ai, zarządzanie historią generowania oraz obsługę błędów. Kluczowym aspektem jest to, że AI generuje propozycje fiszek, które wymagają akceptacji użytkownika przed zapisaniem do bazy danych.

## 2. Szczegóły żądania

### POST /api/generations
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/generations`
- **Parametry**: Brak parametrów URL
- **Request Body**:
  ```json
  {
    "source_text": "string (1000-10000 znaków)"
  }
  ```

### GET /api/generations
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/generations`
- **Parametry**:
  - Opcjonalne: `page` (integer, default: 1), `limit` (integer, default: 20, max: 100), `sort` (string, default: "created_at"), `order` (string, default: "desc")
- **Request Body**: Brak

### GET /api/generations/:id
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/generations/:id`
- **Parametry**: `id` (integer, wymagany w URL)
- **Request Body**: Brak

### GET /api/generation-error-logs
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/generation-error-logs`
- **Parametry**:
  - Opcjonalne: `page` (integer, default: 1), `limit` (integer, default: 20, max: 100)
- **Request Body**: Brak

**Nagłówek autoryzacji**: `Authorization: Bearer <supabase_jwt_token>` (wymagany dla wszystkich endpointów)

## 3. Wykorzystywane typy
- `CreateGenerationCommand`: `{ source_text: string }`
- `FlashcardProposal`: `{ front: string, back: string, source: "ai" }`
- `GenerationMetadata`: `{ generated_count: number, source_text_length: number, generation_duration_ms: number }`
- `GenerationProposalsResponse`: `{ generation_id: number, flashcardsProposals: FlashcardProposal[], metadata: GenerationMetadata }`
- `GenerationDTO`: Pełny DTO sesji generowania
- `GenerationErrorLogDTO`: DTO logów błędów
- `PaginatedGenerationsResponse`: `{ data: GenerationDTO[], pagination: PaginationMeta }`
- `PaginatedGenerationErrorLogsResponse`: `{ data: GenerationErrorLogDTO[], pagination: PaginationMeta }`
- `ErrorResponse`: `{ error: { code: string, message: string, details?: Record<string, unknown> } }`

## 4. Szczegóły odpowiedzi

### POST /api/generations (200 OK)
```json
{
  "generation_id": 123,
  "flashcardsProposals": [
    { "front": "Pytanie 1?", "back": "Odpowiedź 1", "source": "ai" }
  ],
  "metadata": {
    "generated_count": 2,
    "source_text_length": 5000,
    "generation_duration_ms": 2500
  }
}
```

### GET /api/generations (200 OK)
```json
{
  "data": [
    {
      "id": 123,
      "user_id": "uuid",
      "model": "openai/gpt-4o-mini",
      "generated_count": 10,
      "accepted_unedited_count": 7,
      "accepted_edited_count": 2,
      "source_text_hash": "abc123...",
      "source_text_length": 5000,
      "generation_duration_ms": 2500,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1
  }
}
```

**Kody błędów**: 400, 401, 429, 500, 502

## 5. Przepływ danych
1. **POST**: Walidacja → Hash tekstu źródłowego → Wywołanie OpenRouter.ai → Parsowanie odpowiedzi → Zapis rekordu generacji → Zwrot propozycji
2. **GET /generations**: Walidacja parametrów → Paginacja + sortowanie → Pobranie z bazy → Formatowanie odpowiedzi
3. **GET /generations/:id**: Walidacja ID → Pobranie rekordu → Sprawdzenie własności → Zwrot danych
4. **GET /generation-error-logs**: Paginacja → Pobranie logów błędów → Formatowanie odpowiedzi

## 6. Względy bezpieczeństwa
- **Autoryzacja**: JWT token validation przez Supabase
- **Autoryzacja**: RLS policies zapewniają dostęp tylko do własnych danych
- **Rate limiting**: Ograniczenie wywołań AI API (429)
- **Walidacja inputu**: Zod schemas dla wszystkich danych wejściowych
- **Sanityzacja**: Limity długości tekstu zapobiegają abuse
- **Error handling**: Bezpieczne logowanie błędów bez ujawniania wrażliwych danych

## 7. Obsługa błędów
- **400 Bad Request**: Błąd walidacji (źle sformatowane dane, długość tekstu poza zakresem)
- **401 Unauthorized**: Brak lub nieprawidłowy token JWT
- **404 Not Found**: Generacja nie znaleziona lub brak dostępu
- **429 Too Many Requests**: Przekroczony limit wywołań AI API
- **500 Internal Server Error**: Błąd AI API, błąd bazy danych, błąd serwera
- **502 Bad Gateway**: AI API niedostępne

Wszystkie błędy zwracane w formacie `ErrorResponse` z odpowiednimi kodami błędów.

## 8. Rozważania dotyczące wydajności
- **Cache**: Hash tekstu źródłowego umożliwia deduplikację
- **Paginacja**: Ograniczona do 100 rekordów na stronę
- **Timeout**: AI API wywołania z timeout protection
- **Connection pooling**: Wykorzystanie Supabase connection pooling
- **Async processing**: Wszystkie operacje I/O asynchroniczne
- **Memory limits**: Ograniczenie rozmiaru odpowiedzi AI

## 9. Kroki implementacji

1. **Utworzyć service layer** (`src/lib/services/generation.service.ts`):
   - `generateFlashcardsFromText()` - integracja z OpenRouter.ai
   - `createGenerationRecord()` - zapis do tabeli generations
   - `getGenerations()` - paginacja z sortowaniem
   - `getGenerationById()` - pojedynczy rekord
   - `logGenerationError()` - zapis błędów

2. **Zaimplementować Zod schemas** (`src/lib/validation/generation.ts`):
   - `createGenerationSchema` dla POST body
   - `generationQuerySchema` dla GET params
   - `generationErrorLogQuerySchema` dla error logs params

3. **Utworzyć API endpoints** (`src/pages/api/`):
   - `generations.ts` - POST i GET /api/generations
   - `generations/[id].ts` - GET /api/generations/:id
   - `generation-error-logs.ts` - GET /api/generation-error-logs

4. **Dodać middleware** (`src/middleware/index.ts`):
   - JWT token validation
   - Rate limiting dla AI wywołań

5. **Zaktualizować types** (`src/types.ts`):
   - Dodać brakujące typy jeśli potrzebne
   - Zapewnić kompatybilność z bazą danych

6. **Przetestować integrację**:
   - Unit tests dla service layer
   - Integration tests dla API endpoints
   - Error handling scenarios
   - Performance benchmarks

7. **Dodać monitoring**:
   - Logowanie wszystkich błędów AI API
   - Metrics dla czasu generowania
   - Rate limiting monitoring
