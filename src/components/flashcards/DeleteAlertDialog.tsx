/**
 * DeleteAlertDialog - Dialog potwierdzający usunięcie fiszki
 * Wyświetla ostrzeżenie o trwałości operacji i wymaga potwierdzenia
 */

import React, { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { FlashcardViewModel } from "./types";

interface DeleteAlertDialogProps {
  flashcard: FlashcardViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export function DeleteAlertDialog({ flashcard, isOpen, onClose, onConfirm }: DeleteAlertDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle confirm deletion
  const handleConfirm = useCallback(async () => {
    if (!flashcard) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(flashcard.id);
      // Success - dialog will be closed by parent component
    } catch (error) {
      setError(error instanceof Error ? error.message : "Wystąpił błąd podczas usuwania fiszki");
      // Don't close dialog on error, let user try again
    } finally {
      setIsDeleting(false);
    }
  }, [flashcard, onConfirm]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  }, [isDeleting, onClose]);

  // Reset error when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!flashcard) return null;

  // Truncate long text for display
  const truncateText = (text: string, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń fiszkę</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Czy na pewno chcesz usunąć tę fiszkę? Ta operacja jest nieodwracalna i nie można jej cofnąć.</p>

              {/* Flashcard preview */}
              <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Przód:</span>
                  <p className="text-sm">{truncateText(flashcard.front)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tył:</span>
                  <p className="text-sm">{truncateText(flashcard.back)}</p>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Status: {flashcard.status}</span>
                  <span>Źródło: {flashcard.source}</span>
                  <span>Powtórki: {flashcard.repetition_count}</span>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Usuwanie..." : "Usuń fiszkę"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
