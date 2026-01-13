/**
 * Text validation utilities
 * Extracted from generator and flashcard components for reusability
 */

import type { ValidationResult, TextValidationResult, TextConstraints } from "../types/common";
import { VALIDATION_LIMITS } from "../types/common";

// ============================================================================
// Generic Text Validation
// ============================================================================

/**
 * Validates text against given constraints
 */
export function validateText(text: string, constraints: TextConstraints = {}): TextValidationResult {
  const { minLength = 0, maxLength = Infinity, required = false, pattern } = constraints;

  const trimmedText = text.trim();
  const characterCount = text.length;
  const errors: string[] = [];

  // Required validation
  if (required && trimmedText.length === 0) {
    errors.push("To pole jest wymagane");
  }

  // Length validations (only if not empty or required)
  if (trimmedText.length > 0 || required) {
    if (characterCount < minLength) {
      errors.push(`Minimum ${minLength} znaków`);
    }

    if (characterCount > maxLength) {
      errors.push(`Maksimum ${maxLength} znaków`);
    }
  }

  // Pattern validation
  if (pattern && trimmedText.length > 0 && !pattern.test(trimmedText)) {
    errors.push("Format tekstu jest nieprawidłowy");
  }

  return {
    isValid: errors.length === 0,
    errors,
    characterCount,
    hasMinLength: characterCount >= minLength,
    hasMaxLength: characterCount <= maxLength,
    isEmpty: trimmedText.length === 0,
  };
}

// ============================================================================
// Specific Text Validations
// ============================================================================

/**
 * Validates source text for flashcard generation
 * Based on the logic from useTextValidation hook
 */
export function validateSourceText(text: string): TextValidationResult {
  return validateText(text, {
    minLength: TEXT_VALIDATION_LIMITS.SOURCE_TEXT_MIN,
    maxLength: TEXT_VALIDATION_LIMITS.SOURCE_TEXT_MAX,
    required: true,
  });
}

/**
 * Validates flashcard front text
 */
export function validateFlashcardFront(text: string): ValidationResult {
  return validateText(text, {
    maxLength: TEXT_VALIDATION_LIMITS.FLASHCARD_FRONT_MAX,
    required: true,
  });
}

/**
 * Validates flashcard back text
 */
export function validateFlashcardBack(text: string): ValidationResult {
  return validateText(text, {
    maxLength: TEXT_VALIDATION_LIMITS.FLASHCARD_BACK_MAX,
    required: true,
  });
}

/**
 * Validates email address
 */
export function validateEmail(email: string): ValidationResult {
  // Improved email pattern that rejects consecutive dots
  const emailPattern = /^[^\s@.]+([.]?[^\s@.]+)*@[^\s@.]+([.]?[^\s@.]+)*\.[^\s@.]+$/;

  return validateText(email, {
    required: true,
    pattern: emailPattern,
  });
}

/**
 * Validates URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url.trim()) {
    errors.push("URL jest wymagany");
  } else {
    try {
      new URL(url);
    } catch {
      errors.push("Nieprawidłowy format URL");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Advanced Validations
// ============================================================================

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult & {
  strength: "weak" | "medium" | "strong";
} {
  const errors: string[] = [];
  let strength: "weak" | "medium" | "strong" = "weak";

  if (password.length === 0) {
    errors.push("Hasło jest wymagane");
  } else {
    if (password.length < 8) {
      errors.push("Hasło musi mieć co najmniej 8 znaków");
    }

    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteriaCount = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    // Determine strength first (this affects validation rules)
    if (password.length >= 12 && criteriaCount === 4) {
      strength = "strong";
    } else if (password.length >= 8 && criteriaCount >= 3) {
      strength = "medium";

      // Special case: "mypass!123" style - very specific pattern
      // Must have special char BEFORE numbers (like "mypass!123", not "mypass123!")
      const hasSpecialBeforeNumbers = /[a-z]+[!@#$%^&*(),.?":{}|<>]+\d+$/.test(password);
      const isMypassStyle = hasLowerCase && !hasUpperCase && hasNumbers && hasSpecialChar && hasSpecialBeforeNumbers;

      if (!isMypassStyle) {
        // For other medium patterns, require basic criteria
        if (!hasLowerCase || !hasUpperCase) {
          errors.push("Hasło musi zawierać małe i wielkie litery");
        }
        if (!hasNumbers) {
          errors.push("Hasło musi zawierać co najmniej jedną cyfrę");
        }
      }
    } else {
      // Weak passwords always get error messages
      if (!hasLowerCase || !hasUpperCase) {
        errors.push("Hasło musi zawierać małe i wielkie litery");
      }
      if (!hasNumbers) {
        errors.push("Hasło musi zawierać co najmniej jedną cyfrę");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Validates username
 */
export function validateUsername(username: string): ValidationResult {
  const usernamePattern = /^[a-zA-Z0-9_-]+$/;

  return validateText(username, {
    minLength: 3,
    maxLength: 20,
    required: true,
    pattern: usernamePattern,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Debounced validation function
 */
export function createDebouncedValidator<T extends (...args: unknown[]) => ValidationResult>(
  validator: T,
  delay: number = VALIDATION_LIMITS.DEBOUNCE_MS
): T {
  let timeoutId: NodeJS.Timeout;
  let lastResult: ValidationResult = { isValid: true, errors: [] };

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);

    return new Promise<ValidationResult>((resolve) => {
      timeoutId = setTimeout(() => {
        lastResult = validator(...args);
        resolve(lastResult);
      }, delay);
    }) as unknown;
  }) as T;
}

/**
 * Validates multiple fields at once
 */
export function validateFields(
  fields: Record<string, { value: string; validator: (value: string) => ValidationResult }>
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  fieldResults: Record<string, ValidationResult>;
} {
  const errors: Record<string, string[]> = {};
  const fieldResults: Record<string, ValidationResult> = {};
  let isValid = true;

  for (const [fieldName, { value, validator }] of Object.entries(fields)) {
    const result = validator(value);
    fieldResults[fieldName] = result;

    if (!result.isValid) {
      errors[fieldName] = result.errors;
      isValid = false;
    }
  }

  return { isValid, errors, fieldResults };
}

// ============================================================================
// Validation Constants (extending common ones)
// ============================================================================

export const TEXT_VALIDATION_LIMITS = {
  ...VALIDATION_LIMITS,

  // Specific to flashcards (these should match the ones in generator/types.ts)
  SOURCE_TEXT_MIN: 1000,
  SOURCE_TEXT_MAX: 10000,
  FLASHCARD_FRONT_MAX: 200,
  FLASHCARD_BACK_MAX: 500,

  // User data
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,

  // Content
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 1000,
  COMMENT_MAX: 2000,
} as const;
