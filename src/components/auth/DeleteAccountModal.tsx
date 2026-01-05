/**
 * DeleteAccountModal - Secure account deletion confirmation modal
 * Requires password confirmation and explicit consent before account deletion
 */

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { ErrorMessage } from "./AuthMessage";
import { validateDeleteAccountData } from "../../lib/validation/auth-schemas";
import type { FieldValidationErrors } from "../../lib/types/common";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void>;
  userEmail: string;
}

interface FormData {
  password: string;
  confirmDeletion: boolean;
}

interface FormState {
  data: FormData;
  errors: FieldValidationErrors;
  isSubmitting: boolean;
  submitError: string | null;
  isValid: boolean;
  step: "warning" | "confirmation";
}

export function DeleteAccountModal({ isOpen, onClose, onConfirm, userEmail }: DeleteAccountModalProps) {
  const [formState, setFormState] = useState<FormState>({
    data: {
      password: "",
      confirmDeletion: false,
    },
    errors: {},
    isSubmitting: false,
    submitError: null,
    isValid: false,
    step: "warning",
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormState({
        data: { password: "", confirmDeletion: false },
        errors: {},
        isSubmitting: false,
        submitError: null,
        isValid: false,
        step: "warning",
      });
    }
  }, [isOpen]);

  // Real-time validation
  const validateForm = (newData: Partial<FormData>) => {
    const updatedData = { ...formState.data, ...newData };
    const validation = validateDeleteAccountData(updatedData);

    setFormState((prev) => ({
      ...prev,
      data: updatedData,
      errors: validation.fieldErrors,
      isValid: validation.isValid,
    }));
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateForm({ password: event.target.value });
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    validateForm({ confirmDeletion: event.target.checked });
  };

  const handleProceedToConfirmation = () => {
    setFormState((prev) => ({ ...prev, step: "confirmation" }));
  };

  const handleGoBack = () => {
    setFormState((prev) => ({ ...prev, step: "warning" }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Final validation
    const validation = validateDeleteAccountData(formState.data);
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
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (onConfirm) {
        await onConfirm();
      }

      // Close modal and redirect will be handled by parent component
      onClose();
    } catch (error) {
      let errorMessage = "Wystąpił błąd podczas usuwania konta";

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

  // Warning step
  if (formState.step === "warning") {
    return (
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-destructive">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              Usuwanie konta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p className="font-medium text-foreground">Czy na pewno chcesz usunąć swoje konto?</p>

                <p>
                  Ta akcja jest <strong>nieodwracalna</strong>. Usunięte zostaną:
                </p>

                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Wszystkie Twoje fiszki</li>
                  <li>Historia nauki</li>
                  <li>Statystyki postępów</li>
                  <li>Wszystkie dane osobowe</li>
                </ul>

                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="font-medium text-destructive text-sm">
                    ⚠️ Uwaga: Nie będzie możliwości odzyskania danych po usunięciu konta
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleProceedToConfirmation} className="flex-1">
              Rozumiem, kontynuuj
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Confirmation step
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Potwierdź usunięcie konta</AlertDialogTitle>
          <AlertDialogDescription>Dla bezpieczeństwa wprowadź swoje hasło i potwierdź operację</AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Submit Error Message */}
            {formState.submitError && (
              <ErrorMessage
                message={formState.submitError}
                onDismiss={() => setFormState((prev) => ({ ...prev, submitError: null }))}
              />
            )}

            {/* Current Account */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Konto do usunięcia:</span>
                <br />
                <span className="font-medium">{userEmail}</span>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="delete-password">Wprowadź swoje hasło</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                placeholder="Twoje aktualne hasło"
                value={formState.data.password}
                onChange={handlePasswordChange}
                className={formState.errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-invalid={!!formState.errors.password}
                aria-describedby={formState.errors.password ? "delete-password-error" : undefined}
                disabled={formState.isSubmitting}
                required
              />
              {formState.errors.password && (
                <div id="delete-password-error" className="text-sm text-destructive" role="alert">
                  {formState.errors.password[0]}
                </div>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <input
                  id="confirm-deletion"
                  type="checkbox"
                  checked={formState.data.confirmDeletion}
                  onChange={handleCheckboxChange}
                  className={`mt-1 h-4 w-4 rounded border-2 ${
                    formState.errors.confirmDeletion ? "border-destructive" : "border-input"
                  }`}
                  aria-invalid={!!formState.errors.confirmDeletion}
                  aria-describedby={formState.errors.confirmDeletion ? "confirm-deletion-error" : undefined}
                  disabled={formState.isSubmitting}
                  required
                />
                <Label htmlFor="confirm-deletion" className="text-sm leading-5">
                  Potwierdzam, że rozumiem konsekwencje i chcę <strong>trwale usunąć</strong> swoje konto wraz ze
                  wszystkimi danymi
                </Label>
              </div>
              {formState.errors.confirmDeletion && (
                <div id="confirm-deletion-error" className="text-sm text-destructive" role="alert">
                  {formState.errors.confirmDeletion[0]}
                </div>
              )}
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              disabled={formState.isSubmitting}
              className="flex-1"
            >
              ← Wstecz
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={formState.isSubmitting || !formState.isValid}
              className="flex-1"
            >
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
                  Usuwanie...
                </span>
              ) : (
                "Usuń na zawsze"
              )}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
