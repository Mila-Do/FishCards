import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardStats, clearStatsCache } from "../../../lib/hooks/useDashboardStats";

/**
 * Test suite for dashboard statistics hook
 * Priority: MEDIUM - requires ≥75% coverage according to test plan
 */

// Mock useApiCall hook - create mock function inside factory to avoid hoisting issues
const mockExecute = vi.fn();

vi.mock("../../../lib/hooks/useApiCall", () => ({
  useApiCall: () => ({
    execute: mockExecute,
  }),
}));

// Mock types - minimal interface for testing
interface MockGeneration {
  id: string;
  generated_count: number;
  accepted_unedited_count: number;
  accepted_edited_count: number;
  created_at: string;
}

describe("useDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStatsCache(); // Clear global cache between tests
    // Note: Don't use fake timers globally - they block async promises
    // Use them only in specific tests that need to test timing behavior
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful data fetching", () => {
    it("should fetch and aggregate dashboard stats correctly", async () => {
      const mockGenerations: MockGeneration[] = [
        {
          id: "1",
          generated_count: 10,
          accepted_unedited_count: 6,
          accepted_edited_count: 2,
          created_at: "2024-06-15T10:00:00Z",
        },
        {
          id: "2",
          generated_count: 5,
          accepted_unedited_count: 3,
          accepted_edited_count: 1,
          created_at: "2024-06-14T15:30:00Z",
        },
      ];

      // Mock API responses
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 50 } },
        }) // Total flashcards
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 12 } },
        }) // Review flashcards
        .mockResolvedValueOnce({
          success: true,
          data: { data: mockGenerations, pagination: { total: 5 } },
        }); // Generations

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        flashcardsToReviewToday: 12,
        totalFlashcards: 50,
        aiAcceptanceRate: 80, // (6+2+3+1) / (10+5) * 100 = 80%
        totalGenerations: 5,
        lastActivityDate: new Date("2024-06-15T10:00:00Z"),
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle empty generations gracefully", async () => {
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 25 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 5 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }, // No generations
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual({
        flashcardsToReviewToday: 5,
        totalFlashcards: 25,
        aiAcceptanceRate: 0,
        totalGenerations: 0,
        lastActivityDate: undefined,
      });
    });

    it("should calculate AI acceptance rate with zero generations", async () => {
      const mockGenerationsWithZero: MockGeneration[] = [
        {
          id: "1",
          generated_count: 0, // Zero generated
          accepted_unedited_count: 0,
          accepted_edited_count: 0,
          created_at: "2024-06-15T10:00:00Z",
        },
      ];

      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 10 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 2 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: mockGenerationsWithZero, pagination: { total: 1 } },
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats?.aiAcceptanceRate).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should handle API errors gracefully", async () => {
      mockExecute
        .mockResolvedValueOnce({
          success: false,
          error: "Failed to fetch flashcards",
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 5 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 2 } },
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to fetch flashcards");
      expect(result.current.stats).toBeNull();
    });

    it("should handle multiple API failures", async () => {
      mockExecute
        .mockResolvedValueOnce({
          success: false,
          error: "Network error",
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Server error",
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Authentication error",
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error"); // First error
      expect(result.current.stats).toBeNull();
    });

    it("should handle network exceptions", async () => {
      mockExecute.mockRejectedValue(new Error("Network connection failed"));

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network connection failed");
      expect(result.current.stats).toBeNull();
    });
  });

  describe("caching functionality", () => {
    it("should use cached data when cache is valid", async () => {
      // First call - populate cache
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 30 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 8 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 3 } },
        });

      const { result: result1 } = renderHook(
        () => useDashboardStats({ cacheTTL: 60000 }) // 1 minute cache
      );

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      expect(mockExecute).toHaveBeenCalledTimes(3);

      // Second call immediately - should use cache
      const { result: result2 } = renderHook(() => useDashboardStats({ cacheTTL: 60000 }));

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      // Should not make additional API calls
      expect(mockExecute).toHaveBeenCalledTimes(3);
      expect(result2.current.isCached).toBe(true);
    });

    it("should fetch fresh data when cache is expired", async () => {
      const shortTTL = 50; // 50ms cache - use real timers

      // First call - populate cache
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 20 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 4 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 2 } },
        });

      const { result: result1, unmount: unmount1 } = renderHook(() => useDashboardStats({ cacheTTL: shortTTL }));

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      expect(mockExecute).toHaveBeenCalledTimes(3);

      // Unmount first hook
      unmount1();

      // Wait for cache to expire using real timers
      await new Promise((resolve) => setTimeout(resolve, shortTTL + 20));

      // Clear mock call count
      vi.clearAllMocks();

      // Second call after cache expiry - should fetch fresh data
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 25 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 6 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 3 } },
        });

      const { result: result2 } = renderHook(() => useDashboardStats({ cacheTTL: shortTTL }));

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      // Should make fresh API calls after cache expired
      expect(mockExecute).toHaveBeenCalledTimes(3);
      expect(result2.current.stats?.totalFlashcards).toBe(25); // Updated value (not cached 20)
    });

    it("should bypass cache when explicitly refreshing", async () => {
      // Initial fetch
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 15 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 3 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 1 } },
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Refresh call
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 18 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 4 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 2 } },
        });

      await result.current.refetchStats();

      // Wait for the refetch to complete
      await waitFor(() => {
        expect(result.current.stats?.totalFlashcards).toBe(18);
      });

      expect(mockExecute).toHaveBeenCalledTimes(6);
    });
  });

  describe("hook options", () => {
    it("should not auto-fetch when autoFetch is false", () => {
      const { result } = renderHook(() => useDashboardStats({ autoFetch: false }));

      // Immediately check - no async operations should happen
      expect(result.current.loading).toBe(false);
      expect(mockExecute).not.toHaveBeenCalled();
      expect(result.current.stats).toBeNull();
    });

    it("should call onSuccess callback when data is fetched", async () => {
      const mockOnSuccess = vi.fn();

      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 10 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 2 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 1 } },
        });

      renderHook(() => useDashboardStats({ onSuccess: mockOnSuccess }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          totalFlashcards: 10,
          flashcardsToReviewToday: 2,
          totalGenerations: 1,
        })
      );
    });

    it("should call onError callback when fetch fails", async () => {
      const mockOnError = vi.fn();

      // Mock all 3 API calls - first one fails
      mockExecute
        .mockResolvedValueOnce({
          success: false,
          error: "Test error",
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 5 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 2 } },
        });

      renderHook(() => useDashboardStats({ onError: mockOnError }));

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });

      // First API call failed, so error message should be from that failure
      expect(mockOnError).toHaveBeenCalledWith("Test error");
    });
  });

  describe("loading states", () => {
    it("should show loading state during fetch", async () => {
      // Create a controlled promise
      let resolvePromise: ((value: { success: boolean; data?: unknown; error?: string }) => void) | undefined;
      const pendingPromise = new Promise<{ success: boolean; data?: unknown; error?: string }>((resolve) => {
        resolvePromise = resolve;
      });

      // Mock execute to return pending promise for ALL 3 calls (flashcards, review, generations)
      mockExecute.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useDashboardStats());

      // Initially should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBeNull();
      expect(result.current.error).toBeNull();

      // Resolve the promise for all 3 API calls
      resolvePromise?.({
        success: true,
        data: { data: [], pagination: { total: 5 } },
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should update lastFetched timestamp", async () => {
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 7 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 1 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 1 } },
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // lastFetched should be set to a recent timestamp
      expect(result.current.lastFetched).toBeInstanceOf(Date);
      expect(result.current.lastFetched).not.toBeNull();
    });
  });

  describe("complex scenarios", () => {
    it("should handle mixed success/failure API responses", async () => {
      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 20 } },
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Review API failed",
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 3 } },
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Review API failed");
      expect(result.current.stats).toBeNull();
    });

    it("should calculate AI acceptance rate correctly with edge cases", async () => {
      const edgeCaseGenerations: MockGeneration[] = [
        {
          id: "1",
          generated_count: 100,
          accepted_unedited_count: 50,
          accepted_edited_count: 25, // 75% acceptance
          created_at: "2024-06-15T10:00:00Z",
        },
        {
          id: "2",
          generated_count: 1,
          accepted_unedited_count: 0,
          accepted_edited_count: 1, // 100% acceptance
          created_at: "2024-06-14T15:30:00Z",
        },
      ];

      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 50 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 10 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: edgeCaseGenerations, pagination: { total: 2 } },
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // (50+25+0+1) / (100+1) * 100 = 75.2475... rounded to 75%
      expect(result.current.stats?.aiAcceptanceRate).toBe(75);
    });

    it("should handle very large numbers without overflow", async () => {
      const largeNumberGenerations: MockGeneration[] = [
        {
          id: "1",
          generated_count: 999999,
          accepted_unedited_count: 499999,
          accepted_edited_count: 249999,
          created_at: "2024-06-15T10:00:00Z",
        },
      ];

      mockExecute
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 1000000 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 50000 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: largeNumberGenerations, pagination: { total: 10000 } },
        });

      const { result } = renderHook(() => useDashboardStats());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats?.totalFlashcards).toBe(1000000);
      expect(result.current.stats?.aiAcceptanceRate).toBe(75); // Should handle large numbers
    });
  });
});
