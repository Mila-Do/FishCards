/**
 * FlashcardsView - Main container component for flashcards library
 * Manages the overall layout and coordinates between all subcomponents
 */

import React, { memo } from "react";
import { useFlashcardsState } from "./hooks/useFlashcardsState.new";

// Import components
import { FlashcardsTable } from "./FlashcardsTable";
import { PaginationControls } from "./PaginationControls";
import { FlashcardsHeader } from "./FlashcardsHeader";
import { CreateFlashcardModal } from "./CreateFlashcardModal";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteAlertDialog } from "./DeleteAlertDialog";

const FlashcardsView = memo(function FlashcardsView() {
  const { state, actions } = useFlashcardsState();

  const hasFilters = state.filters.status !== null || state.filters.source !== null;
  const isEmpty = state.flashcards.length === 0 && !state.loading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with filters and create button */}
      <div className="mb-8">
        <FlashcardsHeader
          filters={state.filters}
          onFiltersChange={actions.applyFilters}
          onCreateClick={actions.openCreateModal}
          totalCount={state.pagination.total}
          filteredCount={state.flashcards.length}
        />
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
          {/* Content area */}
          {isEmpty ? (
            /* Empty state handled by FlashcardsTable */
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

      {/* Modals */}
      <CreateFlashcardModal
        isOpen={state.modals.create.isOpen}
        onClose={actions.closeModals}
        onSubmit={actions.createFlashcard}
      />

      <EditFlashcardModal
        flashcard={state.modals.edit.data || null}
        isOpen={state.modals.edit.isOpen}
        onClose={actions.closeModals}
        onSubmit={actions.updateFlashcard}
      />

      <DeleteAlertDialog
        flashcard={state.modals.delete.data || null}
        isOpen={state.modals.delete.isOpen}
        onClose={actions.closeModals}
        onConfirm={actions.deleteFlashcard}
      />
    </div>
  );
});

FlashcardsView.displayName = "FlashcardsView";

export default FlashcardsView;
