import { useState, useCallback, useRef } from "react";

/**
 * Configuration for optimistic updates
 */
export interface OptimisticUpdateConfig<T> {
  // Duration to wait before considering the update failed (ms)
  timeout?: number;

  // Whether to automatically rollback on error
  autoRollback?: boolean;

  // Custom rollback strategy
  onRollback?: (originalData: T, failedUpdate: T) => void;

  // Error handler for failed updates
  onError?: (error: Error, originalData: T, updateData: T) => void;
}

/**
 * State for optimistic updates
 */
interface OptimisticState<T> {
  data: T;
  originalData: T;
  isPending: boolean;
  hasOptimisticUpdate: boolean;
}

/**
 * Hook for managing optimistic updates with automatic rollback
 * Useful for creating smooth UX while waiting for server confirmation
 *
 * @example
 * ```tsx
 * const optimistic = useOptimisticUpdates(
 *   { count: 0 },
 *   {
 *     timeout: 5000,
 *     onError: (error) => toast.error('Update failed'),
 *   }
 * );
 *
 * const incrementCount = async () => {
 *   await optimistic.performOptimisticUpdate(
 *     (data) => ({ ...data, count: data.count + 1 }),
 *     () => api.updateCount(optimistic.data.count + 1)
 *   );
 * };
 *
 * // In JSX
 * <div>
 *   <p>Count: {optimistic.data.count}</p>
 *   {optimistic.isPending && <span>Saving...</span>}
 *   <button onClick={incrementCount}>Increment</button>
 *   {optimistic.hasOptimisticUpdate && (
 *     <button onClick={optimistic.rollback}>Undo</button>
 *   )}
 * </div>
 * ```
 *
 * @param initialData Initial data state
 * @param config Configuration for optimistic updates
 * @returns Object with data state and update functions
 */
export function useOptimisticUpdates<T>(initialData: T, config: OptimisticUpdateConfig<T> = {}) {
  const { timeout = 30000, autoRollback = true, onRollback, onError } = config;

  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    originalData: initialData,
    isPending: false,
    hasOptimisticUpdate: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingOperations = useRef<Set<string>>(new Set());

  /**
   * Perform an optimistic update
   */
  const performOptimisticUpdate = useCallback(
    async <R>(
      updateFunction: (currentData: T) => T,
      serverOperation: () => Promise<R>,
      operationId?: string
    ): Promise<R> => {
      const id = operationId || Math.random().toString(36).substr(2, 9);

      try {
        // Store original data before any updates
        const originalData = state.hasOptimisticUpdate ? state.originalData : state.data;

        // Apply optimistic update immediately
        const optimisticData = updateFunction(state.data);

        setState((prev) => ({
          ...prev,
          data: optimisticData,
          originalData,
          isPending: true,
          hasOptimisticUpdate: true,
        }));

        pendingOperations.current.add(id);

        // Set timeout for potential rollback
        if (autoRollback && timeout > 0) {
          timeoutRef.current = setTimeout(() => {
            if (pendingOperations.current.has(id)) {
              rollback(originalData, optimisticData);
              onError?.(new Error("Operacja przekroczyła limit czasu"), originalData, optimisticData);
            }
          }, timeout);
        }

        // Perform the actual server operation
        const result = await serverOperation();

        // Clear timeout if operation completed successfully
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        pendingOperations.current.delete(id);

        // Update state to reflect successful operation
        setState((prev) => ({
          ...prev,
          isPending: pendingOperations.current.size > 0,
          hasOptimisticUpdate: pendingOperations.current.size > 0,
          originalData: pendingOperations.current.size === 0 ? prev.data : prev.originalData,
        }));

        return result;
      } catch (error) {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        pendingOperations.current.delete(id);

        // Rollback optimistic update on error
        if (autoRollback) {
          const originalData = state.originalData;
          rollback(originalData, state.data);
          onError?.(error as Error, originalData, state.data);
        }

        throw error;
      }
    },
    [state.data, state.originalData, state.hasOptimisticUpdate, autoRollback, timeout, onError]
  );

  /**
   * Manual rollback function
   */
  const rollback = useCallback(
    (originalData?: T, failedData?: T) => {
      const dataToRestore = originalData || state.originalData;
      const failed = failedData || state.data;

      setState((prev) => ({
        data: dataToRestore,
        originalData: dataToRestore,
        isPending: false,
        hasOptimisticUpdate: false,
      }));

      // Clear all pending operations
      pendingOperations.current.clear();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      onRollback?.(dataToRestore, failed);
    },
    [state.originalData, state.data, onRollback]
  );

  /**
   * Commit optimistic updates (sync local data with confirmed server data)
   */
  const commit = useCallback((serverData: T) => {
    setState({
      data: serverData,
      originalData: serverData,
      isPending: false,
      hasOptimisticUpdate: false,
    });

    pendingOperations.current.clear();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  /**
   * Reset to initial data
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      originalData: initialData,
      isPending: false,
      hasOptimisticUpdate: false,
    });

    pendingOperations.current.clear();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [initialData]);

  /**
   * Update data without optimistic behavior (direct update)
   */
  const updateData = useCallback((newData: T | ((prev: T) => T)) => {
    setState((prev) => {
      const data = typeof newData === "function" ? (newData as (prev: T) => T)(prev.data) : newData;
      return {
        data,
        originalData: data,
        isPending: false,
        hasOptimisticUpdate: false,
      };
    });

    pendingOperations.current.clear();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    // Current data state
    data: state.data,
    originalData: state.originalData,

    // Status flags
    isPending: state.isPending,
    hasOptimisticUpdate: state.hasOptimisticUpdate,
    hasPendingOperations: pendingOperations.current.size > 0,

    // Actions
    performOptimisticUpdate,
    rollback,
    commit,
    reset,
    updateData,
  };
}

/**
 * Specialized hook for optimistic CRUD operations
 */
export function useOptimisticCRUD<TItem extends { id: string | number }>(
  initialItems: TItem[],
  config: OptimisticUpdateConfig<TItem[]> = {}
) {
  const optimistic = useOptimisticUpdates(initialItems, config);

  /**
   * Optimistically add an item
   */
  const optimisticAdd = useCallback(
    async (item: TItem, serverOperation: () => Promise<TItem>) => {
      return optimistic.performOptimisticUpdate(
        (items) => [...items, item],
        async () => {
          const serverItem = await serverOperation();
          // Update the item with server response
          optimistic.commit(optimistic.data.map((i) => (i.id === item.id ? serverItem : i)));
          return serverItem;
        }
      );
    },
    [optimistic]
  );

  /**
   * Optimistically update an item
   */
  const optimisticUpdate = useCallback(
    async (id: string | number, updates: Partial<TItem>, serverOperation: () => Promise<TItem>) => {
      return optimistic.performOptimisticUpdate(
        (items) => items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        async () => {
          const serverItem = await serverOperation();
          // Update with server response
          optimistic.commit(optimistic.data.map((i) => (i.id === id ? serverItem : i)));
          return serverItem;
        }
      );
    },
    [optimistic]
  );

  /**
   * Optimistically delete an item
   */
  const optimisticDelete = useCallback(
    async (id: string | number, serverOperation: () => Promise<void>) => {
      return optimistic.performOptimisticUpdate((items) => items.filter((item) => item.id !== id), serverOperation);
    },
    [optimistic]
  );

  /**
   * Get item by ID
   */
  const getItem = useCallback(
    (id: string | number) => {
      return optimistic.data.find((item) => item.id === id);
    },
    [optimistic.data]
  );

  return {
    // Data and state
    items: optimistic.data,
    originalItems: optimistic.originalData,
    isPending: optimistic.isPending,
    hasOptimisticUpdate: optimistic.hasOptimisticUpdate,

    // CRUD operations
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
    getItem,

    // Utility functions
    rollback: optimistic.rollback,
    commit: optimistic.commit,
    reset: optimistic.reset,
    updateItems: optimistic.updateData,
  };
}

/**
 * Hook for optimistic form updates
 */
export function useOptimisticForm<TForm extends Record<string, unknown>>(
  initialForm: TForm,
  config: OptimisticUpdateConfig<TForm> = {}
) {
  const optimistic = useOptimisticUpdates(initialForm, config);

  /**
   * Optimistically update form field
   */
  const optimisticUpdateField = useCallback(
    async <K extends keyof TForm>(field: K, value: TForm[K], serverOperation: () => Promise<void>) => {
      return optimistic.performOptimisticUpdate((form) => ({ ...form, [field]: value }), serverOperation);
    },
    [optimistic]
  );

  /**
   * Optimistically submit form
   */
  const optimisticSubmit = useCallback(
    async (updates: Partial<TForm>, serverOperation: () => Promise<TForm>) => {
      return optimistic.performOptimisticUpdate(
        (form) => ({ ...form, ...updates }),
        async () => {
          const serverForm = await serverOperation();
          optimistic.commit(serverForm);
          return serverForm;
        }
      );
    },
    [optimistic]
  );

  return {
    // Form state
    form: optimistic.data,
    originalForm: optimistic.originalData,
    isPending: optimistic.isPending,
    hasOptimisticUpdate: optimistic.hasOptimisticUpdate,

    // Form operations
    optimisticUpdateField,
    optimisticSubmit,

    // Utility functions
    rollback: optimistic.rollback,
    commit: optimistic.commit,
    reset: optimistic.reset,
    updateForm: optimistic.updateData,
  };
}
