/**
 * DashboardView - Main dashboard container component
 * Orchestrates all dashboard components and manages overall state
 */

import React, { memo, useCallback } from "react";
import { AuthGuard } from "../auth/AuthGuard";
import { StatsOverview } from "./StatsOverview";
import { QuickActionButtons } from "./QuickActionButtons";
import { useDashboardStats } from "../../lib/hooks/useDashboardStats";
import { useDashboardNavigation } from "../../lib/hooks/useDashboardNavigation";
import { cn } from "../../lib/utils";

interface DashboardViewProps {
  /** Additional CSS classes */
  className?: string;
}

/* eslint-disable react/prop-types */
const DashboardView = memo<DashboardViewProps>(function DashboardView({ className }) {
  // Memoized error handler to prevent infinite re-renders
  const handleStatsError = useCallback((error: string) => {
    // Silent error handling - errors are displayed in UI
    void error;
  }, []);

  // Dashboard state management
  const { stats, loading, error, refetchStats } = useDashboardStats({
    autoFetch: true,
    onError: handleStatsError,
  });

  // Navigation management
  const { quickActions, handleQuickAction, handleStatCardClick } = useDashboardNavigation();

  // Handle retry when stats loading fails
  const handleRetry = useCallback(async () => {
    try {
      await refetchStats();
    } catch (error) {
      // Error will be handled by the hook
      void error;
    }
  }, [refetchStats]);

  // Handle pull-to-refresh (future enhancement)
  // const handleRefresh = useCallback(async () => {
  //   await refetchStats();
  // }, [refetchStats]);

  return (
    <AuthGuard>
      <div className={cn("container mx-auto px-4 py-8 space-y-8 max-w-7xl", className)}>
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Przegląd Twojej nauki i szybki dostęp do funkcji aplikacji</p>
        </div>

        {/* Error state with retry */}
        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-destructive flex-shrink-0" />
              <p className="text-destructive font-medium">Błąd ładowania dashboard</p>
            </div>
            <p className="text-destructive/80 mb-3 text-sm">{error}</p>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-destructive/10 hover:bg-destructive/20 rounded text-sm text-destructive font-medium transition-colors"
              disabled={loading}
            >
              {loading ? "Ładowanie..." : "Spróbuj ponownie"}
            </button>
          </div>
        )}

        {/* Main content */}
        <div className="space-y-8">
          {/* Statistics overview */}
          <section aria-label="Statystyki dashboard">
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight">Twoje statystyki</h2>
              <p className="text-sm text-muted-foreground">Przegląd postępów w nauce i aktywności</p>
            </div>

            <StatsOverview stats={stats} loading={loading} error={error} onCardClick={handleStatCardClick} />
          </section>

          {/* Quick actions */}
          <section aria-label="Szybkie akcje">
            <QuickActionButtons actions={quickActions} disabled={loading} onActionClick={handleQuickAction} />
          </section>

          {/* Empty state for new users */}
          {!loading && !error && stats && stats.totalFlashcards === 0 && (
            <div className="text-center py-12 px-4">
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-lg font-semibold">Witaj w FishCards! 🎉</h3>
                <p className="text-muted-foreground">
                  Rozpocznij swoją przygodę z nauką tworząc pierwsze fiszki. Użyj generatora AI lub stwórz je ręcznie.
                </p>
                <div className="flex gap-2 justify-center mt-6">
                  <button
                    onClick={() => handleQuickAction("new-generator")}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Generuj z AI
                  </button>
                  <button
                    onClick={() => handleQuickAction("my-flashcards")}
                    className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
                  >
                    Stwórz ręcznie
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        {!loading && stats && stats.totalFlashcards > 0 && (
          <div className="pt-8 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Ostatnia aktualizacja:{" "}
              {new Date().toLocaleString("pl-PL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
});

DashboardView.displayName = "DashboardView";

export { DashboardView };
