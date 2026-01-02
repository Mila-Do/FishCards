/**
 * Hook for managing flashcards modal states
 * Handles opening/closing of create, edit, and delete modals
 */

import { useState, useCallback } from "react";
import type { FlashcardViewModel } from "../types";

interface ModalsState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedFlashcard: FlashcardViewModel | null;
}

const DEFAULT_MODALS: ModalsState = {
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteDialogOpen: false,
  selectedFlashcard: null,
};

export function useFlashcardsModals() {
  const [modals, setModals] = useState<ModalsState>(DEFAULT_MODALS);

  // Update modals state
  const updateModals = useCallback((updates: Partial<ModalsState>) => {
    setModals((prev) => ({ ...prev, ...updates }));
  }, []);

  // Open create modal
  const openCreateModal = useCallback(() => {
    updateModals({
      isCreateModalOpen: true,
    });
  }, [updateModals]);

  // Open edit modal with selected flashcard
  const openEditModal = useCallback(
    (flashcard: FlashcardViewModel) => {
      updateModals({
        isEditModalOpen: true,
        selectedFlashcard: flashcard,
      });
    },
    [updateModals]
  );

  // Open delete dialog with selected flashcard
  const openDeleteDialog = useCallback(
    (flashcard: FlashcardViewModel) => {
      updateModals({
        isDeleteDialogOpen: true,
        selectedFlashcard: flashcard,
      });
    },
    [updateModals]
  );

  // Close create modal
  const closeCreateModal = useCallback(() => {
    updateModals({
      isCreateModalOpen: false,
    });
  }, [updateModals]);

  // Close edit modal
  const closeEditModal = useCallback(() => {
    updateModals({
      isEditModalOpen: false,
      selectedFlashcard: null,
    });
  }, [updateModals]);

  // Close delete dialog
  const closeDeleteDialog = useCallback(() => {
    updateModals({
      isDeleteDialogOpen: false,
      selectedFlashcard: null,
    });
  }, [updateModals]);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setModals(DEFAULT_MODALS);
  }, []);

  // Check if any modal is open
  const isAnyModalOpen = modals.isCreateModalOpen || modals.isEditModalOpen || modals.isDeleteDialogOpen;

  return {
    modals,
    isAnyModalOpen,
    actions: {
      openCreateModal,
      openEditModal,
      openDeleteDialog,
      closeCreateModal,
      closeEditModal,
      closeDeleteDialog,
      closeAllModals,
    },
  };
}
