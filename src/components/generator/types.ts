/**
 * Types for Generator View components
 * Uses common types from lib/types/common.ts for consistency
 */

import type { TextValidationResult, LoadingState, ErrorState, FieldValidationErrors } from "../../lib/types/common";

// Re-export main types for backward compatibility
import type { FlashcardSource } from "../../types";

// ============================================================================
// Main State Interfaces
// ============================================================================

export interface GeneratorViewState {
  sourceText: string;
  proposals: ProposalState[];
  isLoadingProposals: boolean; // dla ProposalsSkeleton
  isSavingFlashcards: boolean; // dla LoadingOverlay
  errors: GeneratorValidationErrors;
  generationId: number | null;
  selectedCount: number;
}

export interface ProposalState {
  id: string; // lokalne UUID dla UI
  front: string;
  back: string;
  source: FlashcardSource;
  status: ProposalStatus;
  isEdited: boolean;
  originalFront: string;
  originalBack: string;
  validationErrors: FieldValidationErrors;
}

export interface TextInputState extends TextValidationResult {
  value: string;
}

export interface GeneratorValidationErrors {
  textInput?: string[];
  proposals?: Record<string, string[]>;
  api?: string;
}

// ============================================================================
// Enhanced Types
// ============================================================================

/**
 * Proposal status type - more explicit than string union
 */
export type ProposalStatus = "pending" | "accepted" | "rejected" | "editing";

/**
 * Generator loading states - more granular than simple boolean
 */
export interface GeneratorLoadingState extends LoadingState {
  isGeneratingProposals?: boolean;
  isSavingFlashcards?: boolean;
  isValidating?: boolean;
}

/**
 * Generator error state with recovery actions
 */
export interface GeneratorErrorState extends ErrorState {
  type?: "validation" | "network" | "api" | "timeout";
  field?: string; // For field-specific errors
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

// Import common validation limits and extend with generator-specific ones
import { VALIDATION_LIMITS as COMMON_LIMITS } from "../../lib/types/common";

export const VALIDATION_LIMITS = {
  ...COMMON_LIMITS,
  SOURCE_TEXT_MIN: 1000,
  SOURCE_TEXT_MAX: 10000,
  FLASHCARD_FRONT_MAX: 200,
  FLASHCARD_BACK_MAX: 500,
} as const;

// ============================================================================
// Utility Types
// ============================================================================

export type ProposalValidationError = keyof FieldValidationErrors;
export type ProposalValidationErrors = Record<"front" | "back", string[]>;

// Re-export common validation and API result types for backward compatibility
export type { ValidationResult, ApiResult } from "../../lib/types/common";
