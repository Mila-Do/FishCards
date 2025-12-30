-- ============================================================================
-- Migration: Disable RLS completely
-- Description: Disables Row Level Security on flashcards, generations, and generation_error_logs tables
-- Purpose: Allow unrestricted access for development/testing with dummy users
-- Author: AI Assistant
-- Date: 2025-12-29
-- WARNING: This should only be used in development. Re-enable RLS in production!
-- ============================================================================

-- ============================================================================
-- DISABLE ROW LEVEL SECURITY
-- ============================================================================

-- Disable RLS on flashcards table
-- All users (authenticated and anonymous) now have full access based on table permissions
alter table flashcards disable row level security;

-- Disable RLS on generations table
-- All users (authenticated and anonymous) now have full access based on table permissions
alter table generations disable row level security;

-- Disable RLS on generation_error_logs table
-- All users (authenticated and anonymous) now have full access based on table permissions
alter table generation_error_logs disable row level security;

-- ============================================================================
-- Migration complete
-- Note: RLS is now DISABLED - all authenticated users can access ALL data
-- This is suitable for development/testing but should be re-enabled in production
-- To re-enable: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- ============================================================================

