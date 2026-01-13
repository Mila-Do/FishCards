/**
 * Hook for managing dashboard statistics data
 * Fetches and aggregates data from multiple API endpoints for dashboard display
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useApiCall } from "./useApiCall";
import type { DashboardStats, PaginatedFlashcardsResponse, PaginatedGenerationsResponse } from "../../types";

interface UseDashboardStatsOptions {
  /** Enable automatic data fetching on mount */
  autoFetch?: boolean;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
  /** Callback for successful data fetch */
  onSuccess?: (stats: DashboardStats) => void;
  /** Callback for fetch errors */
  onError?: (error: string) => void;
}

interface DashboardStatsState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

// Cache for dashboard stats with TTL
interface CacheEntry {
  data: DashboardStats;
  timestamp: number;
}

let statsCache: CacheEntry | null = null;

/**
 * Clear the stats cache - useful for testing
 * @internal
 */
export function clearStatsCache() {
  statsCache = null;
}

export function useDashboardStats(options: UseDashboardStatsOptions = {}) {
  const {
    autoFetch = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<DashboardStatsState>({
    stats: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  // API call hooks for different endpoints
  const { execute: fetchFlashcards } = useApiCall<PaginatedFlashcardsResponse>();
  const { execute: fetchReviewFlashcards } = useApiCall<PaginatedFlashcardsResponse>();
  const { execute: fetchGenerations } = useApiCall<PaginatedGenerationsResponse>();

  // Check if cached data is still valid
  const isCacheValid = useMemo(() => {
    if (!statsCache) return false;
    return Date.now() - statsCache.timestamp < cacheTTL;
  }, [cacheTTL]);

  // Fetch dashboard statistics from multiple endpoints
  const fetchStats = useCallback(async (): Promise<DashboardStats | null> => {
    // Return cached data if valid
    if (isCacheValid && statsCache) {
      const cachedData = statsCache;
      setState((prev) => ({
        ...prev,
        stats: cachedData.data,
        loading: false,
        error: null,
        lastFetched: new Date(cachedData.timestamp),
      }));
      onSuccess?.(cachedData.data);
      return cachedData.data;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch data from multiple endpoints in parallel
      const [totalFlashcardsResult, reviewFlashcardsResult, generationsResult] = await Promise.all([
        // Get total flashcards count
        fetchFlashcards("/api/flashcards?page=1&limit=1"),
        // Get flashcards to review today
        fetchReviewFlashcards("/api/flashcards?status=review&page=1&limit=50"),
        // Get generations for AI acceptance rate
        fetchGenerations("/api/generations?page=1&limit=50"),
      ]);

      // Check if any request failed
      if (!totalFlashcardsResult.success) {
        throw new Error(totalFlashcardsResult.error || "Failed to fetch total flashcards");
      }
      if (!reviewFlashcardsResult.success) {
        throw new Error(reviewFlashcardsResult.error || "Failed to fetch review flashcards");
      }
      if (!generationsResult.success) {
        throw new Error(generationsResult.error || "Failed to fetch generations");
      }

      // Calculate AI acceptance rate
      const generations = generationsResult.data.data;
      let aiAcceptanceRate = 0;

      if (generations.length > 0) {
        const totalGenerated = generations.reduce((sum, gen) => sum + gen.generated_count, 0);
        const totalAccepted = generations.reduce(
          (sum, gen) => sum + gen.accepted_unedited_count + gen.accepted_edited_count,
          0
        );

        aiAcceptanceRate = totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 100) : 0;
      }

      // Find last activity date
      const lastActivityDate =
        generations.length > 0
          ? new Date(Math.max(...generations.map((g) => new Date(g.created_at).getTime())))
          : undefined;

      // Construct dashboard stats
      const stats: DashboardStats = {
        flashcardsToReviewToday: reviewFlashcardsResult.data.pagination.total,
        totalFlashcards: totalFlashcardsResult.data.pagination.total,
        aiAcceptanceRate,
        totalGenerations: generationsResult.data.pagination.total,
        lastActivityDate,
      };

      // Update cache
      statsCache = {
        data: stats,
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        stats,
        loading: false,
        error: null,
        lastFetched: new Date(),
      }));

      onSuccess?.(stats);
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard stats";

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);
      return null;
    }
  }, [fetchFlashcards, fetchReviewFlashcards, fetchGenerations, isCacheValid]); // Removed onSuccess, onError from deps to stabilize

  // Refresh stats (bypass cache)
  const refetchStats = useCallback(async () => {
    // Clear cache to force fresh fetch
    statsCache = null;
    return await fetchStats();
  }, [fetchStats]);

  // Auto-fetch on mount - removed fetchStats from dependencies to prevent infinite loop
  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch]); // Only depend on autoFetch, fetchStats is stable due to useCallback

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      // Don't clear cache on unmount to preserve data across navigation
      // Cache will expire based on TTL
    };
  }, []);

  return {
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    lastFetched: state.lastFetched,
    fetchStats,
    refetchStats,
    isCached: isCacheValid && statsCache !== null,
  };
}
