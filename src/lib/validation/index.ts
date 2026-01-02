/**
 * Validation utilities - main export file
 * Provides centralized access to all validation functions
 */

// Re-export all text validation functions
export * from "./text";

// Re-export all flashcard validation functions
export * from "./flashcard";

// Export commonly used types
export type { ValidationResult, TextValidationResult, TextConstraints, FieldValidationErrors } from "../types/common";
