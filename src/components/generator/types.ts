/**
 * Types for Generator View components
 */

// ============================================================================
// Main State Interfaces
// ============================================================================

export interface GeneratorViewState {
  sourceText: string;
  proposals: ProposalState[];
  isLoadingProposals: boolean; // dla ProposalsSkeleton
  isSavingFlashcards: boolean; // dla LoadingOverlay
  errors: ValidationErrors;
  generationId: number | null;
  selectedCount: number;
}

export interface ProposalState {
  id: string; // lokalne UUID dla UI
  front: string;
  back: string;
  source: "ai" | "mixed";
  status: "pending" | "accepted" | "rejected" | "editing";
  isEdited: boolean;
  originalFront: string;
  originalBack: string;
  validationErrors: {
    front?: string[];
    back?: string[];
  };
}

export interface TextInputState {
  value: string;
  isValid: boolean;
  characterCount: number;
  errors: string[];
}

export interface ValidationErrors {
  textInput?: string[];
  proposals?: Record<string, string[]>;
  api?: string;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  errors: string[];
}

export interface CharacterCounterProps {
  count: number;
  min: number;
  max: number;
  isValid: boolean;
}

export interface GenerateButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}

export interface ProposalCardProps {
  proposal: ProposalState;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
  onSave: (front: string, back: string) => void;
}

export interface ProposalsSectionProps {
  proposals: ProposalState[];
  onSave: () => void;
  isVisible: boolean;
  selectedCount: number;
  isLoading: boolean; // dla wyĹ›wietlania skeleton
  onUpdateProposal: (id: string, updates: Partial<ProposalState>) => void;
}

export interface ProposalsSkeletonProps {
  count?: number; // liczba skeleton cards, domyĹ›lnie 4
}

export interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

// ============================================================================
// API Integration Types (re-export from main types)
// ============================================================================

export type {
  CreateGenerationCommand,
  GenerationProposalsResponse,
  FlashcardProposal,
  CreateFlashcardsCommand,
  FlashcardDTO,
  ErrorResponse,
  FlashcardSource,
} from "../../types";

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION_LIMITS = {
  SOURCE_TEXT_MIN: 1000,
  SOURCE_TEXT_MAX: 10000,
  FLASHCARD_FRONT_MAX: 200,
  FLASHCARD_BACK_MAX: 500,
  DEBOUNCE_MS: 300,
  REQUEST_TIMEOUT_MS: 60000,
} as const;

// ============================================================================
// Utility Types
// ============================================================================

export type ProposalStatus = ProposalState["status"];
export type ProposalValidationError = keyof ProposalState["validationErrors"];

/**
 * Result type for validation functions
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Result type for API calls
 */
export type ApiResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
      details?: unknown;
    };
