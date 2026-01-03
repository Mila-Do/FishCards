/**
 * Hook for managing CRUD operations on flashcards
 * Handles create, update, and delete operations with proper error handling
 */

import { useCallback } from "react";
import { authenticatedFetch } from "../../../lib/auth-helper";
import type { CreateFlashcardCommand, UpdateFlashcardCommand, FlashcardDTO, DeleteFlashcardResponse } from "../types";

interface UseFlashcardsCRUDOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UseFlashcardsCRUDActions {
  createFlashcard: (data: CreateFlashcardCommand) => Promise<FlashcardDTO>;
  updateFlashcard: (id: number, data: UpdateFlashcardCommand) => Promise<FlashcardDTO>;
  deleteFlashcard: (id: number) => Promise<void>;
}

export function useFlashcardsCRUD(options: UseFlashcardsCRUDOptions = {}): UseFlashcardsCRUDActions {
  const { onSuccess, onError } = options;

  // Create new flashcard
  const createFlashcard = useCallback(
    async (data: CreateFlashcardCommand): Promise<FlashcardDTO> => {
      try {
        const response = await authenticatedFetch("/api/flashcards", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}: Błąd podczas tworzenia fiszki`);
        }

        const flashcard: FlashcardDTO = await response.json();
        onSuccess?.();
        return flashcard;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error("Nieznany błąd podczas tworzenia fiszki");
        onError?.(errorObj);
        throw errorObj;
      }
    },
    [onSuccess, onError]
  );

  // Update existing flashcard
  const updateFlashcard = useCallback(
    async (id: number, data: UpdateFlashcardCommand): Promise<FlashcardDTO> => {
      try {
        const response = await authenticatedFetch(`/api/flashcards/${id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 404) {
            throw new Error("Fiszka nie została znaleziona lub nie masz do niej dostępu");
          }

          throw new Error(errorData.error?.message || `HTTP ${response.status}: Błąd podczas aktualizacji fiszki`);
        }

        const flashcard: FlashcardDTO = await response.json();
        onSuccess?.();
        return flashcard;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error("Nieznany błąd podczas aktualizacji fiszki");
        onError?.(errorObj);
        throw errorObj;
      }
    },
    [onSuccess, onError]
  );

  // Delete flashcard
  const deleteFlashcard = useCallback(
    async (id: number): Promise<void> => {
      try {
        const response = await authenticatedFetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 404) {
            throw new Error("Fiszka nie została znaleziona lub nie masz do niej dostępu");
          }

          throw new Error(errorData.error?.message || `HTTP ${response.status}: Błąd podczas usuwania fiszki`);
        }

        // Verify the response contains success message
        const result: DeleteFlashcardResponse = await response.json();

        if (!result.message || result.id !== id) {
          throw new Error("Nieprawidłowa odpowiedź serwera podczas usuwania fiszki");
        }

        onSuccess?.();
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error("Nieznany błąd podczas usuwania fiszki");
        onError?.(errorObj);
        throw errorObj;
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
