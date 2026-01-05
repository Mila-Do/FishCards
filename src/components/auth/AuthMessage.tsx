/**
 * AuthMessage - Component for displaying authentication-related messages
 * Handles success, error, info, and warning messages with appropriate styling
 */

import React from "react";

type MessageType = "success" | "error" | "info" | "warning";

interface AuthMessageProps {
  type: MessageType;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function AuthMessage({ type, message, onDismiss, className = "" }: AuthMessageProps) {
  if (!message) return null;

  const baseClasses = "relative rounded-lg border px-4 py-3 text-sm";

  const typeClasses = {
    success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
    warning:
      "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  };

  const iconMap = {
    success: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">{iconMap[type]}</div>

        <div className="flex-1">
          <p className="font-medium leading-5">{message}</p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-3 -mr-1 -mt-1 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Zamknij wiadomość"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Predefined message components for common scenarios
 */

export function SuccessMessage({ message, onDismiss, className }: Omit<AuthMessageProps, "type">) {
  return <AuthMessage type="success" message={message} onDismiss={onDismiss} className={className} />;
}

export function ErrorMessage({ message, onDismiss, className }: Omit<AuthMessageProps, "type">) {
  return <AuthMessage type="error" message={message} onDismiss={onDismiss} className={className} />;
}

export function InfoMessage({ message, onDismiss, className }: Omit<AuthMessageProps, "type">) {
  return <AuthMessage type="info" message={message} onDismiss={onDismiss} className={className} />;
}

export function WarningMessage({ message, onDismiss, className }: Omit<AuthMessageProps, "type">) {
  return <AuthMessage type="warning" message={message} onDismiss={onDismiss} className={className} />;
}

/**
 * Common auth messages as constants
 */
export const AUTH_MESSAGES = {
  REGISTRATION_SUCCESS: "Rejestracja pomyślna! Zostałeś automatycznie zalogowany.",
  LOGIN_SUCCESS: "Logowanie pomyślne! Przekierowywanie...",
  LOGOUT_SUCCESS: "Wylogowanie pomyślne.",
  PASSWORD_RESET_SENT: "Link do resetowania hasła został wysłany na Twój email.",
  PASSWORD_RESET_SUCCESS: "Hasło zostało pomyślnie zmienione. Zostałeś automatycznie zalogowany.",
  ACCOUNT_DELETED: "Konto zostało trwale usunięte.",
  SESSION_EXPIRED: "Sesja wygasła - zaloguj się ponownie.",
  NETWORK_ERROR: "Błąd połączenia - sprawdź internet i spróbuj ponownie.",
  INVALID_CREDENTIALS: "Nieprawidłowy email lub hasło.",
  EMAIL_ALREADY_TAKEN: "Podany adres email jest już zajęty.",
  WEAK_PASSWORD: "Hasło nie spełnia wymogów bezpieczeństwa.",
  SERVER_ERROR: "Błąd serwera - spróbuj ponownie później.",
} as const;
