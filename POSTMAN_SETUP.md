# Konfiguracja Postmana

## Podstawowe informacje

- **Base URL aplikacji**: `http://localhost:3000`
- **Supabase URL**: `http://127.0.0.1:54321`
- **Supabase Anon Key**: `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`
- **User ID testowy**: `fc161727-fbda-42f5-bd8b-8a0d219e363b`

## Krok 1: Uzyskanie tokena autoryzacyjnego

Aby uzyskać token JWT dla użytkownika testowego, masz kilka opcji:

### Opcja A: Logowanie przez Supabase Auth API (jeśli znasz hasło użytkownika)

**Request:**

- **Method**: `POST`
- **URL**: `http://127.0.0.1:54321/auth/v1/token?grant_type=password`
- **Headers**:
  - `apikey`: `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):

```json
{
  "email": "user02@gmail.com",
  "password": "twoje-haslo"
}
```

**Response** zawiera pole `access_token` - skopiuj ten token i wklej do zmiennej `auth_token` w Postmanie.

**Uwaga**: Jeśli nie znasz hasła, użyj Opcji B lub C.

### Opcja B: Użycie istniejącego tokena z przeglądarki

Jeśli już się logowałeś w aplikacji:

1. Otwórz DevTools (F12)
2. Przejdź do zakładki Application/Storage
3. Znajdź Local Storage dla `http://localhost:3000`
4. Szukaj klucza zawierającego `supabase.auth.token`
5. Skopiuj wartość `access_token` z tego obiektu

### Opcja C: Wygenerowanie tokena przez Admin API (jeśli masz service_role key)

**Request:**

- **Method**: `POST`
- **URL**: `http://127.0.0.1:54321/auth/v1/admin/users/fc161727-fbda-42f5-bd8b-8a0d219e363b/tokens`
- **Headers**:
  - `apikey`: `sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz`
  - `Authorization`: `Bearer sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz`
  - `Content-Type`: `application/json`

**Uwaga**: Ta metoda wymaga service_role key i może nie działać w zależności od konfiguracji Supabase.

## Krok 2: Konfiguracja zmiennych w Postmanie

1. W Postmanie kliknij **Environments** (lub ikonę koła zębatego)
2. Utwórz nowe środowisko lub edytuj istniejące
3. Dodaj następujące zmienne:

| Variable       | Initial Value                                    | Current Value                                    |
| -------------- | ------------------------------------------------ | ------------------------------------------------ |
| `base_url`     | `http://localhost:3000`                          | `http://localhost:3000`                          |
| `supabase_url` | `http://127.0.0.1:54321`                         | `http://127.0.0.1:54321`                         |
| `supabase_key` | `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` | `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` |
| `auth_token`   | _(wklej tutaj token z kroku 1)_                  | _(wklej tutaj token z kroku 1)_                  |

## Krok 3: Konfiguracja requestów API

### 1. GET /api/generations - Lista generacji

**Request:**

- **Method**: `GET`
- **URL**: `{{base_url}}/api/generations`
- **Headers**:
  - `Authorization`: `Bearer {{auth_token}}`
- **Query Params** (opcjonalne):
  - `page`: `1` (domyślnie)
  - `limit`: `20` (domyślnie, max 100)
  - `sort`: `created_at` lub `updated_at`
  - `order`: `asc` lub `desc`

**Przykład z parametrami:**

```
{{base_url}}/api/generations?page=1&limit=20&sort=created_at&order=desc
```

### 2. POST /api/generations - Utworzenie nowej generacji

**Request:**

- **Method**: `POST`
- **URL**: `{{base_url}}/api/generations`
- **Headers**:
  - `Authorization`: `Bearer {{auth_token}}`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):

```json
{
  "source_text": "Tutaj wklej tekst źródłowy (min 1000, max 10000 znaków). Tekst powinien być wystarczająco długi, aby spełnić wymagania walidacji. Przykładowy tekst źródłowy do generacji fiszek. Musi mieć co najmniej 1000 znaków, więc dodaję więcej treści tutaj..."
}
```

**Wymagania:**

- `source_text`: string, min 1000 znaków, max 10000 znaków

### 3. GET /api/generations/:id - Pojedyncza generacja

**Request:**

- **Method**: `GET`
- **URL**: `{{base_url}}/api/generations/1` (zastąp `1` ID generacji)
- **Headers**:
  - `Authorization`: `Bearer {{auth_token}}`

**Przykład:**

```
{{base_url}}/api/generations/123
```

### 4. GET /api/generation-error-logs - Logi błędów generacji

**Request:**

- **Method**: `GET`
- **URL**: `{{base_url}}/api/generation-error-logs`
- **Headers**:
  - `Authorization`: `Bearer {{auth_token}}`
- **Query Params** (opcjonalne):
  - `page`: `1` (domyślnie)
  - `limit`: `20` (domyślnie, max 100)

**Przykład z parametrami:**

```
{{base_url}}/api/generation-error-logs?page=1&limit=20
```

## Format odpowiedzi błędów

Wszystkie błędy zwracają ten sam format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Opis błędu",
    "details": {
      // Opcjonalne szczegóły
    }
  }
}
```

**Kody błędów:**

- `UNAUTHORIZED` (401) - Brak lub nieprawidłowy token
- `VALIDATION_ERROR` (400) - Nieprawidłowe dane wejściowe
- `NOT_FOUND` (404) - Zasób nie znaleziony
- `RATE_LIMIT_EXCEEDED` (429) - Przekroczony limit zapytań
- `AI_API_ERROR` (502) - Błąd API AI
- `DATABASE_ERROR` (500) - Błąd bazy danych
- `INTERNAL_SERVER_ERROR` (500) - Błąd serwera

## Uwagi

1. **Token wygasa**: Token JWT wygasa po 1 godzinie (3600 sekund). Jeśli otrzymasz błąd 401, odśwież token.
2. **Port serwera**: Upewnij się, że serwer Astro działa na porcie 3000 (`npm run dev`)
3. **Supabase lokalny**: Upewnij się, że lokalny Supabase działa (`supabase start`)
