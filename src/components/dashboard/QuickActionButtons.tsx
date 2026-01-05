/**
 * QuickActionButtons - Section with quick access buttons for main app functions
 * Provides easy navigation to key features from the dashboard
 */

import React, { memo } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { QuickAction } from "../../types";
import { Play, Plus, Library, History } from "lucide-react";

/* eslint-disable react/prop-types */
interface QuickActionButtonsProps {
  /** Array of quick action configurations */
  actions: QuickAction[];
  /** Whether all buttons should be disabled */
  disabled?: boolean;
  /** Callback for action button clicks */
  onActionClick?: (actionId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// Icon mapping for quick actions
const getActionIcon = (actionId: string) => {
  switch (actionId) {
    case "start-learning":
      return <Play size={18} />;
    case "new-generator":
      return <Plus size={18} />;
    case "my-flashcards":
      return <Library size={18} />;
    case "generation-history":
      return <History size={18} />;
    default:
      return null;
  }
};

// Button variant mapping
const getButtonVariant = (variant: QuickAction["variant"]) => {
  switch (variant) {
    case "primary":
      return "default";
    case "secondary":
      return "secondary";
    case "outline":
      return "outline";
    default:
      return "default";
  }
};

export const QuickActionButtons = memo<QuickActionButtonsProps>(function QuickActionButtons({
  actions,
  disabled = false,
  onActionClick,
  className,
}) {
  const handleActionClick = (actionId: string) => {
    if (!disabled && onActionClick) {
      onActionClick(actionId);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section title */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Szybkie akcje</h2>
        <p className="text-sm text-muted-foreground">Dostęp do najważniejszych funkcji aplikacji</p>
      </div>

      {/* Action buttons grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const isDisabled = disabled || action.disabled;
          const icon = action.icon || getActionIcon(action.id);

          return (
            <Button
              key={action.id}
              variant={getButtonVariant(action.variant)}
              size="lg"
              disabled={isDisabled}
              onClick={() => handleActionClick(action.id)}
              className={cn(
                "h-auto p-4 flex-col gap-3 text-left justify-start",
                // Primary variant gets special styling
                action.variant === "primary" && [
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90",
                  "shadow-md",
                ],
                // Enhanced hover effects for clickable buttons
                !isDisabled && ["transition-all duration-200", "hover:scale-[1.02]", "active:scale-[0.98]"]
              )}
              aria-label={`${action.title}: ${action.description}`}
            >
              {/* Icon and title row */}
              <div className="flex items-center gap-2 w-full">
                {icon && (
                  <div
                    className={cn(
                      "flex-shrink-0",
                      action.variant === "primary" ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  >
                    {icon}
                  </div>
                )}
                <span className="font-medium text-sm">{action.title}</span>
              </div>

              {/* Description */}
              <p
                className={cn(
                  "text-xs leading-relaxed w-full text-left",
                  action.variant === "primary" ? "text-primary-foreground/90" : "text-muted-foreground"
                )}
              >
                {action.description}
              </p>
            </Button>
          );
        })}
      </div>

      {/* Empty state when no actions */}
      {actions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Brak dostępnych akcji</p>
        </div>
      )}
    </div>
  );
});

QuickActionButtons.displayName = "QuickActionButtons";
