/**
 * Local types for flashcards components
 * Extends the base API types with UI-specific properties
 * Uses common types from lib/types/common.ts for consistency
 */

import type {
  ValidationResult,
  FieldValidationErrors,
  LoadingState,
  ErrorState,
  SortState,
  ModalState,
  FilterState,
} from "../../lib/types/common";

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
  sort: FlashcardSortState;
  modals: FlashcardModalState;
  selectedCount: number;
  // Add validation state
  validationErrors: FieldValidationErrors;
}

/**
 * Filters available for flashcards - extends common FilterState
 */
export interface FlashcardFilters
  extends FilterState<{
    status: FlashcardStatus;
    source: FlashcardSource;
  }> {
  // Add flashcard-specific filters
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  repetitionRange?: { min: number; max: number };
}

/**
 * Current sort state - more specific than common SortState
 */
export type FlashcardSortState = SortState<FlashcardSortField>;

/**
 * Modal state management - extends common ModalState
 */
export interface FlashcardModalState {
  create: ModalState & { data?: Partial<CreateFlashcardCommand> };
  edit: ModalState & { data?: FlashcardViewModel };
  delete: ModalState & { data?: FlashcardViewModel };
  view: ModalState & { data?: FlashcardViewModel };
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
// Validation Types (extending common validation)
// ============================================================================

/**
 * Flashcard-specific validation result
 */
export interface FlashcardValidationResult extends ValidationResult {
  fieldErrors: FieldValidationErrors;
}

/**
 * Form validation state for flashcards
 */
export interface FlashcardFormValidation {
  front: ValidationResult;
  back: ValidationResult;
  status: ValidationResult;
  source: ValidationResult;
  overall: ValidationResult;
}

// ============================================================================
// Enhanced Loading and Error States
// ============================================================================

/**
 * Flashcards-specific loading state
 */
export interface FlashcardsLoadingState extends LoadingState {
  isFetching?: boolean;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
  isFiltering?: boolean;
}

/**
 * Flashcards-specific error state
 */
export interface FlashcardsErrorState extends ErrorState {
  type?: "fetch" | "create" | "update" | "delete" | "validation" | "network";
  flashcardId?: number; // For operation-specific errors
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for FlashcardRow component
 */
export interface FlashcardRowProps {
  flashcard: FlashcardViewModel;
  onEditClick: (flashcard: FlashcardViewModel) => void;
  onDeleteClick: (flashcard: FlashcardViewModel) => void;
  onViewClick?: (flashcard: FlashcardViewModel) => void;
  isSelected?: boolean;
  onSelectionChange?: (flashcard: FlashcardViewModel, selected: boolean) => void;
}

/**
 * Props for FlashcardsTable component
 */
export interface FlashcardsTableProps {
  flashcards: FlashcardViewModel[];
  loading: boolean;
  sort: FlashcardSortState;
  onSortChange: (field: FlashcardSortField) => void;
  onEditClick: (flashcard: FlashcardViewModel) => void;
  onDeleteClick: (flashcard: FlashcardViewModel) => void;
  onCreateClick?: () => void;
  hasFilters?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
}

/**
 * Props for PaginationControls component
 */
export interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  onCreateClick: () => void;
  hasFilters: boolean;
  title?: string;
  description?: string;
  actionText?: string;
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
