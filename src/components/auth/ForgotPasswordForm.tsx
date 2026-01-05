/**
 * ForgotPasswordForm - Password reset request form component
 * Handles password reset initiation with email validation
 */

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ErrorMessage, SuccessMessage } from "./AuthMessage";
import { validateForgotPasswordData } from "../../lib/validation/auth-schemas";
import type { FieldValidationErrors } from "../../lib/types/common";

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
  className?: string;
}

interface FormData {
  email: string;
}

interface FormState {
  data: FormData;
  errors: FieldValidationErrors;
  isSubmitting: boolean;
  submitError: string | null;
  isValid: boolean;
  isSuccess: boolean;
}

export function ForgotPasswordForm({ onSuccess, className = "" }: ForgotPasswordFormProps) {
  const [formState, setFormState] = useState<FormState>({
    data: {
      email: "",
    },
    errors: {},
    isSubmitting: false,
    submitError: null,
    isValid: false,
    isSuccess: false,
  });

  // Real-time validation
  const validateField = (value: string) => {
    const validation = validateForgotPasswordData({ email: value });

    setFormState((prev) => ({
      ...prev,
      data: { email: value },
      errors: validation.fieldErrors,
      isValid: validation.isValid,
    }));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    validateField(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Final validation
    const validation = validateForgotPasswordData(formState.data);
    if (!validation.isValid) {
      setFormState((prev) => ({
        ...prev,
        errors: validation.fieldErrors,
        isValid: false,
      }));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      submitError: null,
    }));

    try {
      // TODO: Replace with actual API call when backend is implemented

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate success
      setFormState((prev) => ({
        ...prev,
        isSuccess: true,
      }));

      if (onSuccess) {
        onSuccess(formState.data.email);
      }
    } catch (error) {
      // Handle different error types
      let errorMessage = "Wystąpił błąd podczas wysyłania linku resetowania";

      if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as Error).message;
      }

      setFormState((prev) => ({
        ...prev,
        submitError: errorMessage,
      }));
    } finally {
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  };

  const handleBackToLogin = () => {
    window.location.href = "/auth/login";
  };

  // Show success state
  if (formState.isSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Email wysłany!</CardTitle>
          <CardDescription>Sprawdź swoją skrzynkę odbiorczą</CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <SuccessMessage message={`Link do resetowania hasła został wysłany na adres ${formState.data.email}`} />

          <div className="text-sm text-muted-foreground space-y-2">
            <p>Jeśli nie widzisz wiadomości w skrzynce odbiorczej, sprawdź folder spam.</p>
            <p>Link będzie aktywny przez 24 godziny.</p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button onClick={handleBackToLogin} variant="outline" className="w-full">
            Powrót do logowania
          </Button>

          <button
            onClick={() => setFormState((prev) => ({ ...prev, isSuccess: false }))}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Wyślij ponownie
          </button>
        </CardFooter>
      </Card>
    );
  }

  // Show form
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Zapomniałeś hasła?</CardTitle>
        <CardDescription className="text-center">
          Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Submit Error Message */}
          {formState.submitError && (
            <ErrorMessage
              message={formState.submitError}
              onDismiss={() => setFormState((prev) => ({ ...prev, submitError: null }))}
            />
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Adres email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="twoj@email.com"
              value={formState.data.email}
              onChange={handleInputChange}
              className={formState.errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              aria-invalid={!!formState.errors.email}
              aria-describedby={formState.errors.email ? "email-error" : "email-help"}
              disabled={formState.isSubmitting}
              required
            />
            {formState.errors.email && (
              <div id="email-error" className="text-sm text-destructive" role="alert">
                {formState.errors.email[0]}
              </div>
            )}
            <div id="email-help" className="text-xs text-muted-foreground">
              Wprowadź adres email powiązany z Twoim kontem
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={formState.isSubmitting || !formState.isValid}>
            {formState.isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Wysyłanie...
              </span>
            ) : (
              "Wyślij link resetowania"
            )}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
              disabled={formState.isSubmitting}
            >
              ← Powrót do logowania
            </button>
          </div>

          {/* Additional Help */}
          <div className="text-center text-xs text-muted-foreground">Potrzebujesz pomocy? Skontaktuj się z nami</div>
        </CardFooter>
      </form>
    </Card>
  );
}

/**
 * PasswordResetForm - Component for actually resetting the password with token
 * This would be used on a separate page accessed via email link
 */

interface PasswordResetFormProps {
  token: string;
  className?: string;
}

export function PasswordResetForm({ token, className = "" }: PasswordResetFormProps) {
  // This component would contain password reset logic similar to RegisterForm
  // but using the token for validation

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Ustaw nowe hasło</CardTitle>
        <CardDescription className="text-center">Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>

      <CardContent>
        {/* TODO: Implement password reset form similar to register form */}
        <div className="text-center text-muted-foreground">
          Token: {token}
          <br />
          Formularz resetowania hasła zostanie zaimplementowany w kolejnym etapie
        </div>
      </CardContent>
    </Card>
  );
}
