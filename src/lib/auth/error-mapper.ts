/**
 * Error mapping utilities for Supabase Auth errors
 * Maps Supabase error codes to existing AUTH_ERROR_CODES for consistency
 */

import { AuthError as SupabaseAuthError } from "@supabase/supabase-js";
import { AUTH_ERROR_CODES, AUTH_ERROR_MESSAGES, createAuthError, type AuthError } from "../validation/auth-schemas";

// ============================================================================
// Supabase Error Code Mappings
// ============================================================================

// Note: Supabase error mapping is handled in the mapSupabaseAuthError function
// through pattern matching for better flexibility and error coverage

// ============================================================================
// Error Mapping Functions
// ============================================================================

/**
 * Maps a Supabase AuthError to our standardized AuthError format
 */
export function mapSupabaseAuthError(error: SupabaseAuthError | Error | unknown): AuthError {
  // Handle non-error objects
  if (!error) {
    return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR, "Nieznany błąd");
  }

  // Handle string errors
  if (typeof error === "string") {
    return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR, error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Try to map based on error message patterns
    if (message.includes("invalid credentials") || message.includes("invalid login")) {
      return createAuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (message.includes("user not found") || message.includes("user does not exist")) {
      return createAuthError(AUTH_ERROR_CODES.USER_NOT_FOUND);
    }

    if (message.includes("email") && message.includes("already")) {
      return createAuthError(AUTH_ERROR_CODES.EMAIL_ALREADY_TAKEN);
    }

    if (message.includes("password") && (message.includes("weak") || message.includes("short"))) {
      return createAuthError(AUTH_ERROR_CODES.WEAK_PASSWORD);
    }

    if (message.includes("expired") || message.includes("session")) {
      return createAuthError(AUTH_ERROR_CODES.SESSION_EXPIRED);
    }

    if (message.includes("network") || message.includes("connection")) {
      return createAuthError(AUTH_ERROR_CODES.NETWORK_ERROR);
    }

    // Generic error with original message
    return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR, error.message);
  }

  // Handle Supabase AuthError objects
  if (typeof error === "object" && error !== null && "message" in error) {
    const authError = error as SupabaseAuthError;

    // Try to map by specific error code if available
    if ("status" in authError && typeof authError.status === "number") {
      if (authError.status === 400) {
        // Check message for specific 400 errors
        const message = authError.message?.toLowerCase() || "";

        if (message.includes("email") && message.includes("already")) {
          return createAuthError(AUTH_ERROR_CODES.EMAIL_ALREADY_TAKEN);
        }

        if (message.includes("invalid") && (message.includes("email") || message.includes("password"))) {
          return createAuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        }

        if (message.includes("password") && message.includes("weak")) {
          return createAuthError(AUTH_ERROR_CODES.WEAK_PASSWORD);
        }
      }

      if (authError.status === 401) {
        return createAuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }

      if (authError.status === 422) {
        return createAuthError(AUTH_ERROR_CODES.WEAK_PASSWORD);
      }

      if (authError.status === 429) {
        return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR, "Zbyt wiele prób - spróbuj ponownie później");
      }

      if (authError.status >= 500) {
        return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR);
      }
    }

    // Fallback to message mapping
    return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR, authError.message || "Nieznany błąd uwierzytelniania");
  }

  // Fallback for unknown error types
  return createAuthError(AUTH_ERROR_CODES.SERVER_ERROR, "Nieznany błąd systemu");
}

/**
 * Maps multiple errors (useful for validation errors)
 */
export function mapSupabaseAuthErrors(errors: (SupabaseAuthError | Error | unknown)[]): AuthError[] {
  return errors.map(mapSupabaseAuthError);
}

/**
 * Checks if error indicates that user should try logging in again
 */
export function isSessionError(error: AuthError): boolean {
  const sessionErrorCodes = [
    AUTH_ERROR_CODES.SESSION_EXPIRED,
    AUTH_ERROR_CODES.INVALID_TOKEN,
    AUTH_ERROR_CODES.TOKEN_EXPIRED,
  ] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sessionErrorCodes.includes(error.code as any);
}

/**
 * Checks if error indicates invalid user credentials
 */
export function isCredentialsError(error: AuthError): boolean {
  const credentialErrorCodes = [AUTH_ERROR_CODES.INVALID_CREDENTIALS, AUTH_ERROR_CODES.USER_NOT_FOUND] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return credentialErrorCodes.includes(error.code as any);
}

/**
 * Checks if error indicates registration issues
 */
export function isRegistrationError(error: AuthError): boolean {
  const registrationErrorCodes = [AUTH_ERROR_CODES.EMAIL_ALREADY_TAKEN, AUTH_ERROR_CODES.WEAK_PASSWORD] as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return registrationErrorCodes.includes(error.code as any);
}

/**
 * Gets user-friendly error message for display
 */
export function getDisplayErrorMessage(error: AuthError): string {
  return error.message || AUTH_ERROR_MESSAGES[error.code] || "Wystąpił nieoczekiwany błąd";
}

// ============================================================================
// Export utilities for consistency
// ============================================================================

export { AUTH_ERROR_CODES, AUTH_ERROR_MESSAGES, createAuthError };
export type { AuthError };
