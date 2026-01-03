/**
 * CreateFlashcardModal - Modal do tworzenia nowej fiszki
 * Zawiera formularz z polami przĂłd, tyĹ‚ i ĹşrĂłdĹ‚o
 */

import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { CreateFlashcardCommand, FlashcardSource } from "./types";

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFlashcardCommand) => Promise<void>;
}

interface FormData {
  front: string;
  back: string;
  source: FlashcardSource;
}

interface FormErrors {
  front?: string;
  back?: string;
  source?: string;
  general?: string;
}

const DEFAULT_FORM_DATA: FormData = {
  front: "",
  back: "",
  source: "manual",
};

export function CreateFlashcardModal({ isOpen, onClose, onSubmit }: CreateFlashcardModalProps) {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData(DEFAULT_FORM_DATA);
      setErrors({});
    }
  }, [isOpen]);

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const newErrors: FormErrors = {};

    if (!data.front.trim()) {
      newErrors.front = "PrzĂłd fiszki nie moĹĽe byÄ‡ pusty";
    } else if (data.front.length > 200) {
      newErrors.front = "PrzĂłd fiszki moĹĽe mieÄ‡ maksymalnie 200 znakĂłw";
    }

    if (!data.back.trim()) {
      newErrors.back = "TyĹ‚ fiszki nie moĹĽe byÄ‡ pusty";
    } else if (data.back.length > 500) {
      newErrors.back = "TyĹ‚ fiszki moĹĽe mieÄ‡ maksymalnie 500 znakĂłw";
    }

    if (!["manual", "ai", "mixed"].includes(data.source)) {
      newErrors.source = "NieprawidĹ‚owe ĹşrĂłdĹ‚o fiszki";
    }

    return newErrors;
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        await onSubmit({
          front: formData.front.trim(),
          back: formData.back.trim(),
          source: formData.source,
        });

        // Success - modal will be closed by parent component
        setFormData(DEFAULT_FORM_DATA);
      } catch (error) {
        setErrors({
          general: error instanceof Error ? error.message : "WystÄ…piĹ‚ bĹ‚Ä…d podczas tworzenia fiszki",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, onSubmit]
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

  // Handle select changes
  const handleSourceChange = useCallback(
    (value: FlashcardSource) => {
      setFormData((prev) => ({ ...prev, source: value }));
      if (errors.source) {
        setErrors((prev) => ({ ...prev, source: undefined }));
      }
    },
    [errors.source]
  );

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowÄ… fiszkÄ™</DialogTitle>
          <DialogDescription>
            Utwórz nową fiszkę wprowadzając pytanie i odpowiedź. Możesz również wybrać źródło pochodzenia fiszki.
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
            <Label htmlFor="front">
              PrzĂłd fiszki <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="front"
              placeholder="Wpisz pytanie lub pojÄ™cie..."
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
            <Label htmlFor="back">
              TyĹ‚ fiszki <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="back"
              placeholder="Wpisz odpowiedĹş lub wyjaĹ›nienie..."
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

          {/* Source field */}
          <div className="space-y-2">
            <Label htmlFor="source">ĹąrĂłdĹ‚o</Label>
            <Select value={formData.source} onValueChange={handleSourceChange} disabled={isSubmitting}>
              <SelectTrigger className={errors.source ? "border-destructive" : ""}>
                <SelectValue placeholder="Wybierz ĹşrĂłdĹ‚o" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">RÄ™czne</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="mixed">Mieszane</SelectItem>
              </SelectContent>
            </Select>
            {errors.source && <p className="text-xs text-destructive">{errors.source}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.front.trim() || !formData.back.trim()}>
              {isSubmitting ? "Dodawanie..." : "Dodaj fiszkÄ™"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
