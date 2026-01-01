import React from "react";
import type { ProposalsSectionProps } from "./types";

/**
 * Section containing list of generated flashcard proposals and save button
 * TODO: Full implementation in next steps - this is a placeholder stub
 */
const ProposalsSection: React.FC<
  ProposalsSectionProps & { onUpdateProposal: (id: string, updates: Partial<import("./types").ProposalState>) => void }
> = ({ proposals, onSave, isVisible, selectedCount, isLoading, onUpdateProposal }) => {
  if (!isVisible) return null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Propozycje fiszek</h2>

        {/* Skeleton loader - placeholder */}
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
          >
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Propozycje fiszek ({proposals.length})
        </h2>
        {selectedCount > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400">Wybrano: {selectedCount}</span>
        )}
      </div>

      {/* TODO: Implement ProposalCard components */}
      {proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">PrzĂłd:</span>
                  <p className="text-gray-900 dark:text-gray-100">{proposal.front}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">TyĹ‚:</span>
                  <p className="text-gray-900 dark:text-gray-100">{proposal.back}</p>
                </div>
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => onUpdateProposal(proposal.id, { status: "accepted" })}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                  >
                    âś“ Akceptuj
                  </button>
                  <button
                    onClick={() => onUpdateProposal(proposal.id, { status: "rejected" })}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                  >
                    âś— OdrzuÄ‡
                  </button>
                  <span className="text-xs text-gray-500 px-2 py-1">
                    Status: {proposal.status} | ĹąrĂłdĹ‚o: {proposal.source}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Save Button */}
          {selectedCount > 0 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={onSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Zapisz wybrane fiszki ({selectedCount})
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">Brak propozycji do wyĹ›wietlenia</p>
      )}
    </div>
  );
};

export default ProposalsSection;
