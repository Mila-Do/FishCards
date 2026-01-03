/**
 * Hook for managing flashcards data fetching and pagination
 * Handles API calls for retrieving flashcards with filtering and sorting
 */

import { useState, useCallback, useEffect } from "react";
import { authenticatedFetch } from "../../../lib/auth-helper";
import type {
  FlashcardViewModel,
  FlashcardFilters,
  FlashcardSortState,
  PaginatedFlashcardsResponse,
  PaginationMeta,
  FlashcardQueryParams,
} from "../types";

interface UseFlashcardsDataState {
  flashcards: FlashcardViewModel[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
}

interface UseFlashcardsDataActions {
  fetchFlashcards: () => Promise<void>;
  changePage: (page: number) => void;
  resetPagination: () => void;
  refetch: () => Promise<void>;
}

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
};

export function useFlashcardsData(
  filters: FlashcardFilters,
  sort: FlashcardSortState
): UseFlashcardsDataState & { actions: UseFlashcardsDataActions } {
  const [state, setState] = useState<UseFlashcardsDataState>({
    flashcards: [],
    loading: false,
    error: null,
    pagination: DEFAULT_PAGINATION,
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<UseFlashcardsDataState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Build query parameters from current filters, sort, and pagination
  const buildQueryParams = useCallback(
    (page?: number): FlashcardQueryParams => {
      const params: FlashcardQueryParams = {
        page: page ?? state.pagination.page,
        limit: state.pagination.limit,
        sort: sort.field,
        order: sort.order,
      };

      // Add filters if set
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;

      return params;
    },
    [filters, sort, state.pagination]
  );

  // Fetch flashcards from API
  const fetchFlashcards = useCallback(
    async (page?: number) => {
      updateState({ loading: true, error: null });

      try {
        const params = buildQueryParams(page);
        const queryString = new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined && value !== null) {
                acc[key] = String(value);
              }
              return acc;
            },
            {} as Record<string, string>
          )
        ).toString();

        const response = await authenticatedFetch(`/api/flashcards?${queryString}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data: PaginatedFlashcardsResponse = await response.json();

        updateState({
          flashcards: data.data,
          pagination: data.pagination,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Błąd podczas pobierania fiszek";
        updateState({
          loading: false,
          error: errorMessage,
          flashcards: [],
        });
      }
    },
    [buildQueryParams, updateState]
  );

  // Change page and fetch new data
  const changePage = useCallback(
    async (page: number) => {
      if (page === state.pagination.page) return;

      updateState({
        pagination: { ...state.pagination, page },
      });

      await fetchFlashcards(page);
    },
    [state.pagination, updateState, fetchFlashcards]
  );

  // Reset pagination to first page
  const resetPagination = useCallback(() => {
    updateState({
      pagination: { ...state.pagination, page: 1 },
    });
  }, [state.pagination, updateState]);

  // Refetch current data (useful for refreshing after mutations)
  const refetch = useCallback(async () => {
    await fetchFlashcards();
  }, [fetchFlashcards]);

  // Effect to fetch data when filters or sort change
  useEffect(() => {
    fetchFlashcards();
  }, [filters, sort]); // Remove fetchFlashcards from dependencies to prevent infinite loop

  return {
    flashcards: state.flashcards,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    actions: {
      fetchFlashcards,
      changePage,
      resetPagination,
      refetch,
    },
  };
}
