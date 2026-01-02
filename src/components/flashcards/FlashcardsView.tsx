/**
 * FlashcardsView - Main container component for flashcards library
 * Manages the overall layout and coordinates between all subcomponents
 */

import React, { memo } from "react";
import { useFlashcardsState } from "./hooks/useFlashcardsState";

// Import components
import { FlashcardsTable } from "./FlashcardsTable";
import { PaginationControls } from "./PaginationControls";
// TODO: Will be implemented in next steps:
// import FlashcardsHeader from './FlashcardsHeader';
// import CreateFlashcardModal from './CreateFlashcardModal';
// import EditFlashcardModal from './EditFlashcardModal';
// import DeleteAlertDialog from './DeleteAlertDialog';

const FlashcardsView = memo(function FlashcardsView() {
  const { state, actions } = useFlashcardsState();

  const hasFilters = state.filters.status !== null || state.filters.source !== null;
  const isEmpty = state.flashcards.length === 0 && !state.loading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteka (Moje Fiszki)</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj swoją kolekcją fiszek - przeglądaj, edytuj, usuwaj i twórz nowe fiszki.
          </p>
        </div>
      </div>

      {/* Error state */}
      {state.error && (
        <div className="mb-6 p-4 bg-destructive/15 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-destructive flex-shrink-0"></div>
            <p className="text-destructive font-medium">Błąd</p>
          </div>
          <p className="text-destructive/80 mt-1">{state.error}</p>
          <button
            onClick={actions.fetchFlashcards}
            className="mt-3 px-3 py-1 bg-destructive/10 hover:bg-destructive/20 rounded text-sm text-destructive font-medium"
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Loading state */}
      {state.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Ładowanie fiszek...</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {!state.loading && (
        <>
          {/* Placeholder for FlashcardsHeader */}
          <div className="mb-6 p-4 border border-dashed border-muted-foreground/30 rounded-lg">
            <p className="text-muted-foreground text-sm">
              FlashcardsHeader (filtry i przycisk dodawania) - zostanie zaimplementowany w następnych krokach
            </p>
          </div>

          {/* Content area */}
          {isEmpty ? (
            /* Placeholder for EmptyState */
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {hasFilters ? "Brak fiszek spełniających kryteria" : "Brak fiszek"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasFilters
                    ? "Spróbuj zmienić filtry lub wyczyść je, aby zobaczyć więcej fiszek."
                    : "Rozpocznij budowanie swojej biblioteki fiszek dodając pierwszą fiszkę."}
                </p>
                <button
                  onClick={actions.openCreateModal}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
                >
                  {hasFilters ? "Dodaj nową fiszkę" : "Dodaj pierwszą fiszkę"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Main flashcards table */}
              <div className="mb-6">
                <FlashcardsTable
                  flashcards={state.flashcards}
                  loading={state.loading}
                  sort={state.sort}
                  onSortChange={actions.applySort}
                  onEditClick={actions.openEditModal}
                  onDeleteClick={actions.openDeleteDialog}
                  onCreateClick={actions.openCreateModal}
                  hasFilters={hasFilters}
                />
              </div>

              {/* Pagination controls */}
              <PaginationControls pagination={state.pagination} onPageChange={actions.changePage} />
            </>
          )}
        </>
      )}

      {/* Placeholder for Modals */}
      <div className="fixed bottom-4 right-4 space-y-2 max-w-xs">
        {state.modals.isCreateModalOpen && (
          <div className="p-3 bg-background border rounded-lg shadow-lg text-sm">
            <p className="font-medium">CreateFlashcardModal</p>
            <p className="text-muted-foreground">Modal do tworzenia fiszki</p>
            <button
              onClick={actions.closeModals}
              className="mt-2 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
            >
              Zamknij (placeholder)
            </button>
          </div>
        )}

        {state.modals.isEditModalOpen && (
          <div className="p-3 bg-background border rounded-lg shadow-lg text-sm">
            <p className="font-medium">EditFlashcardModal</p>
            <p className="text-muted-foreground">Modal do edycji fiszki</p>
            <button
              onClick={actions.closeModals}
              className="mt-2 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
            >
              Zamknij (placeholder)
            </button>
          </div>
        )}

        {state.modals.isDeleteDialogOpen && (
          <div className="p-3 bg-background border rounded-lg shadow-lg text-sm">
            <p className="font-medium">DeleteAlertDialog</p>
            <p className="text-muted-foreground">Dialog potwierdzenia usunięcia</p>
            <button
              onClick={actions.closeModals}
              className="mt-2 px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
            >
              Zamknij (placeholder)
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

FlashcardsView.displayName = "FlashcardsView";

export default FlashcardsView;
