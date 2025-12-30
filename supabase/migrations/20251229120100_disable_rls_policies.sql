-- ============================================================================
-- Migration: Disable RLS Policies
-- Description: Drops all RLS policies from flashcards, generations, and generation_error_logs tables
-- Author: AI Assistant
-- Date: 2025-12-29
-- ============================================================================

-- ============================================================================
-- DROP RLS POLICIES FOR: flashcards
-- ============================================================================

-- Drop policies for authenticated users
drop policy if exists "flashcards_select_own_authenticated" on flashcards;
drop policy if exists "flashcards_insert_own_authenticated" on flashcards;
drop policy if exists "flashcards_update_own_authenticated" on flashcards;
drop policy if exists "flashcards_delete_own_authenticated" on flashcards;

-- Drop policies for anonymous users
drop policy if exists "flashcards_select_deny_anon" on flashcards;
drop policy if exists "flashcards_insert_deny_anon" on flashcards;
drop policy if exists "flashcards_update_deny_anon" on flashcards;
drop policy if exists "flashcards_delete_deny_anon" on flashcards;

-- ============================================================================
-- DROP RLS POLICIES FOR: generations
-- ============================================================================

-- Drop policies for authenticated users
drop policy if exists "generations_select_own_authenticated" on generations;
drop policy if exists "generations_insert_own_authenticated" on generations;
drop policy if exists "generations_update_own_authenticated" on generations;
drop policy if exists "generations_delete_own_authenticated" on generations;

-- Drop policies for anonymous users
drop policy if exists "generations_select_deny_anon" on generations;
drop policy if exists "generations_insert_deny_anon" on generations;
drop policy if exists "generations_update_deny_anon" on generations;
drop policy if exists "generations_delete_deny_anon" on generations;

-- ============================================================================
-- DROP RLS POLICIES FOR: generation_error_logs
-- ============================================================================

-- Drop policies for authenticated users
drop policy if exists "generation_error_logs_select_own_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_insert_own_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_update_own_authenticated" on generation_error_logs;
drop policy if exists "generation_error_logs_delete_own_authenticated" on generation_error_logs;

-- Drop policies for anonymous users
drop policy if exists "generation_error_logs_select_deny_anon" on generation_error_logs;
drop policy if exists "generation_error_logs_insert_deny_anon" on generation_error_logs;
drop policy if exists "generation_error_logs_update_deny_anon" on generation_error_logs;
drop policy if exists "generation_error_logs_delete_deny_anon" on generation_error_logs;

-- ============================================================================
-- Migration complete
-- Note: RLS is still ENABLED on these tables, but no policies exist
-- This means NO ONE can access the data until new policies are created
-- or RLS is disabled with: ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- ============================================================================

