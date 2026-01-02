/**
 * Specialized hook for flashcards API operations
 * Built on top of useApiCall for consistent error handling
 */

import { useCallback } from "react";
import { useApiCall } from "./useApiCall";
import type { CreateFlashcardCommand, UpdateFlashcardCommand, FlashcardQueryParams } from "../../types";

interface UseFlashcardsApiOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useFlashcardsApi(options: UseFlashcardsApiOptions = {}) {
  const { execute: executeRequest } = useApiCall(options);

  // Fetch paginated flashcards with filters
  const fetchFlashcards = useCallback(
    async (params: FlashcardQueryParams) => {
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

      return executeRequest(`/api/flashcards?${queryString}`, { method: "GET" });
    },
    [executeRequest]
  );

  // Create new flashcard
  const createFlashcard = useCallback(
    async (data: CreateFlashcardCommand | CreateFlashcardCommand[]) => {
      return executeRequest("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    [executeRequest]
  );

  // Update existing flashcard
  const updateFlashcard = useCallback(
    async (id: number, data: UpdateFlashcardCommand) => {
      return executeRequest(`/api/flashcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    [executeRequest]
  );

  // Delete flashcard
  const deleteFlashcard = useCallback(
    async (id: number) => {
      return executeRequest(`/api/flashcards/${id}`, { method: "DELETE" });
    },
    [executeRequest]
  );

  // Get single flashcard by ID
  const getFlashcard = useCallback(
    async (id: number) => {
      return executeRequest(`/api/flashcards/${id}`, { method: "GET" });
    },
    [executeRequest]
  );

  return {
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    getFlashcard,
  };
}
