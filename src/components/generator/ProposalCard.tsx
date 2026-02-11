import React, { useState, useCallback, useEffect, memo, useId } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProposalCardProps } from "./types";
import { VALIDATION_LIMITS } from "./types";

/**
 * Card component representing a single flashcard proposal
 * Supports acceptance, editing, and rejection with full validation
 * Memoized to prevent unnecessary re-renders when proposal data unchanged
 */

const ProposalCard: React.FC<ProposalCardProps> = memo(({ proposal, onAccept, onEdit, onReject, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState(proposal.front);
  const [editBack, setEditBack] = useState(proposal.back);
  const [frontErrors, setFrontErrors] = useState<string[]>([]);
  const [backErrors, setBackErrors] = useState<string[]>([]);

  const frontId = useId();
  const backId = useId();
  const frontErrorsId = useId();
  const backErrorsId = useId();

  // Reset editing state when proposal changes
  useEffect(() => {
    setEditFront(proposal.front);
    setEditBack(proposal.back);
    setIsEditing(proposal.status === "editing");
  }, [proposal.front, proposal.back, proposal.status]);

  // Validation functions
  const validateFront = useCallback((text: string): string[] => {
    const errors: string[] = [];
    if (text.trim().length === 0) {
      errors.push("Przód fiszki nie może być pusty");
    }
    if (text.length > VALIDATION_LIMITS.FLASHCARD_FRONT_MAX) {
      errors.push(`Maksimum ${VALIDATION_LIMITS.FLASHCARD_FRONT_MAX} znaków`);
    }
    return errors;
  }, []);

  const validateBack = useCallback((text: string): string[] => {
    const errors: string[] = [];
    if (text.trim().length === 0) {
      errors.push("Tył fiszki nie może być pusty");
    }
    if (text.length > VALIDATION_LIMITS.FLASHCARD_BACK_MAX) {
      errors.push(`Maksimum ${VALIDATION_LIMITS.FLASHCARD_BACK_MAX} znaków`);
    }
    return errors;
  }, []);

  // Handle front text change with validation
  const handleFrontChange = useCallback(
    (value: string) => {
      setEditFront(value);
      const errors = validateFront(value);
      setFrontErrors(errors);
    },
    [validateFront]
  );

  // Handle back text change with validation
  const handleBackChange = useCallback(
    (value: string) => {
      setEditBack(value);
      const errors = validateBack(value);
      setBackErrors(errors);
    },
    [validateBack]
  );

  // Start editing mode
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    onEdit();
  }, [onEdit]);

  // Save edited content
  const handleSaveClick = useCallback(() => {
    const frontValidationErrors = validateFront(editFront);
    const backValidationErrors = validateBack(editBack);

    setFrontErrors(frontValidationErrors);
    setBackErrors(backValidationErrors);

    // Only save if validation passes
    if (frontValidationErrors.length === 0 && backValidationErrors.length === 0) {
      setIsEditing(false);
      onSave(editFront.trim(), editBack.trim());
    }
  }, [editFront, editBack, validateFront, validateBack, onSave]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditFront(proposal.front);
    setEditBack(proposal.back);
    setFrontErrors([]);
    setBackErrors([]);
  }, [proposal.front, proposal.back]);

  // Check if content was modified
  const isModified =
    proposal.isEdited || editFront.trim() !== proposal.originalFront || editBack.trim() !== proposal.originalBack;

  const hasValidationErrors = frontErrors.length > 0 || backErrors.length > 0;
  const canSave = !hasValidationErrors && (editFront.trim() !== proposal.front || editBack.trim() !== proposal.back);

  return (
    <Card
      className={`
      transition-all duration-200
      ${proposal.status === "accepted" ? "border-success bg-success-muted" : ""}
      ${proposal.status === "rejected" ? "opacity-60 grayscale" : ""}
      ${isEditing ? "border-primary bg-primary/5" : ""}
    `}
    >
      <CardContent className="space-y-4">
        {/* Source indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${proposal.source === "ai" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300" : ""}
              ${proposal.source === "mixed" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" : ""}
            `}
            >
              {proposal.source === "ai" ? "🤖 AI" : "🔀 Edytowane"}
            </span>
            {isModified && <span className="text-xs text-amber-600 dark:text-amber-400">• Zmodyfikowane</span>}
          </div>
          <div className="text-xs text-muted-foreground">
            Status:{" "}
            {proposal.status === "pending"
              ? "Oczekuje"
              : proposal.status === "accepted"
                ? "Zaakceptowane"
                : proposal.status === "editing"
                  ? "Edycja"
                  : "Odrzucone"}
          </div>
        </div>

        {/* Front side */}
        <div className="space-y-2">
          <label htmlFor={frontId} className="text-sm font-medium text-foreground">
            Przód fiszki
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                id={frontId}
                value={editFront}
                onChange={(e) => handleFrontChange(e.target.value)}
                placeholder="Wpisz treść przodu fiszki..."
                className={`min-h-[80px] resize-none ${frontErrors.length > 0 ? "border-danger focus-visible:ring-danger" : ""}`}
                maxLength={VALIDATION_LIMITS.FLASHCARD_FRONT_MAX}
                aria-describedby={frontErrors.length > 0 ? frontErrorsId : undefined}
                aria-invalid={frontErrors.length > 0}
                aria-required="true"
              />
              <div className="flex justify-between items-center">
                <div
                  id={frontErrorsId}
                  className="space-y-1"
                  role={frontErrors.length > 0 ? "alert" : undefined}
                  aria-live="polite"
                >
                  {frontErrors.map((error, index) => (
                    <p key={index} className="text-xs text-danger">
                      {error}
                    </p>
                  ))}
                </div>
                <span
                  className={`text-xs ${editFront.length > VALIDATION_LIMITS.FLASHCARD_FRONT_MAX * 0.9 ? "text-danger" : "text-gray-500"}`}
                >
                  {editFront.length}/{VALIDATION_LIMITS.FLASHCARD_FRONT_MAX}
                </span>
              </div>
            </div>
          ) : (
            <p className="p-3 bg-muted/30 rounded-md text-foreground min-h-[80px] flex items-start">{proposal.front}</p>
          )}
        </div>

        {/* Back side */}
        <div className="space-y-2">
          <label htmlFor={backId} className="text-sm font-medium text-foreground">
            Tył fiszki
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                id={backId}
                value={editBack}
                onChange={(e) => handleBackChange(e.target.value)}
                placeholder="Wpisz treść tyłu fiszki..."
                className={`min-h-[100px] resize-none ${backErrors.length > 0 ? "border-danger focus-visible:ring-danger" : ""}`}
                maxLength={VALIDATION_LIMITS.FLASHCARD_BACK_MAX}
                aria-describedby={backErrors.length > 0 ? backErrorsId : undefined}
                aria-invalid={backErrors.length > 0}
                aria-required="true"
              />
              <div className="flex justify-between items-center">
                <div
                  id={backErrorsId}
                  className="space-y-1"
                  role={backErrors.length > 0 ? "alert" : undefined}
                  aria-live="polite"
                >
                  {backErrors.map((error, index) => (
                    <p key={index} className="text-xs text-danger">
                      {error}
                    </p>
                  ))}
                </div>
                <span
                  className={`text-xs ${editBack.length > VALIDATION_LIMITS.FLASHCARD_BACK_MAX * 0.9 ? "text-danger" : "text-gray-500"}`}
                >
                  {editBack.length}/{VALIDATION_LIMITS.FLASHCARD_BACK_MAX}
                </span>
              </div>
            </div>
          ) : (
            <p className="p-3 bg-muted/30 rounded-md text-foreground min-h-[100px] flex items-start">{proposal.back}</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        {isEditing ? (
          // Editing mode buttons
          <div className="flex space-x-2">
            <Button onClick={handleSaveClick} size="sm" disabled={!canSave} className="bg-success hover:bg-success/90">
              💾 Zapisz
            </Button>
            <Button onClick={handleCancelEdit} variant="outline" size="sm">
              ✕ Anuluj
            </Button>
          </div>
        ) : (
          // Display mode buttons
          <div className="flex space-x-2">
            {proposal.status !== "accepted" && proposal.status !== "rejected" && (
              <>
                <Button
                  onClick={onAccept}
                  size="sm"
                  variant="outline"
                  className="text-success border-success hover:bg-success-muted"
                >
                  ✓ Akceptuj
                </Button>
                <Button
                  onClick={handleEditClick}
                  size="sm"
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  ✏️ Edytuj
                </Button>
              </>
            )}
            {proposal.status === "accepted" && (
              <Button
                onClick={handleEditClick}
                size="sm"
                variant="outline"
                className="text-primary border-primary hover:bg-primary/10"
              >
                ✏️ Edytuj
              </Button>
            )}
            {proposal.status !== "rejected" && (
              <Button
                onClick={onReject}
                size="sm"
                variant="outline"
                className="text-danger border-danger hover:bg-danger-muted"
              >
                ✗ Odrzuć
              </Button>
            )}
          </div>
        )}

        {/* Status indicator */}
        {proposal.status === "accepted" && (
          <div className="flex items-center text-success">
            <span className="text-sm font-medium">✓ Zaakceptowane</span>
          </div>
        )}
        {proposal.status === "rejected" && (
          <div className="flex items-center text-red-700 dark:text-red-400">
            <span className="text-sm font-medium">✗ Odrzucone</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
});

ProposalCard.displayName = "ProposalCard";

export default ProposalCard;
