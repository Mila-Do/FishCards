/**
 * SourceBadge - Znaczek wyświetlający źródło pochodzenia fiszki
 * Zawiera ikony i odpowiednie kolory dla każdego typu źródła
 */

import React from "react";
import { Badge } from "../ui/badge";
import type { FlashcardSource } from "./types";

interface SourceBadgeProps {
  source: FlashcardSource;
}

const SOURCE_CONFIG: Record<
  FlashcardSource,
  {
    label: string;
    icon: string;
    variant: "outline";
    className?: string;
  }
> = {
  manual: {
    label: "Ręczne",
    icon: "✏️",
    variant: "outline",
    className: "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
  },
  ai: {
    label: "AI",
    icon: "🤖",
    variant: "outline",
    className: "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300",
  },
  mixed: {
    label: "Mieszane",
    icon: "⚡",
    variant: "outline",
    className: "border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-300",
  },
};

export default function SourceBadge({ source }: SourceBadgeProps) {
  // Sprawdzenie czy źródło jest z dozwolonej listy
  if (!SOURCE_CONFIG[source]) {
    // console.warn(`Invalid flashcard source: ${source}`);
    return (
      <Badge variant="outline" className="border-gray-300 text-gray-700">
        ❓ Nieznane
      </Badge>
    );
  }

  const config = SOURCE_CONFIG[source];

  return (
    <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
      <span className="text-xs" role="img" aria-label={`Źródło: ${config.label}`}>
        {config.icon}
      </span>
      {config.label}
    </Badge>
  );
}
