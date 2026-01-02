/**
 * Improved hook for validating text input with better debounce management
 * Enhanced version with more granular validation states
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { validateSourceText } from "../../../lib/validation/text";
import { VALIDATION_LIMITS } from "../types";

interface UseTextValidationOptions {
  debounceMs?: number;
  validateOnMount?: boolean;
}

export const useTextValidation = (text: string, options: UseTextValidationOptions = {}) => {
  const { debounceMs = VALIDATION_LIMITS.DEBOUNCE_MS, validateOnMount = false } = options;

  const [debouncedText, setDebouncedText] = useState(() => (validateOnMount ? text : ""));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce text input changes with cleanup
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoized validation result
  const validation = useMemo(() => {
    return validateSourceText(debouncedText);
  }, [debouncedText]);

  // Additional computed properties for better UX
  const computed = useMemo(
    () => ({
      // Character counts
      currentLength: text.length,
      debouncedLength: debouncedText.length,

      // Validation states
      isEmpty: debouncedText.length === 0,
      hasMinLength: debouncedText.length >= VALIDATION_LIMITS.SOURCE_TEXT_MIN,
      hasMaxLength: debouncedText.length <= VALIDATION_LIMITS.SOURCE_TEXT_MAX,
      isLengthValid: validation.isValid,

      // Progress indicators
      progressPercentage: Math.min((debouncedText.length / VALIDATION_LIMITS.SOURCE_TEXT_MIN) * 100, 100),
      charactersRemaining: VALIDATION_LIMITS.SOURCE_TEXT_MAX - text.length,

      // Status flags
      isValidating: text !== debouncedText,
      hasChanged: text.length > 0,
      needsMoreContent: debouncedText.length > 0 && debouncedText.length < VALIDATION_LIMITS.SOURCE_TEXT_MIN,
      isNearLimit: text.length > VALIDATION_LIMITS.SOURCE_TEXT_MAX * 0.9,
    }),
    [text, debouncedText, validation.isValid]
  );

  return {
    // Validation results
    ...validation,

    // Computed properties
    ...computed,

    // Raw values for reference
    text,
    debouncedText,
  };
};
