/**
 * Local types for flashcards components
 * Extends the base API types with UI-specific properties
 */

import type {
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  DeleteFlashcardResponse,
  FlashcardQueryParams,
  PaginatedFlashcardsResponse,
  PaginationMeta,
  ErrorResponse,
  FlashcardStatus,
  FlashcardSource,
  FlashcardSortField,
  SortOrder,
} from "../../types";

// ============================================================================
// UI-specific types extending base API types
// ============================================================================

/**
 * FlashcardViewModel - extends FlashcardDTO with UI state properties
 */
export interface FlashcardViewModel extends FlashcardDTO {
  isLoading?: boolean; // Stan ładowania dla operacji na konkretnej fiszce
  isEditing?: boolean; // Flaga dla trybu edycji inline (opcjonalnie)
}

/**
 * Main view state for the flashcards page
 */
export interface FlashcardsViewState {
  flashcards: FlashcardViewModel[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: FlashcardFilters;
  sort: SortState;
  modals: ModalState;
  selectedCount: number;
}

/**
 * Filters available for flashcards
 */
export interface FlashcardFilters {
  status: FlashcardStatus | null;
  source: FlashcardSource | null;
}

/**
 * Current sort state
 */
export interface SortState {
  field: FlashcardSortField;
  order: SortOrder;
}

/**
 * Modal state management
 */
export interface ModalState {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedFlashcard: FlashcardViewModel | null;
}

/**
 * Form data for creating new flashcard
 */
export interface CreateFlashcardForm {
  front: string;
  back: string;
  source: FlashcardSource;
}

/**
 * Form data for editing existing flashcard
 */
export interface EditFlashcardForm {
  front: string;
  back: string;
  status: FlashcardStatus;
  source: FlashcardSource;
  repetition_count: number;
}

// ============================================================================
// Re-export API types for convenience
// ============================================================================

export type {
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  DeleteFlashcardResponse,
  FlashcardQueryParams,
  PaginatedFlashcardsResponse,
  PaginationMeta,
  ErrorResponse,
  FlashcardStatus,
  FlashcardSource,
  FlashcardSortField,
  SortOrder,
};
