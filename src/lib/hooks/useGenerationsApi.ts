/**
 * Specialized hook for generations API operations
 * Built on top of useApiCall for consistent error handling
 */

import { useCallback } from "react";
import { useApiCall } from "./useApiCall";
import type { CreateGenerationCommand, GenerationQueryParams } from "../../types";

interface UseGenerationsApiOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useGenerationsApi(options: UseGenerationsApiOptions = {}) {
  const { execute: executeRequest } = useApiCall({
    ...options,
    timeout: 60000, // Generations can take longer
  });

  // Generate flashcard proposals from source text
  const generateProposals = useCallback(
    async (sourceText: string) => {
      const data: CreateGenerationCommand = {
        source_text: sourceText,
      };

      return executeRequest("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    [executeRequest]
  );

  // Fetch paginated generations history
  const fetchGenerations = useCallback(
    async (params: GenerationQueryParams = {}) => {
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

      return executeRequest(`/api/generations?${queryString}`, { method: "GET" });
    },
    [executeRequest]
  );

  // Get single generation by ID
  const getGeneration = useCallback(
    async (id: number) => {
      return executeRequest(`/api/generations/${id}`, { method: "GET" });
    },
    [executeRequest]
  );

  // Delete generation (if needed for cleanup)
  const deleteGeneration = useCallback(
    async (id: number) => {
      return executeRequest(`/api/generations/${id}`, { method: "DELETE" });
    },
    [executeRequest]
  );

  return {
    generateProposals,
    fetchGenerations,
    getGeneration,
    deleteGeneration,
  };
}
