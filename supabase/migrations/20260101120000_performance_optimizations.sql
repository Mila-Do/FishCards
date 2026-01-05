-- ============================================================================
-- Migration: Performance Optimizations
-- Description: Adds additional indexes and optimizations for better query performance
-- Date: 2025-01-01
-- ============================================================================

-- ============================================================================
-- 1. ADDITIONAL INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================================================

-- Index for filtering flashcards by user, source, and status (common query patterns)
create index idx_flashcards_user_source_status on flashcards(user_id, source, status);

-- Index for filtering flashcards by user and updated_at (for recent activity queries)
create index idx_flashcards_user_updated on flashcards(user_id, updated_at desc);

-- Index for filtering flashcards by user and repetition_count (for spaced repetition queries)
create index idx_flashcards_user_repetition on flashcards(user_id, repetition_count);

-- Index for generations by user and created_at (for recent generations)
create index idx_generations_user_created on generations(user_id, created_at desc);

-- Index for generations by user and model (for model usage analytics)
create index idx_generations_user_model on generations(user_id, model);

-- Index for error logs by user and created_at (for recent errors)
create index idx_generation_error_logs_user_created on generation_error_logs(user_id, created_at desc);

-- ============================================================================
-- 2. PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Partial index for active flashcards (not mastered) - reduces index size
create index idx_flashcards_active on flashcards(user_id, updated_at desc)
where status != 'mastered';

-- Partial index for AI-generated flashcards
create index idx_flashcards_ai_generated on flashcards(user_id, generation_id, created_at desc)
where source = 'ai';

-- ============================================================================
-- 3. ANALYTICS INDEXES
-- ============================================================================

-- Index for generation statistics queries (accepted counts)
create index idx_generations_stats on generations(user_id, accepted_unedited_count, accepted_edited_count);

-- ============================================================================
-- Migration complete
-- Note: These indexes will improve query performance for:
-- - Filtering by multiple criteria (user + source + status)
-- - Sorting by recent activity (updated_at)
-- - Spaced repetition queries (repetition_count)
-- - Analytics and reporting queries
-- ============================================================================