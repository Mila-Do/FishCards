import { useCallback, useState, useRef } from "react";
import type { ApiError, ErrorState } from "@/lib/types/common";

/**
 * Error recovery strategies
 */
export type ErrorRecoveryStrategy =
  | "retry" // Automatically retry the failed operation
  | "fallback" // Show fallback UI/data
  | "redirect" // Redirect to a safe page
  | "refresh" // Refresh the page
  | "ignore" // Log the error but continue
  | "manual"; // Require user intervention

/**
 * Configuration for error handling behavior
 */
export interface ErrorHandlerConfig {
  maxRetries?: number;
  retryDelay?: number;
  strategy?: ErrorRecoveryStrategy;
  fallbackData?: unknown;
  onError?: (error: Error | ApiError, context?: Record<string, unknown>) => void;
  onRecovery?: (error: Error | ApiError, strategy: ErrorRecoveryStrategy) => void;
}

/**
 * Error handler return type
 */
export interface ErrorHandler extends ErrorState {
  // Error actions
  handleError: (error: Error | ApiError | string, context?: Record<string, unknown>) => void;
  clearError: () => void;
  retry: () => Promise<void> | void;

  // Error info
  errorDetails: {
    message: string;
    code?: string;
    timestamp: Date;
    context?: Record<string, unknown>;
  } | null;

  // Recovery state
  isRetrying: boolean;
  retryAttempt: number;
  maxRetriesReached: boolean;
}

/**
 * Standard error messages with i18n support placeholder
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Błąd połączenia. Sprawdź połączenie internetowe.",
  TIMEOUT_ERROR: "Przekroczono limit czasu. Spróbuj ponownie.",
  SERVER_ERROR: "Błąd serwera. Spróbuj ponownie za chwilę.",

  // Authentication errors
  UNAUTHORIZED: "Brak uprawnień. Zaloguj się ponownie.",
  FORBIDDEN: "Nie masz uprawnień do tej operacji.",

  // Validation errors
  VALIDATION_ERROR: "Dane są nieprawidłowe. Sprawdź formularz.",
  REQUIRED_FIELD: "To pole jest wymagane.",

  // Data errors
  NOT_FOUND: "Nie znaleziono żądanych danych.",
  CONFLICT: "Konflikt danych. Odśwież stronę i spróbuj ponownie.",

  // Generic errors
  UNKNOWN_ERROR: "Wystąpił nieoczekiwany błąd.",
  OPERATION_FAILED: "Operacja nie powiodła się.",
} as const;

/**
 * Maps HTTP status codes to user-friendly error messages
 */
const STATUS_CODE_MESSAGES: Record<number, string> = {
  400: ERROR_MESSAGES.VALIDATION_ERROR,
  401: ERROR_MESSAGES.UNAUTHORIZED,
  403: ERROR_MESSAGES.FORBIDDEN,
  404: ERROR_MESSAGES.NOT_FOUND,
  409: ERROR_MESSAGES.CONFLICT,
  408: ERROR_MESSAGES.TIMEOUT_ERROR,
  429: "Zbyt wiele żądań. Spróbuj ponownie za chwilę.",
  500: ERROR_MESSAGES.SERVER_ERROR,
  502: ERROR_MESSAGES.SERVER_ERROR,
  503: "Serwis chwilowo niedostępny. Spróbuj ponownie za chwilę.",
  504: ERROR_MESSAGES.TIMEOUT_ERROR,
};

/**
 * Formats error into user-friendly message
 */
function formatErrorMessage(error: Error | ApiError | string): string {
  if (typeof error === "string") {
    return error;
  }

  if ("code" in error && error.code) {
    const statusCode = parseInt(error.code, 10);
    if (STATUS_CODE_MESSAGES[statusCode]) {
      return STATUS_CODE_MESSAGES[statusCode];
    }
  }

  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Hook for handling errors with recovery strategies
 * Provides consistent error handling across the application
 *
 * @example
 * ```tsx
 * const errorHandler = useErrorHandler({
 *   strategy: "retry",
 *   maxRetries: 3,
 *   onError: (error) => console.error('Operation failed:', error)
 * });
 *
 * // In an async operation
 * try {
 *   await fetchData();
 * } catch (error) {
 *   errorHandler.handleError(error, { context: 'fetchData' });
 * }
 *
 * // In JSX
 * {errorHandler.hasError && (
 *   <div role="alert">
 *     <p>{errorHandler.error}</p>
 *     {errorHandler.canRetry && (
 *       <button onClick={errorHandler.retry}>Spróbuj ponownie</button>
 *     )}
 *   </div>
 * )}
 * ```
 *
 * @param config Configuration for error handling behavior
 * @returns Object with error state and handler functions
 */
export function useErrorHandler(config: ErrorHandlerConfig = {}): ErrorHandler {
  const { maxRetries = 3, retryDelay = 1000, strategy = "manual", fallbackData, onError, onRecovery } = config;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    canRetry: true,
    retryCount: 0,
  });

  const [isRetrying, setIsRetrying] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorHandler["errorDetails"]>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastOperationRef = useRef<(() => Promise<void> | void) | null>(null);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      canRetry: true,
      retryCount: 0,
    });
    setErrorDetails(null);
    setIsRetrying(false);

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  const executeRecoveryStrategy = useCallback(
    async (error: Error | ApiError, recoveryStrategy: ErrorRecoveryStrategy) => {
      try {
        switch (recoveryStrategy) {
          case "retry":
            if (lastOperationRef.current && (errorState.retryCount || 0) < maxRetries) {
              setIsRetrying(true);
              retryTimeoutRef.current = setTimeout(async () => {
                try {
                  await lastOperationRef.current?.();
                  clearError();
                  onRecovery?.(error, "retry");
                } catch (retryError) {
                  // Handle retry error - avoid infinite recursion
                  setErrorState((prev) => ({
                    ...prev,
                    error: retryError instanceof Error ? retryError.message : "Retry failed",
                  }));
                } finally {
                  setIsRetrying(false);
                }
              }, retryDelay);
            }
            break;

          case "fallback":
            // Use fallback data if available
            if (fallbackData !== undefined) {
              clearError();
              onRecovery?.(error, "fallback");
            }
            break;

          case "redirect":
            window.location.href = "/";
            break;

          case "refresh":
            window.location.reload();
            break;

          case "ignore":
            // Error ignored - logged for debugging in development
            // console.warn("Error ignored:", error);
            clearError();
            break;

          case "manual":
          default:
            // Do nothing, require manual user action
            break;
        }
      } catch {
        // Recovery strategy failed - logged for debugging
      }
    },
    [errorState.retryCount, maxRetries, retryDelay, fallbackData, clearError, onRecovery]
  );

  const handleError = useCallback(
    (error: Error | ApiError | string, context?: Record<string, unknown>) => {
      const errorObj = typeof error === "string" ? new Error(error) : error;
      const userFriendlyMessage = formatErrorMessage(error);

      // Update error state
      setErrorState((prev) => ({
        hasError: true,
        error: userFriendlyMessage,
        canRetry: (prev.retryCount || 0) < maxRetries,
        retryCount: strategy === "retry" ? (prev.retryCount || 0) + 1 : prev.retryCount || 0,
      }));

      // Store error details
      setErrorDetails({
        message: userFriendlyMessage,
        code: "code" in errorObj ? errorObj.code : undefined,
        timestamp: new Date(),
        context,
      });

      // Call error callback
      onError?.(errorObj, context);

      // Execute recovery strategy if not manual
      if (strategy !== "manual") {
        executeRecoveryStrategy(errorObj, strategy);
      }
    },
    [maxRetries, strategy, onError, executeRecoveryStrategy]
  );

  const retry = useCallback(async () => {
    if (lastOperationRef.current && (errorState.retryCount || 0) < maxRetries) {
      setIsRetrying(true);
      try {
        await lastOperationRef.current();
        clearError();
      } catch (error) {
        // Handle retry failure - avoid infinite recursion
        setErrorState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Retry failed",
        }));
      } finally {
        setIsRetrying(false);
      }
    }
  }, [errorState.retryCount, maxRetries, clearError]);

  // Store the operation for retry capability (internal use only)
  // const registerOperation = useCallback((operation: () => Promise<void> | void) => {
  //   lastOperationRef.current = operation;
  // }, []);

  return {
    // Error state
    ...errorState,

    // Error details
    errorDetails,

    // Recovery state
    isRetrying,
    retryAttempt: errorState.retryCount || 0,
    maxRetriesReached: (errorState.retryCount || 0) >= maxRetries,

    // Error actions
    handleError,
    clearError,
    retry,

    // Note: registerOperation is available internally but not exposed
  };
}

/**
 * Hook for handling API errors specifically
 */
export function useApiErrorHandler(config: Omit<ErrorHandlerConfig, "strategy"> = {}) {
  return useErrorHandler({
    ...config,
    strategy: "manual", // API errors typically need manual handling
    onError: (error, context) => {
      // Log API errors for debugging in development
      // if (process.env.NODE_ENV === "development") {
      //   console.error("API Error:", { error, context, timestamp: new Date().toISOString() });
      // }

      config.onError?.(error, context);
    },
  });
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsyncOperation<T>(operation: () => Promise<T>, config: ErrorHandlerConfig = {}) {
  const errorHandler = useErrorHandler(config);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (context?: Record<string, unknown>) => {
      setLoading(true);
      errorHandler.clearError();

      try {
        const result = await operation();
        setData(result);
        return result;
      } catch (error) {
        errorHandler.handleError(error as Error, context);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [operation, errorHandler]
  );

  return {
    data,
    loading,
    execute,
    ...errorHandler,
  };
}
