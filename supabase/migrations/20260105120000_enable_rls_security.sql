-- ============================================================================
-- Migration: Enable RLS Security
-- Description: Re-enables Row Level Security and creates proper access policies
-- Purpose: Fix security vulnerability where users can access other users' data
-- Author: AI Assistant  
-- Date: 2025-01-05
-- Fixes: Issue where new users can see flashcards from other users
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on flashcards table
-- This ensures users can only access their own flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generations table  
-- This ensures users can only access their own generations
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on generation_error_logs table
-- This ensures users can only access their own error logs
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- ============================================================================
-- RLS Policies for: flashcards
-- ============================================================================

-- Policy: Users can only access their own flashcards
CREATE POLICY "Users can only access their own flashcards" ON flashcards
    FOR ALL 
    USING (auth.uid() = user_id);

-- Policy: Users can only insert flashcards for themselves
CREATE POLICY "Users can only create flashcards for themselves" ON flashcards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for: generations  
-- ============================================================================

-- Policy: Users can only access their own generations
CREATE POLICY "Users can only access their own generations" ON generations
    FOR ALL
    USING (auth.uid() = user_id);

-- Policy: Users can only insert generations for themselves
CREATE POLICY "Users can only create generations for themselves" ON generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS Policies for: generation_error_logs
-- ============================================================================

-- Policy: Users can only access their own error logs
CREATE POLICY "Users can only access their own error logs" ON generation_error_logs
    FOR ALL
    USING (auth.uid() = user_id);

-- Policy: Users can only insert error logs for themselves  
CREATE POLICY "Users can only create error logs for themselves" ON generation_error_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing after migration)
-- ============================================================================

-- Verify RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('flashcards', 'generations', 'generation_error_logs');

-- Verify policies exist
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('flashcards', 'generations', 'generation_error_logs');

-- ============================================================================
-- Migration complete
-- Note: RLS is now ENABLED with proper user isolation policies
-- Each user can only access their own data (flashcards, generations, error logs)
-- This fixes the security vulnerability where users could see other users' data
-- ============================================================================