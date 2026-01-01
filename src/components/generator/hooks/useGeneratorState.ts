import { useState, useCallback } from "react";
import type {
  GeneratorViewState,
  ProposalState,
  GenerationProposalsResponse,
  FlashcardDTO,
  CreateFlashcardsCommand,
} from "../types";
import { VALIDATION_LIMITS } from "../types";

/**
 * Main hook for managing generator view state
 */
export const useGeneratorState = () => {
  const [state, setState] = useState<GeneratorViewState>({
    sourceText: "",
    proposals: [],
    isLoadingProposals: false,
    isSavingFlashcards: false,
    errors: {},
    generationId: null,
    selectedCount: 0,
  });

  /**
   * Updates source text with validation
   */
  const updateSourceText = useCallback((text: string) => {
    const errors: string[] = [];

    if (text.length < VALIDATION_LIMITS.SOURCE_TEXT_MIN) {
      errors.push(`Minimum ${VALIDATION_LIMITS.SOURCE_TEXT_MIN} znakĂłw`);
    }

    if (text.length > VALIDATION_LIMITS.SOURCE_TEXT_MAX) {
      errors.push(`Maksimum ${VALIDATION_LIMITS.SOURCE_TEXT_MAX} znakĂłw`);
    }

    setState((prev) => ({
      ...prev,
      sourceText: text,
      errors: {
        ...prev.errors,
        textInput: errors.length > 0 ? errors : undefined,
      },
    }));
  }, []);

  /**
   * Generates proposals from source text via API
   */
  const generateProposals = useCallback(async (): Promise<void> => {
    // Early return if text is invalid
    if (
      state.sourceText.length < VALIDATION_LIMITS.SOURCE_TEXT_MIN ||
      state.sourceText.length > VALIDATION_LIMITS.SOURCE_TEXT_MAX
    ) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoadingProposals: true,
      errors: { ...prev.errors, api: undefined },
    }));

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_text: state.sourceText,
        }),
        signal: AbortSignal.timeout(VALIDATION_LIMITS.REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "BĹ‚Ä…d generowania propozycji");
      }

      const result: GenerationProposalsResponse = await response.json();

      // Convert API proposals to ProposalState with source: 'ai'
      const proposals: ProposalState[] = result.flashcards_proposals.map((proposal, index) => ({
        id: `proposal-${Date.now()}-${index}`,
        front: proposal.front,
        back: proposal.back,
        source: "ai" as const,
        status: "pending" as const,
        isEdited: false,
        originalFront: proposal.front,
        originalBack: proposal.back,
        validationErrors: {},
      }));

      setState((prev) => ({
        ...prev,
        proposals,
        generationId: result.generation_id,
        isLoadingProposals: false,
        selectedCount: 0,
      }));
    } catch (error) {
      let errorMessage = "WystÄ…piĹ‚ bĹ‚Ä…d podczas generowania propozycji";

      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          errorMessage = "Generowanie trwa zbyt dĹ‚ugo. SprĂłbuj ponownie.";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isLoadingProposals: false,
        errors: {
          ...prev.errors,
          api: errorMessage,
        },
      }));
    }
  }, [state.sourceText]);

  /**
   * Updates a single proposal with automatic source handling
   */
  const updateProposal = useCallback((id: string, updates: Partial<ProposalState>) => {
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.map((proposal) => {
        if (proposal.id !== id) return proposal;

        const updatedProposal = { ...proposal, ...updates };

        // Automatically change source to 'mixed' if front/back is edited
        if (
          (updates.front !== undefined && updates.front !== proposal.originalFront) ||
          (updates.back !== undefined && updates.back !== proposal.originalBack)
        ) {
          updatedProposal.source = "mixed";
          updatedProposal.isEdited = true;
        }

        return updatedProposal;
      }),
      selectedCount: prev.proposals.filter((p) =>
        p.id === id ? updates.status === "accepted" || updates.status === "editing" : p.status === "accepted"
      ).length,
    }));
  }, []);

  /**
   * Saves selected proposals to database
   */
  const saveSelectedProposals = useCallback(async (): Promise<void> => {
    const acceptedProposals = state.proposals.filter((p) => p.status === "accepted");

    // Early return if no proposals selected
    if (acceptedProposals.length === 0) {
      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          api: "Wybierz co najmniej jednÄ… fiszkÄ™ do zapisania",
        },
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isSavingFlashcards: true,
      errors: { ...prev.errors, api: undefined },
    }));

    try {
      const flashcardsData: CreateFlashcardsCommand = acceptedProposals.map((proposal) => ({
        front: proposal.front,
        back: proposal.back,
        source: proposal.source,
        generation_id: state.generationId,
      }));

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flashcardsData),
        signal: AbortSignal.timeout(VALIDATION_LIMITS.REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "BĹ‚Ä…d zapisywania fiszek");
      }

      const savedFlashcards: FlashcardDTO[] = await response.json();

      // Reset state after successful save
      setState((prev) => ({
        ...prev,
        isSavingFlashcards: false,
        proposals: [],
        sourceText: "",
        generationId: null,
        selectedCount: 0,
      }));

      // TODO: Show success message and potentially redirect
      // Success state handled by parent component
    } catch (error) {
      let errorMessage = "WystÄ…piĹ‚ bĹ‚Ä…d podczas zapisywania fiszek";

      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          errorMessage = "Zapisywanie trwa zbyt dĹ‚ugo. SprĂłbuj ponownie.";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isSavingFlashcards: false,
        errors: {
          ...prev.errors,
          api: errorMessage,
        },
      }));
    }
  }, [state.proposals, state.generationId]);

  return {
    state,
    updateSourceText,
    generateProposals,
    updateProposal,
    saveSelectedProposals,
  };
};
