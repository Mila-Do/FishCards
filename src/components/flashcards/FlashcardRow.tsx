/**
 * FlashcardRow - pojedynczy wiersz tabeli z fiszką i akcjami
 */

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import SourceBadge from "./SourceBadge";
import type { FlashcardViewModel, FlashcardStatus, FlashcardSource } from "./types";

interface FlashcardRowProps {
  flashcard: FlashcardViewModel;
  onEditClick: (flashcard: FlashcardViewModel) => void;
  onDeleteClick: (flashcard: FlashcardViewModel) => void;
}

/**
 * Obcina długi tekst do określonej liczby znaków z dodaniem "..."
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Formatuje datę do czytelnego formatu polskiego
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FlashcardRow({ flashcard, onEditClick, onDeleteClick }: FlashcardRowProps) {
  return (
    <TableRow className={flashcard.isLoading ? "opacity-50" : ""}>
      {/* Front content */}
      <TableCell className="font-medium max-w-[200px]">
        <div className="truncate" title={flashcard.front}>
          {truncateText(flashcard.front, 50)}
        </div>
      </TableCell>

      {/* Back content */}
      <TableCell className="max-w-[250px]">
        <div className="truncate" title={flashcard.back}>
          {truncateText(flashcard.back, 60)}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge status={flashcard.status as FlashcardStatus} />
      </TableCell>

      {/* Source */}
      <TableCell>
        <SourceBadge source={flashcard.source as FlashcardSource} />
      </TableCell>

      {/* Repetition count */}
      <TableCell className="text-center">
        <span className="text-sm text-muted-foreground">{flashcard.repetition_count}</span>
      </TableCell>

      {/* Created date */}
      <TableCell className="text-sm text-muted-foreground">{formatDate(flashcard.created_at)}</TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditClick(flashcard)}
            disabled={flashcard.isLoading}
            className="h-8 w-8 p-0"
            title="Edytuj fiszkę"
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteClick(flashcard)}
            disabled={flashcard.isLoading}
            className="h-8 w-8 p-0"
            title="Usuń fiszkę"
          >
            🗑️
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
