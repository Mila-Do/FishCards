/**
 * PaginationControls - nawigacja po stronach z informacjami o aktualnej stronie
 */

import React from "react";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "./types";

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { page, limit, total, total_pages } = pagination;

  // Nie wyświetlaj paginacji jeśli jest tylko jedna strona lub brak danych
  if (total_pages <= 1 || total === 0) {
    return null;
  }

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generowanie numerów stron do wyświetlenia
  const getVisiblePages = (): number[] => {
    const visiblePages: number[] = [];
    const maxVisible = 5; // Maksymalna liczba widocznych numerów stron

    if (total_pages <= maxVisible) {
      // Jeśli mało stron, pokaż wszystkie
      for (let i = 1; i <= total_pages; i++) {
        visiblePages.push(i);
      }
    } else {
      // Logika dla większej liczby stron
      if (page <= 3) {
        // Na początku
        for (let i = 1; i <= 4; i++) {
          visiblePages.push(i);
        }
        if (total_pages > 5) {
          visiblePages.push(-1); // Placeholder dla "..."
        }
        visiblePages.push(total_pages);
      } else if (page >= total_pages - 2) {
        // Na końcu
        visiblePages.push(1);
        if (total_pages > 5) {
          visiblePages.push(-1); // Placeholder dla "..."
        }
        for (let i = total_pages - 3; i <= total_pages; i++) {
          visiblePages.push(i);
        }
      } else {
        // W środku
        visiblePages.push(1);
        visiblePages.push(-1); // "..."
        for (let i = page - 1; i <= page + 1; i++) {
          visiblePages.push(i);
        }
        visiblePages.push(-2); // "..."
        visiblePages.push(total_pages);
      }
    }

    return visiblePages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-between px-2">
      {/* Informacja o zakresie wyników */}
      <div className="text-sm text-muted-foreground">
        Wyświetlane {startItem}-{endItem} z {total} fiszek
      </div>

      {/* Kontrolki nawigacji */}
      <div className="flex items-center space-x-1">
        {/* Przycisk "Poprzednia" */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="h-8 px-3"
        >
          ← Poprzednia
        </Button>

        {/* Numery stron */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((pageNum, index) => {
            if (pageNum === -1 || pageNum === -2) {
              // Placeholder dla "..."
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-muted-foreground">
                  ...
                </span>
              );
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Przycisk "Następna" */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === total_pages}
          className="h-8 px-3"
        >
          Następna →
        </Button>
      </div>
    </div>
  );
}
