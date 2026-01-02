import React from "react";
import { useGeneratorState } from "./hooks/useGeneratorState";
import { useTextValidation } from "./hooks/useTextValidation";
import TextInputSection from "./TextInputSection";
import ProposalsSection from "./ProposalsSection";
import LoadingOverlay from "./LoadingOverlay";

/**
 * Main container component for the flashcard generator view
 * Manages overall state and coordinates communication between subcomponents
 */
const GeneratorView: React.FC = () => {
  const { state, updateSourceText, generateProposals, updateProposal, saveSelectedProposals } = useGeneratorState();
  const textValidation = useTextValidation(state.sourceText);

  const hasProposals = state.proposals.length > 0;

  return (
    <div className="relative space-y-8">
      {/* Loading overlay for saving flashcards */}
      <LoadingOverlay isVisible={state.isSavingFlashcards} message="Zapisywanie fiszek..." />

      {/* Text Input Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <TextInputSection
          value={state.sourceText}
          onChange={updateSourceText}
          onGenerate={() => generateProposals(state.sourceText)}
          isLoading={state.isLoadingProposals}
          errors={state.errors.textInput || []}
        />
      </section>

      {/* API Error Display */}
      {state.errors.api && (
        <div role="alert" aria-live="assertive" className="bg-danger-muted border border-danger rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-danger">Błąd</h3>
              <div className="mt-2 text-sm text-danger">{state.errors.api}</div>
            </div>
          </div>
        </div>
      )}

      {/* Proposals Section */}
      {(hasProposals || state.isLoadingProposals) && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
          <ProposalsSection
            proposals={state.proposals}
            onSave={saveSelectedProposals}
            isVisible={hasProposals || state.isLoadingProposals}
            isLoading={state.isLoadingProposals}
            selectedCount={state.selectedCount}
            onUpdateProposal={updateProposal}
          />
        </section>
      )}

      {/* Empty State */}
      {!hasProposals && !state.isLoadingProposals && state.sourceText.length > 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path
              d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c4.21 0 7.813 2.602 9.288 6.286"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Brak wygenerowanych propozycji</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {textValidation.isValid
              ? 'Kliknij "Generuj fiszki" aby rozpocząć.'
              : 'Wprowadź tekst o odpowiedniej długości i kliknij "Generuj fiszki".'}
          </p>
        </div>
      )}
    </div>
  );
};

export default GeneratorView;
