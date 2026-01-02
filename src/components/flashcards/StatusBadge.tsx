/**
 * StatusBadge - Kolorowy znaczek wyświetlający status fiszki
 * Używa odpowiednich kolorów i wariantów dla każdego statusu
 */

import React from "react";
import { Badge } from "../ui/badge";
import type { FlashcardStatus } from "./types";

interface StatusBadgeProps {
  status: FlashcardStatus;
}

const STATUS_CONFIG: Record<FlashcardStatus, { label: string; variant: "secondary"; className?: string }> = {
  new: {
    label: "Nowe",
    variant: "secondary",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300",
  },
  learning: {
    label: "Uczenie się",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300",
  },
  review: {
    label: "Powtórka",
    variant: "secondary",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300",
  },
  mastered: {
    label: "Opanowane",
    variant: "secondary",
    className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Sprawdzenie czy status jest z dozwolonej listy
  if (!STATUS_CONFIG[status]) {
    // console.warn(`Invalid flashcard status: ${status}`);
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        Nieznany
      </Badge>
    );
  }

  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
