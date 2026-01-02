/**
 * Barrel export for API hooks
 * Provides centralized access to all API-related hooks
 */

export { useApiCall } from "./useApiCall";
export { useFlashcardsApi } from "./useFlashcardsApi";
export { useGenerationsApi } from "./useGenerationsApi";

// Re-export types for convenience
export type { ApiResult } from "../types/common";
