/**
 * Hook for managing flashcards filters and sorting
 * Handles filter state, sort state, and related operations
 */

import { useState, useCallback } from "react";
import type { FlashcardFilters, FlashcardSortState, FlashcardSortField } from "../types";

interface UseFlashcardsFiltersActions {
  applyFilters: (filters: FlashcardFilters) => void;
  clearFilters: () => void;
  applySort: (field: FlashcardSortField) => void;
  resetSort: () => void;
}

const DEFAULT_FILTERS: FlashcardFilters = {
  status: null,
  source: null,
  search: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  repetitionRange: undefined,
};

const DEFAULT_SORT: FlashcardSortState = {
  field: "created_at",
  order: "desc",
};

export function useFlashcardsFilters(): {
  filters: FlashcardFilters;
  sort: FlashcardSortState;
  actions: UseFlashcardsFiltersActions;
} {
  const [filters, setFilters] = useState<FlashcardFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<FlashcardSortState>(DEFAULT_SORT);

  // Apply new filters
  const applyFilters = useCallback((newFilters: FlashcardFilters) => {
    setFilters(newFilters);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Apply sort - toggle order if same field, otherwise use desc for new field
  const applySort = useCallback((field: FlashcardSortField) => {
    setSort((prevSort) => {
      if (prevSort.field === field) {
        // Toggle order if same field
        return {
          field,
          order: prevSort.order === "desc" ? "asc" : "desc",
        };
      } else {
        // New field, default to desc
        return {
          field,
          order: "desc",
        };
      }
    });
  }, []);

  // Reset sort to default
  const resetSort = useCallback(() => {
    setSort(DEFAULT_SORT);
  }, []);

  return {
    filters,
    sort,
    actions: {
      applyFilters,
      clearFilters,
      applySort,
      resetSort,
    },
  };
}
