# Gotowe requesty do Postmana

## 📋 Szybki start - co gdzie wpisać

### 1. Zmienne środowiskowe w Postmanie

Utwórz nowe środowisko w Postmanie i dodaj:

| Variable       | Initial Value                                    | Current Value                                    |
| -------------- | ------------------------------------------------ | ------------------------------------------------ |
| `base_url`     | `http://localhost:3000`                          | `http://localhost:3000`                          |
| `supabase_url` | `http://127.0.0.1:54321`                         | `http://127.0.0.1:54321`                         |
| `supabase_key` | `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` | `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` |
| `auth_token`   | _(puste na początku)_                            | _(wkleisz token później)_                        |

---

## 🔑 KROK 1: Uzyskanie tokena

### Metoda 1: Logowanie przez Supabase Auth API

**Request:**

- **Nazwa**: `Login - Get Token`
- **Method**: `POST`
- **URL**: `http://127.0.0.1:54321/auth/v1/token?grant_type=password`

**Headers:**

```
apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "user02@gmail.com",
  "password": "TWOJE_HASLO_TUTAJ"
}
```

**Response** - skopiuj wartość `access_token` i wklej do zmiennej `auth_token` w Postmanie.

---

### Metoda 2: Z przeglądarki (jeśli już się logowałeś)

1. Otwórz aplikację w przeglądarce: `http://localhost:3000`
2. Zaloguj się jako `user02@gmail.com`
3. Otwórz DevTools (F12)
4. Przejdź do zakładki **Application** (Chrome) lub **Storage** (Firefox)
5. W lewym panelu wybierz **Local Storage** → `http://localhost:3000`
6. Znajdź klucz zawierający `supabase.auth.token`
7. Skopiuj wartość `access_token` z tego obiektu JSON
8. Wklej do zmiennej `auth_token` w Postmanie

---

## 📡 KROK 2: Requesty API

### 1. GET /api/generations - Lista generacji

**Request:**

- **Nazwa**: `GET Generations`
- **Method**: `GET`
- **URL**: `{{base_url}}/api/generations`

**Headers:**

```
Authorization: Bearer {{auth_token}}
```

**Query Params** (opcjonalne - dodaj w zakładce Params):

- `page`: `1`
- `limit`: `20`
- `sort`: `created_at`
- `order`: `desc`

**Przykład pełnego URL z parametrami:**

```
{{base_url}}/api/generations?page=1&limit=20&sort=created_at&order=desc
```

---

### 2. POST /api/generations - Utworzenie nowej generacji

**Request:**

- **Nazwa**: `POST Create Generation`
- **Method**: `POST`
- **URL**: `{{base_url}}/api/generations`

**Headers:**

```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "source_text": "To jest przykładowy tekst źródłowy do generacji fiszek. Tekst musi mieć co najmniej 1000 znaków, więc dodaję tutaj więcej treści. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"
}
```

**Wymagania:**

- `source_text`: string, **min 1000 znaków**, max 10000 znaków

---

### 3. GET /api/generations/:id - Pojedyncza generacja

**Request:**

- **Nazwa**: `GET Generation by ID`
- **Method**: `GET`
- **URL**: `{{base_url}}/api/generations/1`

**Headers:**

```
Authorization: Bearer {{auth_token}}
```

**Uwaga**: Zastąp `1` w URL rzeczywistym ID generacji (np. `123`).

**Przykład:**

```
{{base_url}}/api/generations/123
```

---

### 4. GET /api/generation-error-logs - Logi błędów

**Request:**

- **Nazwa**: `GET Generation Error Logs`
- **Method**: `GET`
- **URL**: `{{base_url}}/api/generation-error-logs`

**Headers:**

```
Authorization: Bearer {{auth_token}}
```

**Query Params** (opcjonalne - dodaj w zakładce Params):

- `page`: `1`
- `limit`: `20`

**Przykład pełnego URL z parametrami:**

```
{{base_url}}/api/generation-error-logs?page=1&limit=20
```

---

## ⚠️ Ważne informacje

1. **Token wygasa**: Token JWT wygasa po 1 godzinie. Jeśli otrzymasz błąd `401 Unauthorized`, odśwież token (zaloguj się ponownie).

2. **Port serwera**: Upewnij się, że:
   - Serwer Astro działa: `npm run dev` (port 3000)
   - Supabase działa lokalnie: `supabase status` (port 54321)

3. **Format błędów**: Wszystkie błędy zwracają format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Opis błędu",
    "details": {}
  }
}
```

4. **Kody błędów**:
   - `401` - UNAUTHORIZED (brak lub nieprawidłowy token)
   - `400` - VALIDATION_ERROR (nieprawidłowe dane)
   - `404` - NOT_FOUND (zasób nie znaleziony)
   - `429` - RATE_LIMIT_EXCEEDED (przekroczony limit)
   - `500` - INTERNAL_SERVER_ERROR (błąd serwera)

---

## 🎯 Szybka konfiguracja - krok po kroku

1. **Utwórz środowisko** w Postmanie z zmiennymi powyżej
2. **Zaloguj się** przez request "Login - Get Token" (lub użyj tokena z przeglądarki)
3. **Skopiuj `access_token`** z odpowiedzi i wklej do zmiennej `auth_token`
4. **Wybierz środowisko** w Postmanie (prawy górny róg)
5. **Wyślij requesty** API używając zmiennych `{{base_url}}` i `{{auth_token}}`

---

## 📝 Przykładowe odpowiedzi

### Sukces - GET /api/generations

```json
{
  "data": [
    {
      "id": 1,
      "user_id": "fc161727-fbda-42f5-bd8b-8a0d219e363b",
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
    "total": 1,
    "total_pages": 1
  }
}
```

### Błąd - 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```
