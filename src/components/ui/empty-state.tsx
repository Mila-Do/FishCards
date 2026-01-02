import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import type { EmptyStateProps } from "@/lib/types/components";

/**
 * Common empty state icons
 */
const EmptyStateIcons = {
  noData: (
    <svg
      className="w-12 h-12 text-muted-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  ),

  noResults: (
    <svg
      className="w-12 h-12 text-muted-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),

  error: (
    <svg
      className="w-12 h-12 text-destructive/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  ),

  noConnection: (
    <svg
      className="w-12 h-12 text-muted-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
      />
    </svg>
  ),

  empty: (
    <svg
      className="w-12 h-12 text-muted-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),

  folder: (
    <svg
      className="w-12 h-12 text-muted-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),

  users: (
    <svg
      className="w-12 h-12 text-muted-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),

  image: (
    <svg
      className="w-12 h-12 text-muted-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
};

/**
 * Unified empty state component
 */
const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, icon, action, secondaryAction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center text-center py-12 px-4", className)}
        {...props}
      >
        {/* Icon */}
        <div className="mb-4">{icon || EmptyStateIcons.noData}</div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

        {/* Description */}
        {description && <p className="text-muted-foreground text-sm max-w-md mb-6">{description}</p>}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {action && (
              <Button onClick={action.onClick} variant="default" size="sm">
                {action.text}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" size="sm">
                {secondaryAction.text}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

/**
 * Pre-built empty state variants for common scenarios
 */
export const EmptyDataState: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}> = ({
  title = "Brak danych",
  description = "Nie znaleziono żadnych danych do wyświetlenia.",
  actionText = "Odśwież",
  onAction,
  className,
}) => (
  <EmptyState
    icon={EmptyStateIcons.noData}
    title={title}
    description={description}
    action={onAction ? { text: actionText, onClick: onAction } : undefined}
    className={className}
  />
);

export const NoResultsState: React.FC<{
  title?: string;
  description?: string;
  onClearFilters?: () => void;
  onAddNew?: () => void;
  className?: string;
}> = ({
  title = "Brak wyników",
  description = "Nie znaleziono wyników spełniających kryteria wyszukiwania.",
  onClearFilters,
  onAddNew,
  className,
}) => (
  <EmptyState
    icon={EmptyStateIcons.noResults}
    title={title}
    description={description}
    action={onClearFilters ? { text: "Wyczyść filtry", onClick: onClearFilters } : undefined}
    secondaryAction={onAddNew ? { text: "Dodaj nowy", onClick: onAddNew } : undefined}
    className={className}
  />
);

export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}> = ({
  title = "Wystąpił błąd",
  description = "Nie udało się załadować danych. Spróbuj ponownie.",
  onRetry,
  onGoBack,
  className,
}) => (
  <EmptyState
    icon={EmptyStateIcons.error}
    title={title}
    description={description}
    action={onRetry ? { text: "Spróbuj ponownie", onClick: onRetry } : undefined}
    secondaryAction={onGoBack ? { text: "Wróć", onClick: onGoBack } : undefined}
    className={className}
  />
);

export const NoConnectionState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Brak połączenia",
  description = "Sprawdź połączenie internetowe i spróbuj ponownie.",
  onRetry,
  className,
}) => (
  <EmptyState
    icon={EmptyStateIcons.noConnection}
    title={title}
    description={description}
    action={onRetry ? { text: "Spróbuj ponownie", onClick: onRetry } : undefined}
    className={className}
  />
);

export const EmptyFlashcardsState: React.FC<{
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreateFirst?: () => void;
  className?: string;
}> = ({ hasFilters = false, onClearFilters, onCreateFirst, className }) => {
  if (hasFilters) {
    return (
      <NoResultsState
        title="Brak fiszek spełniających kryteria"
        description="Spróbuj zmienić filtry lub wyczyść je, aby zobaczyć więcej fiszek."
        onClearFilters={onClearFilters}
        onAddNew={onCreateFirst}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      icon={EmptyStateIcons.empty}
      title="Brak fiszek"
      description="Rozpocznij budowanie swojej biblioteki fiszek dodając pierwszą fiszkę."
      action={onCreateFirst ? { text: "Dodaj pierwszą fiszkę", onClick: onCreateFirst } : undefined}
      className={className}
    />
  );
};

export const EmptyProposalsState: React.FC<{
  hasText?: boolean;
  isTextValid?: boolean;
  onGenerate?: () => void;
  className?: string;
}> = ({ hasText = false, isTextValid = false, onGenerate, className }) => {
  const title = hasText ? "Brak wygenerowanych propozycji" : "Wprowadź tekst";
  const description =
    hasText && isTextValid
      ? 'Kliknij "Generuj fiszki" aby rozpocząć.'
      : 'Wprowadź tekst o odpowiedniej długości i kliknij "Generuj fiszki".';

  return (
    <EmptyState
      icon={EmptyStateIcons.empty}
      title={title}
      description={description}
      action={hasText && isTextValid && onGenerate ? { text: "Generuj fiszki", onClick: onGenerate } : undefined}
      className={className}
    />
  );
};

export { EmptyState, EmptyStateIcons };
