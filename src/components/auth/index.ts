/**
 * Auth components exports
 * Centralized exports for all authentication-related components
 */

export { AuthButton } from "./AuthButton";
export { AuthMessage, SuccessMessage, ErrorMessage, InfoMessage, WarningMessage, AUTH_MESSAGES } from "./AuthMessage";
export { LoginForm } from "./LoginForm";
export { RegisterForm } from "./RegisterForm";
export { ForgotPasswordForm, PasswordResetForm } from "./ForgotPasswordForm";
export { DeleteAccountModal } from "./DeleteAccountModal";

// Re-export auth validation for convenience
export {
  validateLoginData,
  validateRegistrationData,
  validateForgotPasswordData,
  validateResetPasswordData,
  validateDeleteAccountData,
  createAuthError,
  isAuthError,
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  AUTH_VALIDATION_LIMITS,
  type AuthError,
} from "../../lib/validation/auth-schemas";
