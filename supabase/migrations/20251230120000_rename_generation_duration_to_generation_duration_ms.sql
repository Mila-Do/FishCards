-- ============================================================================
-- Migration: Rename generations.generation_duration -> generations.generation_duration_ms
-- Description: Unifies naming to explicitly indicate milliseconds across DB + API
-- Date: 2025-12-30
-- ============================================================================

alter table generations
rename column generation_duration to generation_duration_ms;

alter table generations
rename constraint generations_generation_duration_check to generations_generation_duration_ms_check;


