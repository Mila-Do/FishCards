# OpenRouter Service - Plan Implementacji

## 1. Opis Usługi

Usługa OpenRouter zapewnia type-safe komunikację z OpenRouter API dla chat completions z obsługą structured outputs (JSON Schema), system messages i parametrów modelu.

## 2. Konstruktor

```typescript
class OpenRouterService {
  constructor(config: {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
    timeout?: number;
  })
}
```

**Konfiguracja:**
- `apiKey` - klucz API z zmiennych środowiskowych
- `baseURL` - domyślnie `https://openrouter.ai/api/v1`
- `defaultModel` - domyślny model (np. `gpt-3.5-turbo`)
- `timeout` - timeout requestów (domyślnie 30s)

## 3. Publiczne Metody

### 3.1 Główna Metoda Chat
```typescript
async chatCompletion<T = any>(request: {
  messages: ChatMessage[];
  responseSchema?: JSONSchema;
  model?: string;
  modelParams?: ModelParameters;
}): Promise<T>
```

### 3.2 Helper Methods
- `createSystemMessage(content: string): ChatMessage`
- `createUserMessage(content: string): ChatMessage`
- `validateSchema(data: any, schema: JSONSchema): boolean`

## 4. Prywatne Metody

- `buildRequest()` - konstrukcja request body
- `executeRequest()` - HTTP call z retry logic
- `parseResponse()` - parsing i walidacja odpowiedzi
- `handleError()` - obsługa błędów API

## 5. Obsługa Błędów

### 5.1 Custom Error Types
```typescript
class OpenRouterError extends Error
class ValidationError extends OpenRouterError
class RateLimitError extends OpenRouterError
class ModelNotSupportedError extends OpenRouterError
```

### 5.2 Scenariusze Błędów
1. Błędny API key (401)
2. Rate limiting (429) - retry z backoff
3. Model nie obsługuje structured outputs (400)
4. Błędny JSON schema (400)
5. Timeout requestu
6. Network errors - retry logic

## 6. Kwestie Bezpieczeństwa

1. **API Key Storage**: Przechowywanie w zmiennych środowiskowych
2. **Request Validation**: Walidacja inputów przed wysłaniem
3. **Response Sanitization**: Sanityzacja odpowiedzi
4. **Rate Limiting**: Implementacja client-side rate limiting
5. **Logging**: Logowanie bez wrażliwych danych

## 7. Plan Wdrożenia

### Krok 1: Podstawowa Struktura
- Utwórz `src/lib/services/openrouter.service.ts`
- Zdefiniuj typy w `src/types.ts`
- Dodaj zmienne środowiskowe

### Krok 2: Core Functionality  
- Implementuj konstruktor i konfigurację
- Stwórz metodę `chatCompletion()`
- Dodaj obsługę HTTP requests

### Krok 3: JSON Schema Support
```typescript
// Przykład response_format
const responseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'flashcard_generation',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' }
            },
            required: ['front', 'back']
          }
        }
      },
      required: ['flashcards']
    }
  }
}
```

### Krok 4: Error Handling
- Implementuj custom error classes
- Dodaj retry logic dla transient errors
- Stwórz comprehensive error mapping

### Krok 5: Integration
- Połącz z istniejącymi API endpoints
- Dodaj do `src/lib/hooks/useGenerationsApi.ts`
- Uaktualnij typy w całym projekcie

### Krok 6: Testing & Validation
- Unit testy dla core functionality
- Integration testy z OpenRouter API
- Walidacja różnych modeli i schematów

### Przykład Użycia
```typescript
const openRouter = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!
});

const result = await openRouter.chatCompletion({
  messages: [
    openRouter.createSystemMessage("Jesteś ekspertem od fiszek"),
    openRouter.createUserMessage("Wygeneruj fiszki z tematu: React Hooks")
  ],
  responseSchema: flashcardSchema,
  model: "gpt-4",
  modelParams: { 
    temperature: 0.7,
    max_tokens: 1000 
  }
});
```

## Struktura Plików
```
src/lib/services/
├── openrouter.service.ts    # główna implementacja
├── openrouter.types.ts      # typy specyficzne dla OpenRouter
└── openrouter.errors.ts     # custom error classes
```