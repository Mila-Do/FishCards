-- ============================================================================
-- SQL Queries do sprawdzenia danych użytkownika testowego
-- User ID: fc161727-fbda-42f5-bd8b-8a0d219e363b
-- ============================================================================

-- 1. Sprawdź wszystkie generacje użytkownika
SELECT 
    id,
    user_id,
    model,
    generated_count,
    accepted_unedited_count,
    accepted_edited_count,
    source_text_hash,
    source_text_length,
    generation_duration_ms,
    created_at,
    updated_at
FROM generations
WHERE user_id = 'fc161727-fbda-42f5-bd8b-8a0d219e363b'
ORDER BY created_at DESC;

-- 2. Sprawdź wszystkie fiszki użytkownika
SELECT 
    id,
    user_id,
    generation_id,
    front,
    back,
    source,
    status,
    repetition_count,
    created_at,
    updated_at
FROM flashcards
WHERE user_id = 'fc161727-fbda-42f5-bd8b-8a0d219e363b'
ORDER BY created_at DESC;

-- 3. Sprawdź logi błędów użytkownika
SELECT 
    id,
    user_id,
    model,
    source_text_hash,
    source_text_length,
    error_code,
    error_message,
    created_at
FROM generation_error_logs
WHERE user_id = 'fc161727-fbda-42f5-bd8b-8a0d219e363b'
ORDER BY created_at DESC;

-- 4. Podsumowanie - liczba rekordów dla użytkownika
SELECT 
    'generations' as tabela,
    COUNT(*) as liczba_rekordow
FROM generations
WHERE user_id = 'fc161727-fbda-42f5-bd8b-8a0d219e363b'
UNION ALL
SELECT 
    'flashcards' as tabela,
    COUNT(*) as liczba_rekordow
FROM flashcards
WHERE user_id = 'fc161727-fbda-42f5-bd8b-8a0d219e363b'
UNION ALL
SELECT 
    'generation_error_logs' as tabela,
    COUNT(*) as liczba_rekordow
FROM generation_error_logs
WHERE user_id = 'fc161727-fbda-42f5-bd8b-8a0d219e363b';

-- 5. Sprawdź fiszki powiązane z generacjami (JOIN)
SELECT 
    f.id as flashcard_id,
    f.front,
    f.back,
    f.source,
    f.status,
    g.id as generation_id,
    g.model,
    g.generated_count,
    g.created_at as generation_created_at
FROM flashcards f
LEFT JOIN generations g ON f.generation_id = g.id
WHERE f.user_id = 'fc161727-fbda-42f5-bd8b-8a0d219e363b'
ORDER BY f.created_at DESC;

