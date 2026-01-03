/**
 * Main state management hook for flashcards view (REFACTORED)
 * Combines specialized hooks for data, CRUD, filters, and modals
 * This is the new implementation that replaces the monolithic useFlashcardsState
 */

import { useCallback, useEffect } from "react";
import { useFlashcardsData } from "./useFlashcardsData";
import { useFlashcardsCRUD } from "./useFlashcardsCRUD";
import { useFlashcardsFilters } from "./useFlashcardsFilters";
import { useFlashcardsModals } from "./useFlashcardsModals";
import type { FlashcardsViewState, FlashcardModalState } from "../types";

// Remove unused interface - keeping comment for reference
// Modals state is now handled by useFlashcardsModals hook

export function useFlashcardsState() {
  // Specialized hooks for different concerns
  const { filters, sort, actions: filterActions } = useFlashcardsFilters();
  const { modals, actions: modalActions } = useFlashcardsModals();

  const { flashcards, loading, error, pagination, actions: dataActions } = useFlashcardsData(filters, sort);

  // CRUD operations with callbacks for success/error handling
  const {
    createFlashcard: crudCreateFlashcard,
    updateFlashcard: crudUpdateFlashcard,
    deleteFlashcard: crudDeleteFlashcard,
  } = useFlashcardsCRUD({
    onSuccess: () => {
      // Refresh data after successful operation
      dataActions.fetchFlashcards();
      // Close relevant modals
      modalActions.closeAllModals();
    },
    onError: () => {
      // Error handling will be done by the components calling CRUD operations
      // Error is passed to the calling components for appropriate handling
    },
  });

  // Wrapper functions that return Promise<void> for compatibility with modal components
  const createFlashcard = useCallback(
    async (data: Parameters<typeof crudCreateFlashcard>[0]): Promise<void> => {
      await crudCreateFlashcard(data);
    },
    [crudCreateFlashcard]
  );

  const updateFlashcard = useCallback(
    async (id: number, data: Parameters<typeof crudUpdateFlashcard>[1]): Promise<void> => {
      await crudUpdateFlashcard(id, data);
    },
    [crudUpdateFlashcard]
  );

  const deleteFlashcard = useCallback(
    async (id: number): Promise<void> => {
      await crudDeleteFlashcard(id);
    },
    [crudDeleteFlashcard]
  );

  // Enhanced filter application that resets pagination
  const applyFilters = useCallback(
    (newFilters: typeof filters) => {
      filterActions.applyFilters(newFilters);
      dataActions.resetPagination();
    },
    [filterActions, dataActions]
  );

  // Enhanced sort application
  const applySort = useCallback(
    (field: Parameters<typeof filterActions.applySort>[0]) => {
      filterActions.applySort(field);
    },
    [filterActions]
  );

  // Calculate selected count (for future use with bulk operations)
  const selectedCount = 0; // TODO: Implement when adding bulk selection

  // Convert modals state to expected FlashcardModalState structure
  const modalState: FlashcardModalState = {
    create: {
      isOpen: modals.isCreateModalOpen,
    },
    edit: {
      isOpen: modals.isEditModalOpen,
      data: modals.selectedFlashcard || undefined,
    },
    delete: {
      isOpen: modals.isDeleteDialogOpen,
      data: modals.selectedFlashcard || undefined,
    },
    view: {
      isOpen: false, // Not implemented yet
    },
  };

  // Reconstruct the legacy state format for backward compatibility
  const legacyState: FlashcardsViewState = {
    flashcards,
    loading,
    error,
    pagination,
    filters,
    sort,
    modals: modalState,
    selectedCount,
    validationErrors: {}, // TODO: Implement validation errors handling
  };

  // Effect to fetch initial data on mount
  useEffect(() => {
    dataActions.fetchFlashcards();
  }, []); // Remove dataActions dependency to prevent infinite loop

  return {
    state: legacyState,
    actions: {
      fetchFlashcards: dataActions.fetchFlashcards,
      createFlashcard,
      updateFlashcard,
      deleteFlashcard,
      applyFilters,
      applySort,
      changePage: dataActions.changePage,
      openCreateModal: modalActions.openCreateModal,
      openEditModal: modalActions.openEditModal,
      openDeleteDialog: modalActions.openDeleteDialog,
      closeModals: modalActions.closeAllModals,
    },
  };
}
