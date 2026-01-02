/**
 * Main state management hook for flashcards view
 * Manages all state operations including fetching, filtering, sorting, and CRUD operations
 */

import { useState, useCallback, useEffect } from "react";
import type {
  FlashcardsViewState,
  FlashcardViewModel,
  FlashcardFilters,
  FlashcardSortField,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  PaginatedFlashcardsResponse,
  FlashcardQueryParams,
} from "../types";

const DEFAULT_STATE: FlashcardsViewState = {
  flashcards: [],
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
  filters: { status: null, source: null },
  sort: { field: "created_at", order: "desc" },
  modals: {
    isCreateModalOpen: false,
    isEditModalOpen: false,
    isDeleteDialogOpen: false,
    selectedFlashcard: null,
  },
  selectedCount: 0,
};

export function useFlashcardsState() {
  const [state, setState] = useState<FlashcardsViewState>(DEFAULT_STATE);

  // Utility function to update state
  const updateState = useCallback((updates: Partial<FlashcardsViewState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Fetch flashcards from API with current filters and pagination
  const fetchFlashcards = useCallback(async () => {
    updateState({ loading: true, error: null });

    try {
      const params: FlashcardQueryParams = {
        page: state.pagination.page,
        limit: state.pagination.limit,
        sort: state.sort.field,
        order: state.sort.order,
      };

      // Add filters if set
      if (state.filters.status) params.status = state.filters.status;
      if (state.filters.source) params.source = state.filters.source;

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
      // console.error("Error fetching flashcards:", error);
      updateState({
        loading: false,
        error: error instanceof Error ? error.message : "Błąd podczas pobierania fiszek",
      });
    }
  }, [state.pagination.page, state.pagination.limit, state.sort, state.filters, updateState]);

  // Create new flashcard
  const createFlashcard = useCallback(
    async (data: CreateFlashcardCommand): Promise<void> => {
      try {
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to create flashcard: ${response.status}`);
        }

        // Refresh the list after successful creation
        await fetchFlashcards();

        // Close create modal
        updateState({
          modals: {
            ...state.modals,
            isCreateModalOpen: false,
          },
        });
      } catch (error) {
        // console.error("Error creating flashcard:", error);
        updateState({
          error: error instanceof Error ? error.message : "Błąd podczas tworzenia fiszki",
        });
        throw error; // Re-throw so modal can handle the error
      }
    },
    [fetchFlashcards, state.modals, updateState]
  );

  // Update existing flashcard
  const updateFlashcard = useCallback(
    async (id: number, data: UpdateFlashcardCommand): Promise<void> => {
      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to update flashcard: ${response.status}`);
        }

        // Refresh the list after successful update
        await fetchFlashcards();

        // Close edit modal
        updateState({
          modals: {
            ...state.modals,
            isEditModalOpen: false,
            selectedFlashcard: null,
          },
        });
      } catch (error) {
        // console.error("Error updating flashcard:", error);
        updateState({
          error: error instanceof Error ? error.message : "Błąd podczas aktualizacji fiszki",
        });
        throw error; // Re-throw so modal can handle the error
      }
    },
    [fetchFlashcards, state.modals, updateState]
  );

  // Delete flashcard
  const deleteFlashcard = useCallback(
    async (id: number): Promise<void> => {
      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete flashcard: ${response.status}`);
        }

        // Refresh the list after successful deletion
        await fetchFlashcards();

        // Close delete dialog
        updateState({
          modals: {
            ...state.modals,
            isDeleteDialogOpen: false,
            selectedFlashcard: null,
          },
        });
      } catch (error) {
        // console.error("Error deleting flashcard:", error);
        updateState({
          error: error instanceof Error ? error.message : "Błąd podczas usuwania fiszki",
        });
        throw error; // Re-throw so dialog can handle the error
      }
    },
    [fetchFlashcards, state.modals, updateState]
  );

  // Apply filters and refresh data
  const applyFilters = useCallback(
    (filters: FlashcardFilters) => {
      updateState({
        filters,
        pagination: { ...state.pagination, page: 1 }, // Reset to first page when filtering
      });
    },
    [state.pagination, updateState]
  );

  // Apply sort and refresh data
  const applySort = useCallback(
    (field: FlashcardSortField) => {
      const newOrder = state.sort.field === field && state.sort.order === "desc" ? "asc" : "desc";
      updateState({
        sort: { field, order: newOrder },
      });
    },
    [state.sort, updateState]
  );

  // Change page and refresh data
  const changePage = useCallback(
    (page: number) => {
      updateState({
        pagination: { ...state.pagination, page },
      });
    },
    [state.pagination, updateState]
  );

  // Modal management functions
  const openCreateModal = useCallback(() => {
    updateState({
      modals: {
        ...state.modals,
        isCreateModalOpen: true,
      },
    });
  }, [state.modals, updateState]);

  const openEditModal = useCallback(
    (flashcard: FlashcardViewModel) => {
      updateState({
        modals: {
          ...state.modals,
          isEditModalOpen: true,
          selectedFlashcard: flashcard,
        },
      });
    },
    [state.modals, updateState]
  );

  const openDeleteDialog = useCallback(
    (flashcard: FlashcardViewModel) => {
      updateState({
        modals: {
          ...state.modals,
          isDeleteDialogOpen: true,
          selectedFlashcard: flashcard,
        },
      });
    },
    [state.modals, updateState]
  );

  const closeModals = useCallback(() => {
    updateState({
      modals: {
        isCreateModalOpen: false,
        isEditModalOpen: false,
        isDeleteDialogOpen: false,
        selectedFlashcard: null,
      },
    });
  }, [updateState]);

  // Effect to fetch data when filters, sort, or pagination change
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards, state.filters, state.sort, state.pagination.page]);

  // Effect to load initial data
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return {
    state,
    actions: {
      fetchFlashcards,
      createFlashcard,
      updateFlashcard,
      deleteFlashcard,
      applyFilters,
      applySort,
      changePage,
      openCreateModal,
      openEditModal,
      openDeleteDialog,
      closeModals,
    },
  };
}
