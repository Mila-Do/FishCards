/**
 * LoginForm - Interactive login form component
 * Handles user authentication with client-side validation and error handling
 */

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ErrorMessage } from "./AuthMessage";
import { validateLoginData } from "../../lib/validation/auth-schemas";
import type { FieldValidationErrors } from "../../lib/types/common";

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: (user: { email: string; id: string }) => void;
  className?: string;
}

interface FormData {
  email: string;
  password: string;
}

interface FormState {
  data: FormData;
  errors: FieldValidationErrors;
  isSubmitting: boolean;
  submitError: string | null;
  isValid: boolean;
}

export function LoginForm({ redirectTo = "/generator", onSuccess, className = "" }: LoginFormProps) {
  const [formState, setFormState] = useState<FormState>({
    data: {
      email: "",
      password: "",
    },
    errors: {},
    isSubmitting: false,
    submitError: null,
    isValid: false,
  });

  // Real-time validation
  const validateField = (field: keyof FormData, value: string) => {
    const tempData = { ...formState.data, [field]: value };
    const validation = validateLoginData(tempData);

    setFormState((prev) => ({
      ...prev,
      data: tempData,
      errors: validation.fieldErrors,
      isValid: validation.isValid,
    }));
  };

  const handleInputChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    validateField(field, value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Final validation
    const validation = validateLoginData(formState.data);
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
      const mockUser = { email: formState.data.email, id: "1" };

      if (onSuccess) {
        onSuccess(mockUser);
      } else {
        // Redirect to target page
        window.location.href = redirectTo;
      }
    } catch (error) {
      // Handle different error types
      let errorMessage = "Wystąpił nieoczekiwany błąd";

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

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Zaloguj się</CardTitle>
        <CardDescription className="text-center">Wprowadź swoje dane, aby uzyskać dostęp do konta</CardDescription>
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
              autoComplete="current-password"
              placeholder="Twoje hasło"
              value={formState.data.password}
              onChange={handleInputChange("password")}
              className={formState.errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
              aria-invalid={!!formState.errors.password}
              aria-describedby={formState.errors.password ? "password-error" : undefined}
              disabled={formState.isSubmitting}
              required
            />
            {formState.errors.password && (
              <div id="password-error" className="text-sm text-destructive" role="alert">
                {formState.errors.password[0]}
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
                Logowanie...
              </span>
            ) : (
              "Zaloguj się"
            )}
          </Button>

          {/* Links */}
          <div className="text-center space-y-2 text-sm">
            <div>
              <a href="/auth/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                Zapomniałeś hasła?
              </a>
            </div>
            <div className="text-muted-foreground">
              Nie masz konta?{" "}
              <a href="/auth/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Zarejestruj się
              </a>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
