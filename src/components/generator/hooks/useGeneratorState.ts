import { useState, useCallback } from "react";
import type { GeneratorViewState, ProposalState, GenerationProposalsResponse, CreateFlashcardsCommand } from "../types";
import { VALIDATION_LIMITS } from "../types";
import { validateSourceText } from "./useTextValidation";
import { authenticatedFetch } from "../../../lib/auth-helper";

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
   * Updates source text with validation using centralized validation logic
   */
  const updateSourceText = useCallback((text: string) => {
    const validation = validateSourceText(text);

    setState((prev) => ({
      ...prev,
      sourceText: text,
      errors: {
        ...prev.errors,
        textInput: validation.errors.length > 0 ? validation.errors : undefined,
      },
    }));
  }, []);

  /**
   * Generates proposals from source text via API
   */
  const generateProposals = useCallback(
    async (sourceText?: string): Promise<void> => {
      // Get sourceText from parameter or current state
      let currentSourceText = "";

      if (sourceText) {
        currentSourceText = sourceText;
      } else {
        // Fallback to getting from state synchronously
        const currentState = state;
        currentSourceText = currentState.sourceText;
      }

      // Validation check
      const validation = validateSourceText(currentSourceText);

      if (!validation.isValid) {
        setState((prev) => ({
          ...prev,
          errors: {
            ...prev.errors,
            api: "Tekst źródłowy jest nieprawidłowy lub za krótki",
          },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoadingProposals: true,
        errors: { ...prev.errors, api: undefined },
      }));

      try {
        console.log("🚀 [DEBUG] Rozpoczynam generowanie...");
        console.log("📝 [DEBUG] Tekst źródłowy:", currentSourceText.substring(0, 100) + "...");

        const response = await authenticatedFetch("/api/generations", {
          method: "POST",
          body: JSON.stringify({
            source_text: currentSourceText,
          }),
          signal: AbortSignal.timeout(VALIDATION_LIMITS.REQUEST_TIMEOUT_MS),
        });

        console.log("📡 [DEBUG] Odpowiedź serwera:", response.status, response.statusText);

        if (!response.ok) {
          console.log("❌ [DEBUG] Request failed:", response.status);
          const errorData = await response.json();
          console.log("📄 [DEBUG] Error data:", errorData);
          throw new Error(errorData.error?.message || "Błąd generowania propozycji");
        }

        const result: GenerationProposalsResponse = await response.json();
        console.log("🎉 [DEBUG] Success! Got", result.flashcards_proposals.length, "proposals");

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
        console.log("💥 [DEBUG] Frontend error:", error);

        let errorMessage = "Wystąpił błąd podczas generowania propozycji";

        if (error instanceof Error) {
          if (error.name === "TimeoutError") {
            errorMessage = "Generowanie trwa zbyt długo. Spróbuj ponownie.";
            console.log("⏰ [DEBUG] Request timed out");
          } else {
            errorMessage = error.message;
            console.log("⚠️ [DEBUG] Error message:", error.message);
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
    },
    [state.sourceText]
  ); // Depend on sourceText to get fresh value

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
          api: "Wybierz co najmniej jedną fiszkę do zapisania",
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

      const response = await authenticatedFetch("/api/flashcards", {
        method: "POST",
        body: JSON.stringify(flashcardsData),
        signal: AbortSignal.timeout(VALIDATION_LIMITS.REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Błąd zapisywania fiszek");
      }

      await response.json();

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
      let errorMessage = "Wystąpił błąd podczas zapisywania fiszek";

      if (error instanceof Error) {
        if (error.name === "TimeoutError") {
          errorMessage = "Zapisywanie trwa zbyt długo. Spróbuj ponownie.";
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
