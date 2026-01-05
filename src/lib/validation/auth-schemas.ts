/**
 * Authentication-specific validation schemas and utilities
 * Business logic validation for auth operations
 */

import { z } from "zod";
import type { ValidationResult, FieldValidationErrors } from "../types/common";
import { validateEmail, validatePassword, TEXT_VALIDATION_LIMITS } from "./text";

// ============================================================================
// Zod Schemas for API validation
// ============================================================================

/**
 * Schema for login request
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format adresu email")
    .max(320, "Adres email jest zbyt długi"), // RFC 5321 limit
  password: z.string().min(1, "Hasło jest wymagane").max(TEXT_VALIDATION_LIMITS.PASSWORD_MAX, "Hasło jest zbyt długie"),
});

/**
 * Schema for registration request
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email jest wymagany")
      .email("Nieprawidłowy format adresu email")
      .max(320, "Adres email jest zbyt długi"),
    password: z
      .string()
      .min(
        TEXT_VALIDATION_LIMITS.PASSWORD_MIN,
        `Hasło musi mieć co najmniej ${TEXT_VALIDATION_LIMITS.PASSWORD_MIN} znaków`
      )
      .max(TEXT_VALIDATION_LIMITS.PASSWORD_MAX, "Hasło jest zbyt długie")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą i wielką literę oraz cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format adresu email")
    .max(320, "Adres email jest zbyt długi"),
});

/**
 * Schema for password reset request
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token resetowania jest wymagany"),
    password: z
      .string()
      .min(
        TEXT_VALIDATION_LIMITS.PASSWORD_MIN,
        `Hasło musi mieć co najmniej ${TEXT_VALIDATION_LIMITS.PASSWORD_MIN} znaków`
      )
      .max(TEXT_VALIDATION_LIMITS.PASSWORD_MAX, "Hasło jest zbyt długie")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Hasło musi zawierać małą i wielką literę oraz cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema for account deletion request
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hasło jest wymagane do potwierdzenia"),
  confirmDeletion: z.boolean().refine((val) => val === true, {
    message: "Musisz potwierdzić, że rozumiesz konsekwencje usunięcia konta",
  }),
});

// ============================================================================
// Business Logic Validation Functions
// ============================================================================

/**
 * Validates login credentials with enhanced error reporting
 */
export function validateLoginData(data: {
  email: string;
  password: string;
}): ValidationResult & { fieldErrors: FieldValidationErrors } {
  const fieldErrors: FieldValidationErrors = {};
  const allErrors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    fieldErrors.email = emailValidation.errors;
    allErrors.push(...emailValidation.errors);
  }

  // Validate password presence (not strength for login)
  if (!data.password || data.password.trim().length === 0) {
    fieldErrors.password = ["Hasło jest wymagane"];
    allErrors.push("Hasło jest wymagane");
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}

/**
 * Validates registration data with comprehensive checks
 */
export function validateRegistrationData(data: {
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult & { fieldErrors: FieldValidationErrors } {
  const fieldErrors: FieldValidationErrors = {};
  const allErrors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    fieldErrors.email = emailValidation.errors;
    allErrors.push(...emailValidation.errors);
  }

  // Validate password strength
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    fieldErrors.password = passwordValidation.errors;
    allErrors.push(...passwordValidation.errors);
  }

  // Validate password confirmation
  if (!data.confirmPassword || data.confirmPassword.trim().length === 0) {
    fieldErrors.confirmPassword = ["Potwierdzenie hasła jest wymagane"];
    allErrors.push("Potwierdzenie hasła jest wymagane");
  } else if (data.password !== data.confirmPassword) {
    fieldErrors.confirmPassword = ["Hasła nie są identyczne"];
    allErrors.push("Hasła nie są identyczne");
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}

/**
 * Validates forgot password request
 */
export function validateForgotPasswordData(data: {
  email: string;
}): ValidationResult & { fieldErrors: FieldValidationErrors } {
  const fieldErrors: FieldValidationErrors = {};
  const allErrors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    fieldErrors.email = emailValidation.errors;
    allErrors.push(...emailValidation.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}

/**
 * Validates password reset data
 */
export function validateResetPasswordData(data: {
  token: string;
  password: string;
  confirmPassword: string;
}): ValidationResult & { fieldErrors: FieldValidationErrors } {
  const fieldErrors: FieldValidationErrors = {};
  const allErrors: string[] = [];

  // Validate token presence
  if (!data.token || data.token.trim().length === 0) {
    fieldErrors.token = ["Token resetowania jest wymagany"];
    allErrors.push("Token resetowania jest wymagany");
  }

  // Validate new password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    fieldErrors.password = passwordValidation.errors;
    allErrors.push(...passwordValidation.errors);
  }

  // Validate password confirmation
  if (!data.confirmPassword || data.confirmPassword.trim().length === 0) {
    fieldErrors.confirmPassword = ["Potwierdzenie hasła jest wymagane"];
    allErrors.push("Potwierdzenie hasła jest wymagane");
  } else if (data.password !== data.confirmPassword) {
    fieldErrors.confirmPassword = ["Hasła nie są identyczne"];
    allErrors.push("Hasła nie są identyczne");
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}

/**
 * Validates account deletion request
 */
export function validateDeleteAccountData(data: {
  password: string;
  confirmDeletion: boolean;
}): ValidationResult & { fieldErrors: FieldValidationErrors } {
  const fieldErrors: FieldValidationErrors = {};
  const allErrors: string[] = [];

  // Validate password presence
  if (!data.password || data.password.trim().length === 0) {
    fieldErrors.password = ["Hasło jest wymagane do potwierdzenia"];
    allErrors.push("Hasło jest wymagane do potwierdzenia");
  }

  // Validate confirmation
  if (!data.confirmDeletion) {
    fieldErrors.confirmDeletion = ["Musisz potwierdzić, że rozumiesz konsekwencje usunięcia konta"];
    allErrors.push("Musisz potwierdzić, że rozumiesz konsekwencje usunięcia konta");
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fieldErrors,
  };
}

// ============================================================================
// Auth Error Types for consistency
// ============================================================================

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Standard auth error codes
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  EMAIL_ALREADY_TAKEN: "EMAIL_ALREADY_TAKEN",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
} as const;

/**
 * User-friendly error messages in Polish
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: "Nieprawidłowy email lub hasło",
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: "Użytkownik o podanym adresie email nie istnieje",
  [AUTH_ERROR_CODES.EMAIL_ALREADY_TAKEN]: "Podany adres email jest już zajęty",
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: "Hasło nie spełnia wymogów bezpieczeństwa",
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: "Sesja wygasła - zaloguj się ponownie",
  [AUTH_ERROR_CODES.NETWORK_ERROR]: "Błąd połączenia - sprawdź internet i spróbuj ponownie",
  [AUTH_ERROR_CODES.SERVER_ERROR]: "Błąd serwera - spróbuj ponownie później",
  [AUTH_ERROR_CODES.INVALID_TOKEN]: "Nieprawidłowy link resetowania hasła",
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: "Link resetowania hasła wygasł - poproś o nowy",
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats validation errors for display
 */
export function formatAuthValidationErrors(fieldErrors: FieldValidationErrors): string {
  const messages: string[] = [];

  Object.entries(fieldErrors).forEach(([field, errors]) => {
    const fieldName = getAuthFieldDisplayName(field);
    errors.forEach((error) => {
      messages.push(`${fieldName}: ${error}`);
    });
  });

  return messages.join("\n");
}

/**
 * Gets user-friendly field names for auth forms
 */
function getAuthFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    email: "Email",
    password: "Hasło",
    confirmPassword: "Potwierdzenie hasła",
    token: "Token",
    confirmDeletion: "Potwierdzenie",
  };

  return displayNames[field] || field;
}

/**
 * Creates a standardized auth error object
 */
export function createAuthError(code: string, customMessage?: string, field?: string): AuthError {
  return {
    code,
    message: customMessage || AUTH_ERROR_MESSAGES[code] || "Nieznany błąd",
    field,
  };
}

/**
 * Checks if error is a specific auth error type
 */
export function isAuthError(error: unknown, code?: string): error is AuthError {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  if (code) {
    return (error as AuthError).code === code;
  }

  return Object.values(AUTH_ERROR_CODES).includes(
    (error as AuthError).code as (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES]
  );
}

// ============================================================================
// Export validation limits for consistency
// ============================================================================

export const AUTH_VALIDATION_LIMITS = {
  EMAIL_MAX: 320, // RFC 5321 standard
  PASSWORD_MIN: TEXT_VALIDATION_LIMITS.PASSWORD_MIN,
  PASSWORD_MAX: TEXT_VALIDATION_LIMITS.PASSWORD_MAX,
} as const;
