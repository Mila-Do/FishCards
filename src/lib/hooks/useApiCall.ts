/**
 * Generic API call hook with error handling and loading state
 * Provides reusable patterns for HTTP requests across the application
 */

import { useState, useCallback } from "react";
import { authenticatedFetch } from "../auth-helper";
import type { ApiResult } from "../types/common";
import type { ErrorResponse } from "../../types";

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiCallOptions {
  timeout?: number;
  retries?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useApiCall<T = unknown>(options: UseApiCallOptions = {}) {
  const { timeout = 30000, retries = 0, onSuccess, onError } = options;

  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (url: string, init?: RequestInit): Promise<ApiResult<T>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await authenticatedFetch(url, {
            ...init,
            signal: AbortSignal.timeout(timeout),
          });

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorData: ErrorResponse = await response.json();
              errorMessage = errorData.error?.message || errorMessage;
            } catch {
              // Ignore JSON parsing error, use HTTP status
            }
            throw new Error(errorMessage);
          }

          const data: T = await response.json();

          setState((prev) => ({ ...prev, loading: false, data }));
          onSuccess?.();

          return { success: true, data };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown error");

          // Don't retry on timeout or non-network errors
          if (error instanceof Error && error.name === "TimeoutError") {
            break;
          }

          // Wait before retry (exponential backoff)
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      const errorMessage = lastError?.message || "API call failed";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      onError?.(errorMessage);

      return { success: false, error: errorMessage };
    },
    [timeout, retries, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
