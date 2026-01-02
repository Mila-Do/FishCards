/**
 * Hook for managing flashcards filtering and sorting
 * Handles filter state and sort operations
 */

import { useState, useCallback } from "react";
import type { FlashcardFilters, FlashcardSortState, FlashcardSortField } from "../types";

const DEFAULT_FILTERS: FlashcardFilters = {
  status: null,
  source: null,
};

const DEFAULT_SORT: FlashcardSortState = {
  field: "created_at",
  order: "desc",
};

export function useFlashcardsFilters() {
  const [filters, setFilters] = useState<FlashcardFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<FlashcardSortState>(DEFAULT_SORT);

  // Apply new filters
  const applyFilters = useCallback((newFilters: FlashcardFilters) => {
    setFilters(newFilters);
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Apply sort and toggle order if same field
  const applySort = useCallback((field: FlashcardSortField) => {
    setSort((prevSort) => {
      const newOrder = prevSort.field === field && prevSort.order === "desc" ? "asc" : "desc";
      return { field, order: newOrder };
    });
  }, []);

  // Reset sort to default
  const resetSort = useCallback(() => {
    setSort(DEFAULT_SORT);
  }, []);

  // Check if filters are active (not default)
  const hasActiveFilters = filters.status !== null || filters.source !== null;

  // Check if sort is default
  const isDefaultSort = sort.field === DEFAULT_SORT.field && sort.order === DEFAULT_SORT.order;

  return {
    filters,
    sort,
    hasActiveFilters,
    isDefaultSort,
    actions: {
      applyFilters,
      resetFilters,
      applySort,
      resetSort,
    },
  };
}
