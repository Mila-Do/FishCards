# Schemat bazy danych PostgreSQL – 10x-cards

## 1. Tabele

### 1.1. Tabela `users` (zarządzana przez Supabase Auth)

Tabela użytkowników jest zarządzana automatycznie przez Supabase Auth w schemacie `auth`. Nie tworzymy jej ręcznie, ale odwołujemy się do niej poprzez `auth.users`.

```sql
-- Tabela zarządzana przez Supabase Auth (auth.users)
-- Kluczowe kolumny:
--   id UUID PRIMARY KEY
--   email TEXT
--   encrypted_password TEXT
--   created_at TIMESTAMPTZ
--   confirmed_at TIMESTAMPTZ
```

### 1.2. Tabela `flashcards`

Główna tabela przechowująca fiszki użytkowników.

```sql
CREATE TABLE flashcards (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_id BIGINT REFERENCES generations(id) ON DELETE SET NULL,
    front VARCHAR(200) NOT NULL,
    back VARCHAR(500) NOT NULL,
    source VARCHAR(10) NOT NULL DEFAULT 'manual',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    repetition_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    
    CONSTRAINT flashcards_source_check CHECK (source IN ('manual', 'ai', 'mixed')),
    CONSTRAINT flashcards_status_check CHECK (status IN ('new', 'learning', 'review', 'mastered')),
    CONSTRAINT flashcards_repetition_count_check CHECK (repetition_count >= 0)
);
```

### 1.3. Tabela `generations`

Tabela przechowująca informacje o sesjach generowania fiszek przez AI.

```sql
CREATE TABLE generations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    generated_count INTEGER NOT NULL DEFAULT 0,
    accepted_unedited_count INTEGER NOT NULL DEFAULT 0,
    accepted_edited_count INTEGER NOT NULL DEFAULT 0,
    source_text_hash VARCHAR(64) NOT NULL,
    source_text_length INTEGER NOT NULL,
    generation_duration INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT generations_generated_count_check CHECK (generated_count >= 0),
    CONSTRAINT generations_accepted_unedited_count_check CHECK (accepted_unedited_count >= 0),
    CONSTRAINT generations_accepted_edited_count_check CHECK (accepted_edited_count >= 0),
    CONSTRAINT generations_source_text_length_check CHECK (source_text_length > 0),
    CONSTRAINT generations_generation_duration_check CHECK (generation_duration >= 0)
);
```




### 1.4. Tabela `generation_error_logs`

Tabela przechowująca logi błędów podczas generowania fiszek.

```sql
CREATE TABLE generation_error_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    source_text_hash VARCHAR(64) NOT NULL,
    source_text_length INTEGER NOT NULL,
    error_code VARCHAR(50) NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT generation_error_logs_source_text_length_check CHECK (source_text_length > 0)
);
```




## 2. Relacje między tabelami

```
┌─────────────────┐       ┌─────────────────────────┐
│   auth.users    │       │      generations        │
│─────────────────│       │─────────────────────────│
│ id (PK)         │◄──┬───│ user_id (FK)            │
│ email           │   │   │ id (PK)                 │
│ ...             │   │   │ ...                     │
└─────────────────┘   │   └───────────┬─────────────┘
                      │               │
                      │               │ 1:N (opcjonalnie)
                      │               ▼
                      │   ┌─────────────────────────┐
                      │   │      flashcards         │
                      ├───│─────────────────────────│
                      │   │ id (PK)                 │
                      │   │ user_id (FK)            │
                      │   │ generation_id (FK, NULL)│
                      │   │ ...                     │
                      │   └─────────────────────────┘
                      │
                      │   ┌─────────────────────────┐
                      │   │  generation_error_logs  │
                      └───│─────────────────────────│
                          │ id (PK)                 │
                          │ user_id (FK)            │
                          │ ...                     │
                          └─────────────────────────┘
```

### Opis relacji:

| Relacja | Kardynalność | Opis |
|---------|--------------|------|
| auth.users → flashcards | 1:N | Jeden użytkownik może mieć wiele fiszek |
| auth.users → generations | 1:N | Jeden użytkownik może mieć wiele sesji generowania |
| auth.users → generation_error_logs | 1:N | Jeden użytkownik może mieć wiele logów błędów |
| generations → flashcards | 1:N (opcjonalnie) | Jedna sesja generowania może być powiązana z wieloma fiszkami (tylko dla fiszek AI) |

## 3. Indeksy

- index na kolumnie "user_id" w tabeli flashcards
- index na kolumnie "generation_id" w tabeli flashcards
- index na kolumnie "user_id" w tabeli generation
- index na kolumnie "user_id" w tabeli generation_error_logs




## 4. Zasady Row Level Security (RLS)

### 4.1. Włączenie RLS na tabelach
w tabeli flashcards, generation oraz generation_error_logs wdrożyć polityki RLS ktore pozwolą użytkowniko na dostęp tylko do rekordów, gdzie user_id odpowiada identyfikatorowi użytkownika z supabase.auth 


