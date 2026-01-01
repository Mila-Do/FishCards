import { useState, useEffect, useMemo } from "react";
import type { ValidationResult } from "../types";
import { VALIDATION_LIMITS } from "../types";

/**
 * Hook for validating text input with debounce
 * Returns validation state and results
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

  // Validation logic
  const validationResult = useMemo((): ValidationResult & { characterCount: number } => {
    const characterCount = debouncedText.length;
    const errors: string[] = [];

    // Check minimum length
    if (characterCount > 0 && characterCount < VALIDATION_LIMITS.SOURCE_TEXT_MIN) {
      errors.push(`Minimum ${VALIDATION_LIMITS.SOURCE_TEXT_MIN} znakĂłw`);
    }

    // Check maximum length
    if (characterCount > VALIDATION_LIMITS.SOURCE_TEXT_MAX) {
      errors.push(`Maksimum ${VALIDATION_LIMITS.SOURCE_TEXT_MAX} znakĂłw`);
    }

    // Check if empty (different message)
    if (characterCount === 0) {
      errors.push("Tekst nie moĹĽe byÄ‡ pusty");
    }

    const isValid =
      characterCount >= VALIDATION_LIMITS.SOURCE_TEXT_MIN && characterCount <= VALIDATION_LIMITS.SOURCE_TEXT_MAX;

    return {
      isValid,
      errors,
      characterCount,
    };
  }, [debouncedText]);

  return {
    ...validationResult,
    isLengthValid: validationResult.isValid,
    hasMinLength: debouncedText.length >= VALIDATION_LIMITS.SOURCE_TEXT_MIN,
    hasMaxLength: debouncedText.length <= VALIDATION_LIMITS.SOURCE_TEXT_MAX,
    isEmpty: debouncedText.length === 0,
  };
};
