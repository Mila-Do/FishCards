/**
 * EditFlashcardModal - Modal do edycji istniejącej fiszki
 * Zawiera formularz ze wszystkimi polami fiszki do modyfikacji
 */

import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { FlashcardViewModel, UpdateFlashcardCommand, FlashcardSource, FlashcardStatus } from "./types";

interface EditFlashcardModalProps {
  flashcard: FlashcardViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateFlashcardCommand) => Promise<void>;
}

interface FormData {
  front: string;
  back: string;
  status: FlashcardStatus;
  source: FlashcardSource;
  repetition_count: number;
}

interface FormErrors {
  front?: string;
  back?: string;
  status?: string;
  source?: string;
  repetition_count?: string;
  general?: string;
}

const DEFAULT_FORM_DATA: FormData = {
  front: "",
  back: "",
  status: "new",
  source: "manual",
  repetition_count: 0,
};

export function EditFlashcardModal({ flashcard, isOpen, onClose, onSubmit }: EditFlashcardModalProps) {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [originalData, setOriginalData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when flashcard changes
  useEffect(() => {
    if (flashcard && isOpen) {
      const initialData: FormData = {
        front: flashcard.front,
        back: flashcard.back,
        status: flashcard.status as FlashcardStatus,
        source: flashcard.source as FlashcardSource,
        repetition_count: flashcard.repetition_count,
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setErrors({});
    }
  }, [flashcard, isOpen]);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const newErrors: FormErrors = {};

    if (!data.front.trim()) {
      newErrors.front = "Przód fiszki nie może być pusty";
    } else if (data.front.length > 200) {
      newErrors.front = "Przód fiszki może mieć maksymalnie 200 znaków";
    }

    if (!data.back.trim()) {
      newErrors.back = "Tył fiszki nie może być pusty";
    } else if (data.back.length > 500) {
      newErrors.back = "Tył fiszki może mieć maksymalnie 500 znaków";
    }

    if (!["new", "learning", "review", "mastered"].includes(data.status)) {
      newErrors.status = "Nieprawidłowy status fiszki";
    }

    if (!["manual", "ai", "mixed"].includes(data.source)) {
      newErrors.source = "Nieprawidłowe źródło fiszki";
    }

    if (!Number.isInteger(data.repetition_count) || data.repetition_count < 0) {
      newErrors.repetition_count = "Liczba powtórzeń musi być nieujemną liczbą całkowitą";
    }

    return newErrors;
  }, []);

  // Check if form has changes
  const hasChanges = useCallback(() => {
    return (
      formData.front !== originalData.front ||
      formData.back !== originalData.back ||
      formData.status !== originalData.status ||
      formData.source !== originalData.source ||
      formData.repetition_count !== originalData.repetition_count
    );
  }, [formData, originalData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!flashcard) return;

      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (!hasChanges()) {
        onClose();
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        // Only send changed fields
        const updates: UpdateFlashcardCommand = {};
        if (formData.front !== originalData.front) updates.front = formData.front.trim();
        if (formData.back !== originalData.back) updates.back = formData.back.trim();
        if (formData.status !== originalData.status) updates.status = formData.status;
        if (formData.source !== originalData.source) updates.source = formData.source;
        if (formData.repetition_count !== originalData.repetition_count) {
          updates.repetition_count = formData.repetition_count;
        }

        await onSubmit(flashcard.id, updates);

        // Success - modal will be closed by parent component
      } catch (error) {
        setErrors({
          general: error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji fiszki",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [flashcard, formData, originalData, validateForm, hasChanges, onSubmit, onClose]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Handle number input changes
  const handleNumberChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 0) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      }
    },
    [errors]
  );

  // Handle select changes
  const handleSelectChange = useCallback(
    (field: keyof FormData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Reset form to original values
  const handleReset = useCallback(() => {
    setFormData(originalData);
    setErrors({});
  }, [originalData]);

  if (!flashcard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>
            Modyfikuj zawartość i właściwości fiszki. Zmiany zostaną zapisane po kliknięciu &ldquo;Zapisz zmiany&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General error */}
          {errors.general && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {errors.general}
            </div>
          )}

          {/* Front field */}
          <div className="space-y-2">
            <Label htmlFor="edit-front">
              Przód fiszki <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-front"
              placeholder="Wpisz pytanie lub pojęcie..."
              value={formData.front}
              onChange={handleInputChange("front")}
              className={errors.front ? "border-destructive" : ""}
              rows={2}
              maxLength={200}
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.front && <span className="text-destructive">{errors.front}</span>}</span>
              <span>{formData.front.length}/200</span>
            </div>
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <Label htmlFor="edit-back">
              Tył fiszki <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-back"
              placeholder="Wpisz odpowiedź lub wyjaśnienie..."
              value={formData.back}
              onChange={handleInputChange("back")}
              className={errors.back ? "border-destructive" : ""}
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.back && <span className="text-destructive">{errors.back}</span>}</span>
              <span>{formData.back.length}/500</span>
            </div>
          </div>

          {/* Status and Source row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={handleSelectChange("status")} disabled={isSubmitting}>
                <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nowa</SelectItem>
                  <SelectItem value="learning">Nauka</SelectItem>
                  <SelectItem value="review">Powtórka</SelectItem>
                  <SelectItem value="mastered">Opanowana</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-source">Źródło</Label>
              <Select value={formData.source} onValueChange={handleSelectChange("source")} disabled={isSubmitting}>
                <SelectTrigger className={errors.source ? "border-destructive" : ""}>
                  <SelectValue placeholder="Wybierz źródło" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Ręczne</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="mixed">Mieszane</SelectItem>
                </SelectContent>
              </Select>
              {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
            </div>
          </div>

          {/* Repetition count */}
          <div className="space-y-2">
            <Label htmlFor="edit-repetition-count">Liczba powtórzeń</Label>
            <Input
              id="edit-repetition-count"
              type="number"
              min="0"
              value={formData.repetition_count}
              onChange={handleNumberChange("repetition_count")}
              className={errors.repetition_count ? "border-destructive" : ""}
              disabled={isSubmitting}
            />
            {errors.repetition_count && <p className="text-xs text-destructive">{errors.repetition_count}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            {hasChanges() && (
              <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>
                Resetuj
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || !formData.front.trim() || !formData.back.trim() || !hasChanges()}
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
