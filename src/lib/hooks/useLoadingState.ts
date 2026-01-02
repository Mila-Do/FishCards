import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Loading state priority levels
 */
export type LoadingPriority = "low" | "medium" | "high" | "critical";

/**
 * Loading state with metadata
 */
interface LoadingStateItem {
  id: string;
  isLoading: boolean;
  message?: string;
  priority: LoadingPriority;
  progress?: number;
  timestamp: number;
}

/**
 * Configuration for loading state management
 */
interface LoadingStateConfig {
  // Default priority for new loading states
  defaultPriority?: LoadingPriority;

  // Auto-cleanup loading states after specified time (ms)
  autoCleanupAfter?: number;

  // Maximum number of concurrent loading states to track
  maxStates?: number;

  // Whether to merge loading states of the same priority
  mergeByPriority?: boolean;
}

/**
 * Hook return type
 */
interface UseLoadingStateReturn {
  // Current state
  isLoading: boolean;
  loadingMessage: string | null;
  loadingProgress: number | null;
  currentPriority: LoadingPriority | null;

  // All loading states (for debugging/advanced usage)
  allLoadingStates: LoadingStateItem[];

  // Actions
  setLoading: (
    id: string,
    isLoading: boolean,
    options?: {
      message?: string;
      priority?: LoadingPriority;
      progress?: number;
    }
  ) => void;

  clearLoading: (id: string) => void;
  clearAllLoading: () => void;

  // Utility functions
  isLoadingWithId: (id: string) => boolean;
  getLoadingState: (id: string) => LoadingStateItem | undefined;
  hasLoadingPriority: (priority: LoadingPriority) => boolean;
}

/**
 * Priority order for loading states (higher index = higher priority)
 */
const PRIORITY_ORDER: LoadingPriority[] = ["low", "medium", "high", "critical"];

/**
 * Get priority value for comparison
 */
function getPriorityValue(priority: LoadingPriority): number {
  return PRIORITY_ORDER.indexOf(priority);
}

/**
 * Hook for managing multiple loading states with priorities
 * Higher priority loading states take precedence in UI display
 */
export function useLoadingState(config: LoadingStateConfig = {}): UseLoadingStateReturn {
  const {
    defaultPriority = "medium",
    autoCleanupAfter = 300000, // 5 minutes
    maxStates = 10,
    // mergeByPriority = false, // Reserved for future use
  } = config;

  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingStateItem>>(new Map());
  const cleanupTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup old loading states
  const cleanupOldStates = useCallback(() => {
    const now = Date.now();
    setLoadingStates((prev) => {
      const updated = new Map(prev);
      for (const [id, state] of updated.entries()) {
        if (!state.isLoading && now - state.timestamp > autoCleanupAfter) {
          updated.delete(id);
          const timeout = cleanupTimeouts.current.get(id);
          if (timeout) {
            clearTimeout(timeout);
            cleanupTimeouts.current.delete(id);
          }
        }
      }
      return updated;
    });
  }, [autoCleanupAfter]);

  // Schedule cleanup for finished loading states
  const scheduleCleanup = useCallback(
    (id: string) => {
      const existingTimeout = cleanupTimeouts.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        setLoadingStates((prev) => {
          const updated = new Map(prev);
          updated.delete(id);
          return updated;
        });
        cleanupTimeouts.current.delete(id);
      }, autoCleanupAfter);

      cleanupTimeouts.current.set(id, timeout);
    },
    [autoCleanupAfter]
  );

  // Set loading state
  const setLoading = useCallback(
    (
      id: string,
      isLoading: boolean,
      options: {
        message?: string;
        priority?: LoadingPriority;
        progress?: number;
      } = {}
    ) => {
      const { message, priority = defaultPriority, progress } = options;

      setLoadingStates((prev) => {
        const updated = new Map(prev);

        // Enforce max states limit by removing oldest low-priority states
        if (updated.size >= maxStates) {
          const sortedStates = Array.from(updated.entries()).sort(([, a], [, b]) => {
            if (a.priority !== b.priority) {
              return getPriorityValue(a.priority) - getPriorityValue(b.priority);
            }
            return a.timestamp - b.timestamp;
          });

          // Remove the oldest, lowest priority state
          const [oldestId] = sortedStates[0];
          updated.delete(oldestId);

          const timeout = cleanupTimeouts.current.get(oldestId);
          if (timeout) {
            clearTimeout(timeout);
            cleanupTimeouts.current.delete(oldestId);
          }
        }

        const state: LoadingStateItem = {
          id,
          isLoading,
          message,
          priority,
          progress,
          timestamp: Date.now(),
        };

        updated.set(id, state);

        // Schedule cleanup if loading is finished
        if (!isLoading) {
          scheduleCleanup(id);
        } else {
          // Clear any existing cleanup timeout
          const existingTimeout = cleanupTimeouts.current.get(id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            cleanupTimeouts.current.delete(id);
          }
        }

        return updated;
      });
    },
    [defaultPriority, maxStates, scheduleCleanup]
  );

  // Clear specific loading state
  const clearLoading = useCallback(
    (id: string) => {
      setLoading(id, false);
    },
    [setLoading]
  );

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    setLoadingStates(new Map());

    // Clear all timeouts
    for (const timeout of cleanupTimeouts.current.values()) {
      clearTimeout(timeout);
    }
    cleanupTimeouts.current.clear();
  }, []);

  // Check if specific ID is loading
  const isLoadingWithId = useCallback(
    (id: string) => {
      const state = loadingStates.get(id);
      return state?.isLoading || false;
    },
    [loadingStates]
  );

  // Get loading state for specific ID
  const getLoadingState = useCallback(
    (id: string) => {
      return loadingStates.get(id);
    },
    [loadingStates]
  );

  // Check if any loading state has specific priority
  const hasLoadingPriority = useCallback(
    (priority: LoadingPriority) => {
      for (const state of loadingStates.values()) {
        if (state.isLoading && state.priority === priority) {
          return true;
        }
      }
      return false;
    },
    [loadingStates]
  );

  // Derive computed states
  const allLoadingStates = Array.from(loadingStates.values());
  const activeLoadingStates = allLoadingStates.filter((state) => state.isLoading);

  // Find highest priority active loading state
  const highestPriorityState = activeLoadingStates.reduce<LoadingStateItem | null>((highest, current) => {
    if (!highest) return current;

    if (getPriorityValue(current.priority) > getPriorityValue(highest.priority)) {
      return current;
    }

    // If same priority, prefer newer state
    if (current.priority === highest.priority && current.timestamp > highest.timestamp) {
      return current;
    }

    return highest;
  }, null);

  const isLoading = activeLoadingStates.length > 0;
  const loadingMessage = highestPriorityState?.message || null;
  const loadingProgress = highestPriorityState?.progress || null;
  const currentPriority = highestPriorityState?.priority || null;

  // Cleanup effect
  useEffect(() => {
    const interval = setInterval(cleanupOldStates, 60000); // Clean up every minute
    const timeoutsToCleanup = cleanupTimeouts.current; // Capture ref value
    return () => {
      clearInterval(interval);

      // Clear all timeouts on unmount
      for (const timeout of timeoutsToCleanup.values()) {
        clearTimeout(timeout);
      }
    };
  }, [cleanupOldStates]);

  return {
    // Current state
    isLoading,
    loadingMessage,
    loadingProgress,
    currentPriority,

    // All states
    allLoadingStates,

    // Actions
    setLoading,
    clearLoading,
    clearAllLoading,

    // Utilities
    isLoadingWithId,
    getLoadingState,
    hasLoadingPriority,
  };
}

/**
 * Hook for simple loading state management (single loading state)
 */
export function useSimpleLoading(initialLoading = false) {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const startLoading = useCallback((message?: string, initialProgress?: number) => {
    setIsLoading(true);
    setLoadingMessage(message || null);
    setProgress(initialProgress || null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(null);
    setProgress(null);
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingMessage(message);
  }, []);

  return {
    isLoading,
    loadingMessage,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
  };
}

/**
 * Hook for async operations with loading state
 */
export function useAsyncLoading<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  config: {
    loadingMessage?: string;
    priority?: LoadingPriority;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const loadingState = useLoadingState();
  const operationId = useRef(`async-${Math.random().toString(36).substr(2, 9)}`);

  const execute = useCallback(
    async (...args: Args) => {
      const id = operationId.current;

      try {
        loadingState.setLoading(id, true, {
          message: config.loadingMessage,
          priority: config.priority,
        });

        const result = await asyncFunction(...args);

        config.onSuccess?.(result);
        return result;
      } catch (error) {
        config.onError?.(error as Error);
        throw error;
      } finally {
        loadingState.clearLoading(id);
      }
    },
    [asyncFunction, config, loadingState]
  );

  return {
    execute,
    isOperationLoading: loadingState.isLoadingWithId(operationId.current),
    ...loadingState,
  };
}
