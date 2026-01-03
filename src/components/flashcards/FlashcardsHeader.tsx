/**
 * FlashcardsHeader - Nagłówek widoku fiszek z filtrami i przyciskiem dodawania
 * Zawiera tytuł, opis, filtry statusu/źródła i przycisk tworzenia nowej fiszki
 */

import React, { useCallback } from "react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Plus, X } from "lucide-react";
import type { FlashcardFilters, FlashcardStatus, FlashcardSource } from "./types";

interface FlashcardsHeaderProps {
  filters: FlashcardFilters;
  onFiltersChange: (filters: FlashcardFilters) => void;
  onCreateClick: () => void;
  totalCount?: number;
  filteredCount?: number;
}

export function FlashcardsHeader({
  filters,
  onFiltersChange,
  onCreateClick,
  totalCount = 0,
  filteredCount = 0,
}: FlashcardsHeaderProps) {
  // Handle status filter change
  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === "all" ? null : (value as FlashcardStatus);
      onFiltersChange({ ...filters, status });
    },
    [filters, onFiltersChange]
  );

  // Handle source filter change
  const handleSourceChange = useCallback(
    (value: string) => {
      const source = value === "all" ? null : (value as FlashcardSource);
      onFiltersChange({ ...filters, source });
    },
    [filters, onFiltersChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    onFiltersChange({
      status: null,
      source: null,
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      repetitionRange: undefined,
    });
  }, [onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters = filters.status !== null || filters.source !== null;

  // Get status display name
  const getStatusDisplayName = (status: FlashcardStatus): string => {
    const statusNames: Record<FlashcardStatus, string> = {
      new: "Nowe",
      learning: "Nauka",
      review: "Powtórka",
      mastered: "Opanowane",
    };
    return statusNames[status];
  };

  // Get source display name
  const getSourceDisplayName = (source: FlashcardSource): string => {
    const sourceNames: Record<FlashcardSource, string> = {
      manual: "Ręczne",
      ai: "AI",
      mixed: "Mieszane",
    };
    return sourceNames[source];
  };

  return (
    <div className="space-y-6">
      {/* Title and description */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Biblioteka (Moje Fiszki)</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoją kolekcją fiszek - przeglądaj, edytuj, usuwaj i twórz nowe fiszki.
          </p>
          {/* Count information */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {hasActiveFilters ? (
                <>
                  Wyświetlane: <span className="font-medium">{filteredCount}</span> z{" "}
                  <span className="font-medium">{totalCount}</span> fiszek
                </>
              ) : (
                <>
                  Łącznie: <span className="font-medium">{totalCount}</span> fiszek
                </>
              )}
            </span>
          </div>
        </div>

        <Button onClick={onCreateClick} size="lg" className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj fiszkę
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Wszystkie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="new">Nowe</SelectItem>
                <SelectItem value="learning">Nauka</SelectItem>
                <SelectItem value="review">Powtórka</SelectItem>
                <SelectItem value="mastered">Opanowane</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Źródło:</span>
            <Select value={filters.source || "all"} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Wszystkie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="manual">Ręczne</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="mixed">Mieszane</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
              <X className="w-4 h-4 mr-2" />
              Wyczyść filtry
            </Button>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Aktywne filtry:</span>
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {getStatusDisplayName(filters.status)}
                  <button
                    onClick={() => handleStatusChange("all")}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.source && (
                <Badge variant="secondary" className="gap-1">
                  Źródło: {getSourceDisplayName(filters.source)}
                  <button
                    onClick={() => handleSourceChange("all")}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
