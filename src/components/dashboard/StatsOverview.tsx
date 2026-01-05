/**
 * StatsOverview - Container for dashboard statistics cards
 * Manages responsive grid layout and coordinates stat card interactions
 */

import React, { memo } from "react";
import { StatCard } from "./StatCard";
import { cn } from "../../lib/utils";
import type { DashboardStats } from "../../types";
import { BookOpen, Brain, CheckCircle, Clock } from "lucide-react";

/* eslint-disable react/prop-types */
interface StatsOverviewProps {
  /** Dashboard statistics data */
  stats: DashboardStats | null;
  /** Loading state */
  loading: boolean;
  /** Error message if data fetching failed */
  error?: string | null;
  /** Callback for stat card clicks */
  onCardClick?: (cardType: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export const StatsOverview = memo<StatsOverviewProps>(function StatsOverview({
  stats,
  loading,
  error,
  onCardClick,
  className,
}) {
  // Format last activity date
  const formatLastActivity = (date?: Date): string => {
    if (!date) return "Brak aktywności";

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Dziś";
    if (diffDays === 1) return "Wczoraj";
    if (diffDays <= 7) return `${diffDays} dni temu`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} tygodni temu`;

    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Handle stat card clicks with proper typing
  const handleCardClick = (cardType: string) => {
    if (onCardClick && !loading && !error) {
      onCardClick(cardType);
    }
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className={cn("p-6 bg-destructive/10 border border-destructive/20 rounded-lg", className)}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full bg-destructive flex-shrink-0" />
          <p className="text-destructive font-medium">Błąd ładowania statystyk</p>
        </div>
        <p className="text-destructive/80 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4", className)}>
      {/* Flashcards to review today */}
      <StatCard
        title="Fiszki do powtórki dziś"
        value={stats?.flashcardsToReviewToday ?? 0}
        subtitle={
          stats?.flashcardsToReviewToday === 0
            ? "Świetnie! Wszystko na bieżąco"
            : stats?.flashcardsToReviewToday === 1
              ? "1 fiszka czeka"
              : `${stats?.flashcardsToReviewToday} fiszek czeka`
        }
        icon={<CheckCircle size={20} />}
        loading={loading}
        onClick={() => handleCardClick("flashcardsToReview")}
      />

      {/* Total flashcards */}
      <StatCard
        title="Wszystkie fiszki"
        value={stats?.totalFlashcards ?? 0}
        subtitle={
          stats?.totalFlashcards === 0
            ? "Rozpocznij swoją naukę"
            : stats?.totalFlashcards === 1
              ? "1 fiszka w kolekcji"
              : `${stats?.totalFlashcards} fiszek w kolekcji`
        }
        icon={<BookOpen size={20} />}
        loading={loading}
        onClick={() => handleCardClick("totalFlashcards")}
      />

      {/* AI acceptance rate */}
      <StatCard
        title="Wskaźnik akceptacji AI"
        value={stats ? `${stats.aiAcceptanceRate}%` : "0%"}
        subtitle={
          !stats?.totalGenerations
            ? "Brak generacji AI"
            : stats.aiAcceptanceRate >= 80
              ? "Doskonała jakość AI"
              : stats.aiAcceptanceRate >= 60
                ? "Dobra jakość AI"
                : "AI wymaga poprawy"
        }
        icon={<Brain size={20} />}
        loading={loading}
        onClick={() => handleCardClick("aiAcceptanceRate")}
      />

      {/* Last activity */}
      <StatCard
        title="Ostatnia aktywność"
        value={formatLastActivity(stats?.lastActivityDate)}
        subtitle={stats?.totalGenerations ? `${stats.totalGenerations} generacji łącznie` : "Jeszcze brak generacji"}
        icon={<Clock size={20} />}
        loading={loading}
        onClick={() => handleCardClick("lastActivity")}
      />
    </div>
  );
});

StatsOverview.displayName = "StatsOverview";
