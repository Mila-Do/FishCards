/**
 * Hook for managing flashcards data fetching, caching, and pagination
 * Separated from main state hook for better code organization
 */

import { useState, useCallback, useEffect } from "react";
import type {
  FlashcardViewModel,
  PaginatedFlashcardsResponse,
  FlashcardQueryParams,
  FlashcardFilters,
  FlashcardSortState,
  PaginationMeta,
} from "../types";

interface FlashcardsDataState {
  flashcards: FlashcardViewModel[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
}

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
};

export function useFlashcardsData(filters: FlashcardFilters, sort: FlashcardSortState) {
  const [state, setState] = useState<FlashcardsDataState>({
    flashcards: [],
    loading: false,
    error: null,
    pagination: DEFAULT_PAGINATION,
  });

  // Utility function to update state
  const updateState = useCallback((updates: Partial<FlashcardsDataState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Fetch flashcards from API with current filters and pagination
  const fetchFlashcards = useCallback(async () => {
    updateState({ loading: true, error: null });

    try {
      const params: FlashcardQueryParams = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        sort: sort.field,
        order: sort.order,
      };

      // Add filters if set
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;

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

      const response = await fetch(`/api/flashcards?${queryString}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.status}`);
      }

      const data: PaginatedFlashcardsResponse = await response.json();

      updateState({
        flashcards: data.data,
        pagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : "Błąd podczas pobierania fiszek",
      });
    }
  }, [state.pagination.page, state.pagination.limit, sort, filters, updateState]);

  // Change page and refresh data
  const changePage = useCallback(
    (page: number) => {
      updateState({
        pagination: { ...state.pagination, page },
      });
    },
    [state.pagination, updateState]
  );

  // Reset pagination to page 1 (used when filters change)
  const resetPagination = useCallback(() => {
    updateState({
      pagination: { ...state.pagination, page: 1 },
    });
  }, [state.pagination, updateState]);

  // Effect to fetch data when filters, sort, or pagination change
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return {
    ...state,
    actions: {
      fetchFlashcards,
      changePage,
      resetPagination,
    },
  };
}
