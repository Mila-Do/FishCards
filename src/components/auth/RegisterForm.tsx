/**
 * RegisterForm - Interactive registration form component
 * Handles user registration with client-side validation and password strength indicator
 */

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ErrorMessage, SuccessMessage } from "./AuthMessage";
import { validateRegistrationData } from "../../lib/validation/auth-schemas";
import { validatePassword } from "../../lib/validation/text";
import type { FieldValidationErrors } from "../../lib/types/common";

interface RegisterFormProps {
  redirectTo?: string;
  onSuccess?: (user: { email: string; id: string }) => void;
  className?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormState {
  data: FormData;
  errors: FieldValidationErrors;
  isSubmitting: boolean;
  submitError: string | null;
  isValid: boolean;
  passwordStrength: "weak" | "medium" | "strong";
}

export function RegisterForm({ redirectTo = "/generator", onSuccess, className = "" }: RegisterFormProps) {
  const [formState, setFormState] = useState<FormState>({
    data: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    errors: {},
    isSubmitting: false,
    submitError: null,
    isValid: false,
    passwordStrength: "weak",
  });

  // Real-time validation
  const validateField = (field: keyof FormData, value: string) => {
    const tempData = { ...formState.data, [field]: value };
    const validation = validateRegistrationData(tempData);

    // Check password strength if password field changed
    let passwordStrength = formState.passwordStrength;
    if (field === "password") {
      const strengthValidation = validatePassword(value);
      passwordStrength = strengthValidation.strength;
    }

    setFormState((prev) => ({
      ...prev,
      data: tempData,
      errors: validation.fieldErrors,
      isValid: validation.isValid,
      passwordStrength,
    }));
  };

  const handleInputChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    validateField(field, value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Final validation
    const validation = validateRegistrationData(formState.data);
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
      // Use auth service for registration
      const { authService } = await import("../../lib/auth/auth-service");

      const result = await authService.register({
        email: formState.data.email,
        password: formState.data.password,
        confirmPassword: formState.data.confirmPassword,
      });

      if (!result.success) {
        // Handle registration error
        setFormState((prev) => ({
          ...prev,
          submitError: result.error || "Wystąpił błąd podczas rejestracji",
        }));
        return;
      }

      // Success response
      if (result.user && result.user.email) {
        if (onSuccess) {
          onSuccess({
            id: result.user.id,
            email: result.user.email,
          });
        } else {
          // Show success message and redirect after delay
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 2000);
        }
      } else {
        setFormState((prev) => ({
          ...prev,
          submitError: "Nieprawidłowa odpowiedź serwera",
        }));
      }
    } catch (error) {
      // Handle different error types
      let errorMessage = "Wystąpił nieoczekiwany błąd podczas rejestracji";

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

  // Password strength indicator

  const getPasswordStrengthValue = () => {
    switch (formState.passwordStrength) {
      case "weak":
        return 25;
      case "medium":
        return 65;
      case "strong":
        return 100;
      default:
        return 0;
    }
  };

  const getPasswordStrengthText = () => {
    switch (formState.passwordStrength) {
      case "weak":
        return "Słabe";
      case "medium":
        return "Średnie";
      case "strong":
        return "Mocne";
      default:
        return "";
    }
  };

  const isSuccess = formState.isSubmitting && !formState.submitError;

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Zarejestruj się</CardTitle>
        <CardDescription className="text-center">Stwórz nowe konto, aby rozpocząć naukę z fiszkami</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Success Message */}
          {isSuccess && (
            <SuccessMessage message="Rejestracja pomyślna! Zostałeś automatycznie zalogowany. Przekierowywanie..." />
          )}

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
              onChange={handleInputChange("email")}
              className={formState.errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              aria-invalid={!!formState.errors.email}
              aria-describedby={formState.errors.email ? "email-error" : undefined}
              disabled={formState.isSubmitting}
              required
            />
            {formState.errors.email && (
              <div id="email-error" className="text-sm text-destructive" role="alert">
                {formState.errors.email[0]}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 znaków"
              value={formState.data.password}
              onChange={handleInputChange("password")}
              className={formState.errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              aria-invalid={!!formState.errors.password}
              aria-describedby={formState.errors.password ? "password-error" : "password-requirements"}
              disabled={formState.isSubmitting}
              required
            />

            {/* Password Strength Indicator */}
            {formState.data.password && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span>Siła hasła:</span>
                  <span
                    className={`font-medium ${
                      formState.passwordStrength === "strong"
                        ? "text-green-600"
                        : formState.passwordStrength === "medium"
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <Progress value={getPasswordStrengthValue()} className="h-2" />
              </div>
            )}

            {formState.errors.password && (
              <div id="password-error" className="text-sm text-destructive" role="alert">
                {formState.errors.password[0]}
              </div>
            )}

            <div id="password-requirements" className="text-xs text-muted-foreground">
              Hasło musi zawierać co najmniej 8 znaków, małą i wielką literę oraz cyfrę
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Powtórz hasło"
              value={formState.data.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              className={formState.errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
              aria-invalid={!!formState.errors.confirmPassword}
              aria-describedby={formState.errors.confirmPassword ? "confirm-password-error" : undefined}
              disabled={formState.isSubmitting}
              required
            />
            {formState.errors.confirmPassword && (
              <div id="confirm-password-error" className="text-sm text-destructive" role="alert">
                {formState.errors.confirmPassword[0]}
              </div>
            )}
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
                Rejestrowanie...
              </span>
            ) : (
              "Zarejestruj się"
            )}
          </Button>

          {/* Privacy Notice */}
          <div className="text-xs text-muted-foreground text-center">
            Rejestrując się, akceptujesz nasze warunki korzystania z serwisu
          </div>

          {/* Login Link */}
          <div className="text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <a href="/auth/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Zaloguj się
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
