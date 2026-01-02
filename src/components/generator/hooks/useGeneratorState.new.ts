/**
 * Optimized main hook for managing generator view state
 * Uses new API hooks and improved dependency management
 */

import { useState, useCallback, useMemo } from "react";
import type { GeneratorViewState, ProposalState, CreateFlashcardsCommand } from "../types";
import type { GenerationProposalsResponse } from "../../../types";
import { useGenerationsApi, useFlashcardsApi } from "../../../lib/hooks";
import { useProposalValidation } from "./useProposalValidation";
import { useTextValidation } from "./useTextValidation";

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

  // API hooks with proper error handling
  const generationsApi = useGenerationsApi({
    onError: (error) => {
      setState((prev) => ({
        ...prev,
        isLoadingProposals: false,
        errors: { ...prev.errors, api: error },
      }));
    },
  });

  const flashcardsApi = useFlashcardsApi({
    onSuccess: () => {
      // Reset state after successful save
      setState((prev) => ({
        ...prev,
        isSavingFlashcards: false,
        proposals: [],
        sourceText: "",
        generationId: null,
        selectedCount: 0,
      }));
    },
    onError: (error) => {
      setState((prev) => ({
        ...prev,
        isSavingFlashcards: false,
        errors: { ...prev.errors, api: error },
      }));
    },
  });

  // Text validation hook with debouncing
  const textValidation = useTextValidation(state.sourceText);

  // Proposal validation hook
  const { validateProposal, validateAllProposals } = useProposalValidation();

  // Memoized computed values
  const computedValues = useMemo(() => {
    const acceptedProposals = state.proposals.filter((p) => p.status === "accepted");
    const hasValidText = textValidation.isValid;
    const canGenerate = hasValidText && !state.isLoadingProposals;
    const canSave = acceptedProposals.length > 0 && !state.isSavingFlashcards;

    return {
      acceptedProposals,
      hasValidText,
      canGenerate,
      canSave,
      selectedCount: acceptedProposals.length,
    };
  }, [state.proposals, state.isLoadingProposals, state.isSavingFlashcards, textValidation.isValid]);

  /**
   * Updates source text with immediate UI feedback
   */
  const updateSourceText = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      sourceText: text,
      errors: {
        ...prev.errors,
        textInput: undefined, // Clear previous errors, validation hook will handle new ones
      },
    }));
  }, []);

  /**
   * Generates proposals using the new API hook
   */
  const generateProposals = useCallback(async (): Promise<void> => {
    // Use current text validation state
    if (!textValidation.isValid) {
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
      const result = await generationsApi.generateProposals(state.sourceText);

      if (result.success && result.data) {
        const responseData = result.data as GenerationProposalsResponse;

        // Convert API proposals to ProposalState
        const proposals: ProposalState[] = responseData.flashcards_proposals.map((proposal, index: number) => ({
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
          generationId: responseData.generation_id || null,
          isLoadingProposals: false,
          selectedCount: 0,
        }));
      }
    } catch {
      // Error handling is done by the API hook onError callback
      // No additional logging needed as it's handled at the API level
    }
  }, [state.sourceText, textValidation.isValid, generationsApi]);

  /**
   * Updates a proposal with validation and automatic source detection
   */
  const updateProposal = useCallback(
    (id: string, updates: Partial<ProposalState>) => {
      setState((prev) => ({
        ...prev,
        proposals: prev.proposals.map((proposal) => {
          if (proposal.id !== id) return proposal;

          const updatedProposal = { ...proposal, ...updates };

          // Automatic source handling
          if (
            (updates.front !== undefined && updates.front !== proposal.originalFront) ||
            (updates.back !== undefined && updates.back !== proposal.originalBack)
          ) {
            updatedProposal.source = "mixed";
            updatedProposal.isEdited = true;
          }

          // Run validation if content changed
          if (updates.front !== undefined || updates.back !== undefined) {
            updatedProposal.validationErrors = validateProposal(updatedProposal);
          }

          return updatedProposal;
        }),
        selectedCount: computedValues.selectedCount, // Will be recalculated in next render
      }));
    },
    [validateProposal, computedValues.selectedCount]
  );

  /**
   * Saves selected proposals using the new API hook
   */
  const saveSelectedProposals = useCallback(async (): Promise<void> => {
    if (!computedValues.canSave) {
      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          api: "Wybierz co najmniej jedną fiszkę do zapisania",
        },
      }));
      return;
    }

    // Validate all proposals before saving
    const validationErrors = validateAllProposals(computedValues.acceptedProposals);
    if (Object.keys(validationErrors).length > 0) {
      setState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          api: "Niektóre fiszki zawierają błędy. Popraw je przed zapisaniem.",
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
      const flashcardsData: CreateFlashcardsCommand = computedValues.acceptedProposals.map((proposal) => ({
        front: proposal.front,
        back: proposal.back,
        source: proposal.source,
        generation_id: state.generationId,
      }));

      await flashcardsApi.createFlashcard(flashcardsData);
      // Success handling is done by the API hook
    } catch {
      // Error handling is done by the API hook onError callback
      // No additional logging needed as it's handled at the API level
    }
  }, [computedValues, validateAllProposals, state.generationId, flashcardsApi]);

  return {
    state: {
      ...state,
      selectedCount: computedValues.selectedCount,
    },
    computed: computedValues,
    validation: textValidation,
    updateSourceText,
    generateProposals,
    updateProposal,
    saveSelectedProposals,
  };
};
