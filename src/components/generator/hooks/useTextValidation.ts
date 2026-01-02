import { useState, useEffect, useMemo } from "react";
import type { ValidationResult } from "../types";
import { VALIDATION_LIMITS } from "../types";

/**
 * Validates source text according to application rules
 */
export const validateSourceText = (text: string): ValidationResult & { characterCount: number } => {
  const characterCount = text.length;
  const errors: string[] = [];

  // Check minimum length (only if not empty)
  if (characterCount > 0 && characterCount < VALIDATION_LIMITS.SOURCE_TEXT_MIN) {
    errors.push(`Minimum ${VALIDATION_LIMITS.SOURCE_TEXT_MIN} znaków`);
  }

  // Check maximum length
  if (characterCount > VALIDATION_LIMITS.SOURCE_TEXT_MAX) {
    errors.push(`Maksimum ${VALIDATION_LIMITS.SOURCE_TEXT_MAX} znaków`);
  }

  // Check if empty (different message for empty state)
  if (characterCount === 0) {
    errors.push("Tekst nie może być pusty");
  }

  const isValid =
    characterCount >= VALIDATION_LIMITS.SOURCE_TEXT_MIN && characterCount <= VALIDATION_LIMITS.SOURCE_TEXT_MAX;

  return {
    isValid,
    errors,
    characterCount,
  };
};

/**
 * Hook for validating text input with debounce
 * Returns validation state and results using centralized validation logic
 */
export const useTextValidation = (text: string) => {
  const [debouncedText, setDebouncedText] = useState(text);

  // Debounce text input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, VALIDATION_LIMITS.DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text]);

  // Use centralized validation logic
  const validationResult = useMemo(() => validateSourceText(debouncedText), [debouncedText]);

  return {
    ...validationResult,
    isLengthValid: validationResult.isValid,
    hasMinLength: debouncedText.length >= VALIDATION_LIMITS.SOURCE_TEXT_MIN,
    hasMaxLength: debouncedText.length <= VALIDATION_LIMITS.SOURCE_TEXT_MAX,
    isEmpty: debouncedText.length === 0,
  };
};
