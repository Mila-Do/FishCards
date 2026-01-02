/**
 * EmptyState - Komponent wyświetlany gdy brak jest fiszek
 * Pokazuje odpowiedni komunikat i akcję w zależności od tego, czy są aktywne filtry
 */

import React from "react";
import { Button } from "../ui/button";

interface EmptyStateProps {
  onCreateClick: () => void;
  hasFilters: boolean;
}

export default function EmptyState({ onCreateClick, hasFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          {hasFilters ? (
            <svg
              className="w-10 h-10 text-muted-foreground"
              fill="none"
              strokeWidth={1.5}
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          ) : (
            <svg
              className="w-10 h-10 text-muted-foreground"
              fill="none"
              strokeWidth={1.5}
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3V16.5M15 12.75v.75m3-3V12M9 3.75H7.5a1.5 1.5 0 00-1.5 1.5v8.25M9 3.75h8.25A1.5 1.5 0 0118.75 5.25v8.25"
              />
            </svg>
          )}
        </div>

        {/* Heading and description */}
        <h3 className="text-xl font-semibold mb-3">
          {hasFilters ? "Brak fiszek spełniających kryteria" : "Brak fiszek"}
        </h3>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          {hasFilters
            ? "Nie znaleźliśmy fiszek pasujących do wybranych filtrów. Spróbuj zmienić filtry lub wyczyść je, aby zobaczyć więcej fiszek."
            : "Rozpocznij budowanie swojej biblioteki fiszek! Dodaj pierwszą fiszkę, aby zacząć naukę."}
        </p>

        {/* Action button */}
        <Button onClick={onCreateClick} size="lg" className="px-8">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {hasFilters ? "Dodaj nową fiszkę" : "Dodaj pierwszą fiszkę"}
        </Button>

        {/* Additional hint for filtered state */}
        {hasFilters && (
          <p className="text-sm text-muted-foreground mt-4">Lub wyczyść filtry, aby zobaczyć wszystkie fiszki</p>
        )}
      </div>
    </div>
  );
}
