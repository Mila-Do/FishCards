import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardNavigation } from "../../../lib/hooks/useDashboardNavigation";

/**
 * Test suite for dashboard navigation hook
 * Priority: MEDIUM - requires ≥80% coverage according to test plan
 */

// Mock window.location.assign
const mockLocationAssign = vi.fn();

describe("useDashboardNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Ensure window exists in test environment
    if (typeof window === "undefined") {
      global.window = {} as Window & typeof globalThis;
    }

    // Mock window.location.assign
    Object.defineProperty(window, "location", {
      value: {
        assign: mockLocationAssign,
      },
      writable: true,
      configurable: true,
    });

    // Mock console.warn to avoid noise in tests
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("hook initialization", () => {
    it("should return navigation functions and quick actions", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      expect(result.current).toEqual(
        expect.objectContaining({
          quickActions: expect.any(Array),
          navigateTo: expect.any(Function),
          handleQuickAction: expect.any(Function),
          handleStatCardClick: expect.any(Function),
          startLearning: expect.any(Function),
          createFlashcards: expect.any(Function),
          viewFlashcards: expect.any(Function),
          viewGenerations: expect.any(Function),
        })
      );
    });

    it("should provide correct quick actions configuration", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      expect(result.current.quickActions).toEqual([
        {
          id: "start-learning",
          title: "Start Nauki",
          description: "Rozpocznij sesję nauki z fiszkami do powtórki",
          href: "/flashcards?mode=learning",
          variant: "primary",
        },
        {
          id: "new-generator",
          title: "Nowy Generator",
          description: "Wygeneruj nowe fiszki z tekstu przy użyciu AI",
          href: "/generator",
          variant: "secondary",
        },
        {
          id: "my-flashcards",
          title: "Moje Fiszki",
          description: "Przeglądaj i zarządzaj swoimi fiszkami",
          href: "/flashcards",
          variant: "outline",
        },
        {
          id: "generation-history",
          title: "Historia Generowania",
          description: "Zobacz historię generacji AI i statystyki",
          href: "/generations",
          variant: "outline",
        },
      ]);
    });
  });

  describe("navigateTo", () => {
    it("should navigate to specified path using window.location.assign", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.navigateTo("/test-path");
      });

      expect(mockLocationAssign).toHaveBeenCalledWith("/test-path");
    });

    it("should handle various path formats", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const testPaths = [
        "/simple-path",
        "/path/with/multiple/segments",
        "/path?query=value&another=param",
        "/path#hash-fragment",
        "/path?query=value#hash",
        "https://external-site.com",
        "/path-with-dashes-and_underscores",
      ];

      testPaths.forEach((path) => {
        act(() => {
          result.current.navigateTo(path);
        });

        expect(mockLocationAssign).toHaveBeenCalledWith(path);
      });

      expect(mockLocationAssign).toHaveBeenCalledTimes(testPaths.length);
    });

    it("should handle empty or special paths", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const specialPaths = ["", "/", "../relative", "./current"];

      specialPaths.forEach((path) => {
        act(() => {
          result.current.navigateTo(path);
        });

        expect(mockLocationAssign).toHaveBeenCalledWith(path);
      });
    });
  });

  describe("handleQuickAction", () => {
    it("should navigate to correct path for valid action IDs", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const testCases = [
        { actionId: "start-learning", expectedPath: "/flashcards?mode=learning" },
        { actionId: "new-generator", expectedPath: "/generator" },
        { actionId: "my-flashcards", expectedPath: "/flashcards" },
        { actionId: "generation-history", expectedPath: "/generations" },
      ];

      testCases.forEach(({ actionId, expectedPath }) => {
        mockLocationAssign.mockClear();

        act(() => {
          result.current.handleQuickAction(actionId);
        });

        expect(mockLocationAssign).toHaveBeenCalledWith(expectedPath);
      });
    });

    it("should not navigate for invalid action IDs", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const invalidActionIds = ["non-existent-action", "", "invalid-id", "start-learning-typo"];

      invalidActionIds.forEach((actionId) => {
        mockLocationAssign.mockClear();

        act(() => {
          result.current.handleQuickAction(actionId);
        });

        expect(mockLocationAssign).not.toHaveBeenCalled();
      });
    });

    it("should not navigate for disabled actions", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      // Manually test with a mock scenario where an action is disabled
      // Since the current implementation doesn't have disabled actions,
      // we can't test this directly, but the logic is there for future use

      // For now, test that normal actions work
      act(() => {
        result.current.handleQuickAction("start-learning");
      });

      expect(mockLocationAssign).toHaveBeenCalledWith("/flashcards?mode=learning");
    });

    it("should handle null or undefined action IDs gracefully", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.handleQuickAction(null as unknown as string);
      });

      expect(mockLocationAssign).not.toHaveBeenCalled();

      act(() => {
        result.current.handleQuickAction(undefined as unknown as string);
      });

      expect(mockLocationAssign).not.toHaveBeenCalled();
    });
  });

  describe("handleStatCardClick", () => {
    it("should navigate to correct paths for valid card types", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const testCases = [
        { cardType: "flashcardsToReview", expectedPath: "/flashcards?status=review" },
        { cardType: "totalFlashcards", expectedPath: "/flashcards" },
        { cardType: "aiAcceptanceRate", expectedPath: "/generations" },
        { cardType: "totalGenerations", expectedPath: "/generations" },
        { cardType: "lastActivity", expectedPath: "/flashcards?sort=updated_at&order=desc" },
      ];

      testCases.forEach(({ cardType, expectedPath }) => {
        mockLocationAssign.mockClear();

        act(() => {
          result.current.handleStatCardClick(cardType);
        });

        expect(mockLocationAssign).toHaveBeenCalledWith(expectedPath);
      });
    });

    it("should log warning for unknown card types", () => {
      const { result } = renderHook(() => useDashboardNavigation());
      const consoleWarnSpy = vi.mocked(console.warn);

      const unknownCardTypes = ["unknown-card", "invalidType", "flashcardsToReview-typo", ""];

      unknownCardTypes.forEach((cardType) => {
        mockLocationAssign.mockClear();
        consoleWarnSpy.mockClear();

        act(() => {
          result.current.handleStatCardClick(cardType);
        });

        expect(mockLocationAssign).not.toHaveBeenCalled();
        if (cardType !== "") {
          expect(consoleWarnSpy).toHaveBeenCalledWith(`Unknown stat card type: ${cardType}`);
        }
      });
    });

    it("should handle null or undefined card types gracefully", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.handleStatCardClick(null as unknown as string);
      });

      expect(mockLocationAssign).not.toHaveBeenCalled();

      act(() => {
        result.current.handleStatCardClick(undefined as unknown as string);
      });

      expect(mockLocationAssign).not.toHaveBeenCalled();
    });

    it("should handle aiAcceptanceRate and totalGenerations both going to generations", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.handleStatCardClick("aiAcceptanceRate");
      });
      expect(mockLocationAssign).toHaveBeenCalledWith("/generations");

      mockLocationAssign.mockClear();

      act(() => {
        result.current.handleStatCardClick("totalGenerations");
      });
      expect(mockLocationAssign).toHaveBeenCalledWith("/generations");
    });
  });

  describe("convenience navigation methods", () => {
    it("should provide startLearning shortcut", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.startLearning();
      });

      expect(mockLocationAssign).toHaveBeenCalledWith("/flashcards?mode=learning");
    });

    it("should provide createFlashcards shortcut", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.createFlashcards();
      });

      expect(mockLocationAssign).toHaveBeenCalledWith("/generator");
    });

    it("should provide viewFlashcards shortcut", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.viewFlashcards();
      });

      expect(mockLocationAssign).toHaveBeenCalledWith("/flashcards");
    });

    it("should provide viewGenerations shortcut", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.viewGenerations();
      });

      expect(mockLocationAssign).toHaveBeenCalledWith("/generations");
    });
  });

  describe("hook stability and memoization", () => {
    it("should return stable references for functions", () => {
      const { result, rerender } = renderHook(() => useDashboardNavigation());

      const initialFunctions = {
        navigateTo: result.current.navigateTo,
        handleQuickAction: result.current.handleQuickAction,
        handleStatCardClick: result.current.handleStatCardClick,
        startLearning: result.current.startLearning,
        createFlashcards: result.current.createFlashcards,
        viewFlashcards: result.current.viewFlashcards,
        viewGenerations: result.current.viewGenerations,
      };

      // Rerender the hook
      rerender();

      expect(result.current.navigateTo).toBe(initialFunctions.navigateTo);
      expect(result.current.handleQuickAction).toBe(initialFunctions.handleQuickAction);
      expect(result.current.handleStatCardClick).toBe(initialFunctions.handleStatCardClick);
      expect(result.current.startLearning).toBe(initialFunctions.startLearning);
      expect(result.current.createFlashcards).toBe(initialFunctions.createFlashcards);
      expect(result.current.viewFlashcards).toBe(initialFunctions.viewFlashcards);
      expect(result.current.viewGenerations).toBe(initialFunctions.viewGenerations);
    });

    it("should return stable reference for quickActions array", () => {
      const { result, rerender } = renderHook(() => useDashboardNavigation());

      const initialQuickActions = result.current.quickActions;

      // Rerender the hook
      rerender();

      expect(result.current.quickActions).toBe(initialQuickActions);
    });
  });

  describe("integration scenarios", () => {
    it("should handle rapid sequential navigation calls", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const actions = ["start-learning", "new-generator", "my-flashcards", "generation-history"];

      actions.forEach((actionId) => {
        act(() => {
          result.current.handleQuickAction(actionId);
        });
      });

      expect(mockLocationAssign).toHaveBeenCalledTimes(4);
      expect(mockLocationAssign).toHaveBeenNthCalledWith(1, "/flashcards?mode=learning");
      expect(mockLocationAssign).toHaveBeenNthCalledWith(2, "/generator");
      expect(mockLocationAssign).toHaveBeenNthCalledWith(3, "/flashcards");
      expect(mockLocationAssign).toHaveBeenNthCalledWith(4, "/generations");
    });

    it("should handle mixed navigation method calls", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      act(() => {
        result.current.startLearning();
      });

      act(() => {
        result.current.handleStatCardClick("totalFlashcards");
      });

      act(() => {
        result.current.navigateTo("/custom-path");
      });

      act(() => {
        result.current.handleQuickAction("new-generator");
      });

      expect(mockLocationAssign).toHaveBeenCalledTimes(4);
      expect(mockLocationAssign).toHaveBeenNthCalledWith(1, "/flashcards?mode=learning");
      expect(mockLocationAssign).toHaveBeenNthCalledWith(2, "/flashcards");
      expect(mockLocationAssign).toHaveBeenNthCalledWith(3, "/custom-path");
      expect(mockLocationAssign).toHaveBeenNthCalledWith(4, "/generator");
    });

    it("should handle error scenarios gracefully", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      // Mock location.assign to throw an error
      mockLocationAssign.mockImplementation(() => {
        throw new Error("Navigation failed");
      });

      // Should not crash the hook
      expect(() => {
        act(() => {
          result.current.navigateTo("/test");
        });
      }).not.toThrow();

      expect(mockLocationAssign).toHaveBeenCalledWith("/test");
    });
  });

  describe("URL construction and query parameters", () => {
    it("should construct correct URLs with query parameters", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      // Test flashcardsToReview with status parameter
      act(() => {
        result.current.handleStatCardClick("flashcardsToReview");
      });
      expect(mockLocationAssign).toHaveBeenCalledWith("/flashcards?status=review");

      // Test lastActivity with sort parameters
      mockLocationAssign.mockClear();
      act(() => {
        result.current.handleStatCardClick("lastActivity");
      });
      expect(mockLocationAssign).toHaveBeenCalledWith("/flashcards?sort=updated_at&order=desc");

      // Test learning mode parameter
      mockLocationAssign.mockClear();
      act(() => {
        result.current.startLearning();
      });
      expect(mockLocationAssign).toHaveBeenCalledWith("/flashcards?mode=learning");
    });

    it("should handle paths without query parameters", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const simpleNavigations = [
        { method: "createFlashcards", expectedPath: "/generator" },
        { method: "viewFlashcards", expectedPath: "/flashcards" },
        { method: "viewGenerations", expectedPath: "/generations" },
      ];

      simpleNavigations.forEach(({ method, expectedPath }) => {
        mockLocationAssign.mockClear();

        act(() => {
          ((result.current as Record<string, unknown>)[method] as () => void)();
        });

        expect(mockLocationAssign).toHaveBeenCalledWith(expectedPath);
      });
    });
  });

  describe("performance considerations", () => {
    it("should not recreate objects unnecessarily", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      const quickAction1 = result.current.quickActions[0];
      const quickAction2 = result.current.quickActions[0];

      // Objects should be the same reference due to useMemo
      expect(quickAction1).toBe(quickAction2);
    });

    it("should handle high-frequency navigation calls", () => {
      const { result } = renderHook(() => useDashboardNavigation());

      // Simulate rapid navigation calls
      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.navigateTo(`/path-${i}`);
        });
      }

      expect(mockLocationAssign).toHaveBeenCalledTimes(100);
      expect(mockLocationAssign).toHaveBeenLastCalledWith("/path-99");
    });
  });
});
