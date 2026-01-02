/**
 * Hook for validating individual and multiple proposals
 * Extracted from useGeneratorState for better separation of concerns
 */

import { useCallback } from "react";
import { validateFlashcardFront, validateFlashcardBack } from "../../../lib/validation/text";
import type { ProposalState, ProposalValidationErrors } from "../types";

export function useProposalValidation() {
  /**
   * Validates a single proposal and returns validation errors
   */
  const validateProposal = useCallback((proposal: ProposalState): ProposalValidationErrors => {
    const errors: ProposalValidationErrors = { front: [], back: [] };

    // Validate front side
    const frontValidation = validateFlashcardFront(proposal.front);
    if (!frontValidation.isValid) {
      errors.front = frontValidation.errors;
    }

    // Validate back side
    const backValidation = validateFlashcardBack(proposal.back);
    if (!backValidation.isValid) {
      errors.back = backValidation.errors;
    }

    return errors;
  }, []);

  /**
   * Validates multiple proposals and returns a map of errors by proposal ID
   */
  const validateAllProposals = useCallback(
    (proposals: ProposalState[]): Record<string, ProposalValidationErrors> => {
      const allErrors: Record<string, ProposalValidationErrors> = {};

      proposals.forEach((proposal) => {
        const errors = validateProposal(proposal);
        if (Object.keys(errors).length > 0) {
          allErrors[proposal.id] = errors;
        }
      });

      return allErrors;
    },
    [validateProposal]
  );

  /**
   * Checks if a proposal has any validation errors
   */
  const hasValidationErrors = useCallback(
    (proposal: ProposalState): boolean => {
      const errors = validateProposal(proposal);
      return Object.keys(errors).length > 0;
    },
    [validateProposal]
  );

  /**
   * Checks if all proposals in a list are valid
   */
  const areAllProposalsValid = useCallback(
    (proposals: ProposalState[]): boolean => {
      return proposals.every((proposal) => !hasValidationErrors(proposal));
    },
    [hasValidationErrors]
  );

  return {
    validateProposal,
    validateAllProposals,
    hasValidationErrors,
    areAllProposalsValid,
  };
}
