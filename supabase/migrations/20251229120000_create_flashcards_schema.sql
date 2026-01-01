-- ============================================================================
-- Migration: Create flashcards schema
-- Description: Creates core tables for FishCards flashcard application
-- Tables: generations, flashcards, generation_error_logs
-- Author: AI Assistant
-- Date: 2025-12-29
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: generations
-- Purpose: Stores information about AI-generated flashcard sessions
-- Dependencies: auth.users
-- ----------------------------------------------------------------------------
create table generations (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar(100) not null,
    generated_count integer not null default 0,
    accepted_unedited_count integer not null default 0,
    accepted_edited_count integer not null default 0,
    source_text_hash varchar(64) not null,
    source_text_length integer not null,
    generation_duration integer not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- Constraints to ensure data integrity
    constraint generations_generated_count_check check (generated_count >= 0),
    constraint generations_accepted_unedited_count_check check (accepted_unedited_count >= 0),
    constraint generations_accepted_edited_count_check check (accepted_edited_count >= 0),
    constraint generations_source_text_length_check check (source_text_length > 0),
    constraint generations_generation_duration_check check (generation_duration >= 0)
);

-- Add comment explaining the table purpose
comment on table generations is 'Stores metadata about AI flashcard generation sessions including model used, counts, and performance metrics';

-- ----------------------------------------------------------------------------
-- Table: flashcards
-- Purpose: Main table storing user flashcards (manual and AI-generated)
-- Dependencies: auth.users, generations
-- ----------------------------------------------------------------------------
create table flashcards (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    generation_id bigint references generations(id) on delete set null,
    front varchar(200) not null,
    back varchar(500) not null,
    source varchar(10) not null default 'manual',
    status varchar(20) not null default 'new',
    repetition_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- Constraints to ensure valid values
    constraint flashcards_source_check check (source in ('manual', 'ai', 'mixed')),
    constraint flashcards_status_check check (status in ('new', 'learning', 'review', 'mastered')),
    constraint flashcards_repetition_count_check check (repetition_count >= 0)
);

-- Add comment explaining the table purpose
comment on table flashcards is 'Main flashcard storage with support for manual and AI-generated cards, includes spaced repetition metadata';

-- ----------------------------------------------------------------------------
-- Table: generation_error_logs
-- Purpose: Logs errors that occur during AI flashcard generation
-- Dependencies: auth.users
-- ----------------------------------------------------------------------------
create table generation_error_logs (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model varchar(100) not null,
    source_text_hash varchar(64) not null,
    source_text_length integer not null,
    error_code varchar(50) not null,
    error_message text not null,
    created_at timestamptz not null default now(),
    
    -- Constraint to ensure valid input length
    constraint generation_error_logs_source_text_length_check check (source_text_length > 0)
);

-- Add comment explaining the table purpose
comment on table generation_error_logs is 'Logs errors during AI flashcard generation for debugging and monitoring';

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Index for filtering flashcards by user (most common query pattern)
create index idx_flashcards_user_id on flashcards(user_id);

-- Index for looking up flashcards by generation session
create index idx_flashcards_generation_id on flashcards(generation_id);

-- Index for filtering generations by user
create index idx_generations_user_id on generations(user_id);

-- Index for filtering error logs by user
create index idx_generation_error_logs_user_id on generation_error_logs(user_id);

-- Composite index for flashcard queries by user and status (common in spaced repetition)
create index idx_flashcards_user_status on flashcards(user_id, status);

-- Index for flashcard queries by user and creation date (for sorting)
create index idx_flashcards_user_created on flashcards(user_id, created_at desc);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables to ensure users can only access their own data
alter table flashcards enable row level security;
alter table generations enable row level security;
alter table generation_error_logs enable row level security;

-- ============================================================================
-- 4. CREATE RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies for: flashcards
-- Strategy: Users can only access their own flashcards
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to SELECT their own flashcards
create policy "flashcards_select_own_authenticated"
    on flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Policy: Allow authenticated users to INSERT their own flashcards
create policy "flashcards_insert_own_authenticated"
    on flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own flashcards
create policy "flashcards_update_own_authenticated"
    on flashcards
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own flashcards
create policy "flashcards_delete_own_authenticated"
    on flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Policy: Deny all access to anonymous users for SELECT
create policy "flashcards_select_deny_anon"
    on flashcards
    for select
    to anon
    using (false);

-- Policy: Deny all access to anonymous users for INSERT
create policy "flashcards_insert_deny_anon"
    on flashcards
    for insert
    to anon
    with check (false);

-- Policy: Deny all access to anonymous users for UPDATE
create policy "flashcards_update_deny_anon"
    on flashcards
    for update
    to anon
    using (false);

-- Policy: Deny all access to anonymous users for DELETE
create policy "flashcards_delete_deny_anon"
    on flashcards
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies for: generations
-- Strategy: Users can only access their own generation sessions
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to SELECT their own generations
create policy "generations_select_own_authenticated"
    on generations
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Policy: Allow authenticated users to INSERT their own generations
create policy "generations_insert_own_authenticated"
    on generations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own generations
create policy "generations_update_own_authenticated"
    on generations
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own generations
create policy "generations_delete_own_authenticated"
    on generations
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Policy: Deny all access to anonymous users for SELECT
create policy "generations_select_deny_anon"
    on generations
    for select
    to anon
    using (false);

-- Policy: Deny all access to anonymous users for INSERT
create policy "generations_insert_deny_anon"
    on generations
    for insert
    to anon
    with check (false);

-- Policy: Deny all access to anonymous users for UPDATE
create policy "generations_update_deny_anon"
    on generations
    for update
    to anon
    using (false);

-- Policy: Deny all access to anonymous users for DELETE
create policy "generations_delete_deny_anon"
    on generations
    for delete
    to anon
    using (false);

-- ----------------------------------------------------------------------------
-- RLS Policies for: generation_error_logs
-- Strategy: Users can only access their own error logs
-- ----------------------------------------------------------------------------

-- Policy: Allow authenticated users to SELECT their own error logs
create policy "generation_error_logs_select_own_authenticated"
    on generation_error_logs
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Policy: Allow authenticated users to INSERT their own error logs
create policy "generation_error_logs_insert_own_authenticated"
    on generation_error_logs
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to UPDATE their own error logs
-- Note: Updates to error logs should be rare, but included for completeness
create policy "generation_error_logs_update_own_authenticated"
    on generation_error_logs
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to DELETE their own error logs
create policy "generation_error_logs_delete_own_authenticated"
    on generation_error_logs
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Policy: Deny all access to anonymous users for SELECT
create policy "generation_error_logs_select_deny_anon"
    on generation_error_logs
    for select
    to anon
    using (false);

-- Policy: Deny all access to anonymous users for INSERT
create policy "generation_error_logs_insert_deny_anon"
    on generation_error_logs
    for insert
    to anon
    with check (false);

-- Policy: Deny all access to anonymous users for UPDATE
create policy "generation_error_logs_update_deny_anon"
    on generation_error_logs
    for update
    to anon
    using (false);

-- Policy: Deny all access to anonymous users for DELETE
create policy "generation_error_logs_delete_deny_anon"
    on generation_error_logs
    for delete
    to anon
    using (false);

-- ============================================================================
-- Migration complete
-- ============================================================================

