/**
 * FlashcardsTable - główna tabela z fiszkami i sortowaniem
 */

import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FlashcardRow } from "./FlashcardRow";
import EmptyState from "./EmptyState";
import type { FlashcardViewModel, FlashcardSortField, FlashcardSortState } from "./types";

interface FlashcardsTableProps {
  flashcards: FlashcardViewModel[];
  loading: boolean;
  sort: FlashcardSortState;
  onSortChange: (field: FlashcardSortField) => void;
  onEditClick: (flashcard: FlashcardViewModel) => void;
  onDeleteClick: (flashcard: FlashcardViewModel) => void;
  onCreateClick: () => void;
  hasFilters: boolean;
}

interface SortableHeaderProps {
  field: FlashcardSortField;
  currentSort: FlashcardSortState;
  onSortChange: (field: FlashcardSortField) => void;
  children: React.ReactNode;
  className?: string;
}

function SortableHeader({ field, currentSort, onSortChange, children, className }: SortableHeaderProps) {
  const isActive = currentSort.field === field;
  const isDesc = isActive && currentSort.order === "desc";

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => onSortChange(field)}
      >
        <span className="flex items-center gap-1">
          {children}
          <span className="text-xs">{isActive ? (isDesc ? "↓" : "↑") : "↕️"}</span>
        </span>
      </Button>
    </TableHead>
  );
}

export function FlashcardsTable({
  flashcards,
  loading,
  sort,
  onSortChange,
  onEditClick,
  onDeleteClick,
  onCreateClick,
  hasFilters,
}: FlashcardsTableProps) {
  // Loading state
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Przód</TableHead>
              <TableHead className="w-[250px]">Tył</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Źródło</TableHead>
              <TableHead className="w-[80px] text-center">Powtórki</TableHead>
              <TableHead className="w-[140px]">Data utworzenia</TableHead>
              <TableHead className="w-[100px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableHead colSpan={7} className="h-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Ładowanie fiszek...</span>
                  </div>
                </TableHead>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (flashcards.length === 0) {
    return (
      <div className="rounded-md border p-8">
        <EmptyState onCreateClick={onCreateClick} hasFilters={hasFilters} />
      </div>
    );
  }

  // Table with data
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Przód</TableHead>
            <TableHead className="w-[250px]">Tył</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[100px]">Źródło</TableHead>
            <SortableHeader
              field="repetition_count"
              currentSort={sort}
              onSortChange={onSortChange}
              className="w-[80px] text-center"
            >
              Powtórki
            </SortableHeader>
            <SortableHeader field="created_at" currentSort={sort} onSortChange={onSortChange} className="w-[140px]">
              Data utworzenia
            </SortableHeader>
            <TableHead className="w-[100px]">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flashcards.map((flashcard) => (
            <FlashcardRow
              key={flashcard.id}
              flashcard={flashcard}
              onEditClick={onEditClick}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
