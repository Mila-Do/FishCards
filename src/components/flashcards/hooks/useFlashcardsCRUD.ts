/**
 * Hook for managing flashcards CRUD operations
 * Handles create, update, delete operations with error handling
 */

import { useCallback } from "react";
import type { CreateFlashcardCommand, UpdateFlashcardCommand } from "../types";

interface UseFlashcardsCRUDProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useFlashcardsCRUD({ onSuccess, onError }: UseFlashcardsCRUDProps = {}) {
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

        onSuccess?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Błąd podczas tworzenia fiszki";
        onError?.(errorMessage);
        throw error; // Re-throw so modal can handle the error
      }
    },
    [onSuccess, onError]
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

        onSuccess?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Błąd podczas aktualizacji fiszki";
        onError?.(errorMessage);
        throw error; // Re-throw so modal can handle the error
      }
    },
    [onSuccess, onError]
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

        onSuccess?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Błąd podczas usuwania fiszki";
        onError?.(errorMessage);
        throw error; // Re-throw so dialog can handle the error
      }
    },
    [onSuccess, onError]
  );

  return {
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
  };
}
