import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import ProposalCard from "./ProposalCard";
import ProposalsSkeleton from "./ProposalsSkeleton";
import type { ProposalsSectionProps } from "./types";

/**
 * Section containing list of generated flashcard proposals and save button
 * Integrates ProposalCard and ProposalsSkeleton components with full functionality
 */
const ProposalsSection: React.FC<ProposalsSectionProps> = ({
  proposals,
  onSave,
  isVisible,
  isLoading,
  onUpdateProposal,
}) => {
  // Callback handlers for proposal actions - must be defined before any early returns
  const handleAccept = useCallback(
    (proposalId: string) => {
      onUpdateProposal(proposalId, { status: "accepted" });
    },
    [onUpdateProposal]
  );

  const handleEdit = useCallback(
    (proposalId: string) => {
      onUpdateProposal(proposalId, { status: "editing" });
    },
    [onUpdateProposal]
  );

  const handleReject = useCallback(
    (proposalId: string) => {
      onUpdateProposal(proposalId, { status: "rejected" });
    },
    [onUpdateProposal]
  );

  const handleSave = useCallback(
    (proposalId: string, front: string, back: string) => {
      onUpdateProposal(proposalId, {
        front,
        back,
        status: "accepted",
        isEdited: true,
        source: "mixed", // Automatically set to mixed when edited
      });
    },
    [onUpdateProposal]
  );

  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;
  const canSave = acceptedCount > 0;

  if (!isVisible) return null;

  // Show skeleton loading state
  if (isLoading) {
    return <ProposalsSkeleton count={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Propozycje fiszek ({proposals.length})</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {acceptedCount > 0 && (
            <span className="bg-success-muted text-success px-2 py-1 rounded-full">Zaakceptowane: {acceptedCount}</span>
          )}
          <span>Łącznie: {proposals.length}</span>
        </div>
      </div>

      {/* Proposals List */}
      {proposals.length > 0 ? (
        <div className="space-y-4">
          {/* Filter out rejected proposals from display */}
          {proposals
            .filter((proposal) => proposal.status !== "rejected")
            .map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onAccept={() => handleAccept(proposal.id)}
                onEdit={() => handleEdit(proposal.id)}
                onReject={() => handleReject(proposal.id)}
                onSave={(front, back) => handleSave(proposal.id, front, back)}
              />
            ))}

          {/* Empty state if all proposals are rejected */}
          {proposals.filter((p) => p.status !== "rejected").length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">Wszystkie propozycje zostały odrzucone</h3>
              <p className="text-sm text-muted-foreground">Wygeneruj nowe propozycje lub przywróć odrzucone</p>
            </div>
          )}

          {/* Save Section */}
          {canSave && (
            <div className="border-t border-surface-border pt-6">
              <div className="flex flex-col items-center space-y-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Gotowe do zapisania: <span className="font-semibold text-foreground">{acceptedCount}</span> fiszek
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Zaakceptowane fiszki zostaną dodane do Twojej kolekcji
                  </p>
                </div>
                <Button
                  onClick={onSave}
                  size="lg"
                  className="bg-primary hover:bg-primary-hover text-white font-medium px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Zapisz wybrane fiszki ({acceptedCount})
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Helper text when no proposals accepted */}
          {!canSave && proposals.filter((p) => p.status !== "rejected").length > 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">⬆️ Zaakceptuj co najmniej jedną fiszkę aby móc je zapisać</p>
            </div>
          )}
        </div>
      ) : (
        /* Empty state - no proposals */
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">Brak propozycji do wyświetlenia</h3>
          <p className="text-sm text-muted-foreground">Wygeneruj propozycje fiszek używając tekstu źródłowego</p>
        </div>
      )}
    </div>
  );
};

export default ProposalsSection;
