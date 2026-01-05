/**
 * Hook for managing dashboard navigation logic
 * Encapsulates routing and navigation patterns for dashboard interactions
 */

import { useCallback, useMemo } from "react";
import type { QuickAction } from "../../types";

export function useDashboardNavigation() {
  // Navigate to different sections of the app
  const navigateTo = useCallback((path: string) => {
    // Use client-side navigation for SPA-like experience
    window.location.assign(path);
  }, []);

  // Quick action configurations
  const quickActions: QuickAction[] = useMemo(
    () => [
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
    ],
    []
  );

  // Handle quick action clicks
  const handleQuickAction = useCallback(
    (actionId: string) => {
      const action = quickActions.find((a) => a.id === actionId);
      if (action && !action.disabled) {
        navigateTo(action.href);
      }
    },
    [navigateTo, quickActions]
  );

  // Handle stat card clicks for detailed views
  const handleStatCardClick = useCallback(
    (cardType: string) => {
      switch (cardType) {
        case "flashcardsToReview":
          navigateTo("/flashcards?status=review");
          break;
        case "totalFlashcards":
          navigateTo("/flashcards");
          break;
        case "aiAcceptanceRate":
        case "totalGenerations":
          navigateTo("/generations");
          break;
        case "lastActivity":
          // Could navigate to activity log or recent items
          navigateTo("/flashcards?sort=updated_at&order=desc");
          break;
        default:
          // eslint-disable-next-line no-console
          console.warn(`Unknown stat card type: ${cardType}`);
      }
    },
    [navigateTo]
  );

  // Navigation helpers for specific actions
  const startLearning = useCallback(() => {
    navigateTo("/flashcards?mode=learning");
  }, [navigateTo]);

  const createFlashcards = useCallback(() => {
    navigateTo("/generator");
  }, [navigateTo]);

  const viewFlashcards = useCallback(() => {
    navigateTo("/flashcards");
  }, [navigateTo]);

  const viewGenerations = useCallback(() => {
    navigateTo("/generations");
  }, [navigateTo]);

  return {
    quickActions,
    navigateTo,
    handleQuickAction,
    handleStatCardClick,
    startLearning,
    createFlashcards,
    viewFlashcards,
    viewGenerations,
  };
}
