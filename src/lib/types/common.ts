/**
 * Common types shared across the application
 * These types provide consistent interfaces for common patterns
 */

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API result wrapper for type-safe error handling
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

/**
 * Standard error response format from API
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of validation operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Enhanced validation result with character count (for text inputs)
 */
export interface TextValidationResult extends ValidationResult {
  characterCount: number;
  hasMinLength?: boolean;
  hasMaxLength?: boolean;
  isEmpty?: boolean;
}

/**
 * Field-specific validation errors
 */
export type FieldValidationErrors = Record<string, string[]>;

/**
 * Validation constraints for text fields
 */
export interface TextConstraints {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  pattern?: RegExp;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Loading state patterns used across components
 */
export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number; // 0-100 for progress indicators
}

/**
 * Error state with retry capability
 */
export interface ErrorState {
  hasError: boolean;
  error: string | null;
  canRetry?: boolean;
  retryCount?: number;
}

/**
 * Modal state management
 */
export interface ModalState {
  isOpen: boolean;
  data?: unknown;
  variant?: "create" | "edit" | "delete" | "view";
}

/**
 * Sort state for tables and lists
 */
export interface SortState<T = string> {
  field: T;
  order: "asc" | "desc";
}

/**
 * Generic filter state
 */
export type FilterState<T = Record<string, unknown>> = {
  [K in keyof T]: T[K] | null;
};

// ============================================================================
// Form Types
// ============================================================================

/**
 * Generic form state
 */
export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: FieldValidationErrors;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Form field configuration
 */
export interface FormField<T = unknown> {
  name: string;
  value: T;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  constraints?: TextConstraints;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Base props for interactive components
 */
export interface BaseComponentProps {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  "data-testid"?: string;
}

/**
 * Props for components with actions
 */
export interface ActionComponentProps extends BaseComponentProps {
  onClick?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}

/**
 * Props for components displaying data
 */
export interface DataComponentProps<T = unknown> extends BaseComponentProps {
  data: T;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract keys from type that are of specific value type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Event handler types
 */
export type EventHandler<T = void> = (event: T) => void;
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

// ============================================================================
// Constants
// ============================================================================

/**
 * Common validation limits used across the app
 */
export const VALIDATION_LIMITS = {
  // Text input limits
  SHORT_TEXT_MAX: 200,
  MEDIUM_TEXT_MAX: 500,
  LONG_TEXT_MAX: 2000,
  VERY_LONG_TEXT_MAX: 10000,

  // Timing
  DEBOUNCE_MS: 300,
  REQUEST_TIMEOUT_MS: 60000,
  RETRY_DELAY_MS: 1000,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // UI
  TOAST_DURATION_MS: 5000,
  SKELETON_COUNT: 4,
} as const;

/**
 * HTTP status codes for better error handling
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
