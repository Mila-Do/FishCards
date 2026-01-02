import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { SpinnerProps } from "@/lib/types/components";

/**
 * Spinning loader component with various sizes and colors
 */
const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", color = "primary", text, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    };

    const colorClasses = {
      primary: "border-primary border-t-transparent",
      secondary: "border-secondary border-t-transparent",
      white: "border-white border-t-transparent",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        role="status"
        aria-label={text || "Ładowanie"}
        {...props}
      >
        <div className="flex items-center space-x-2">
          <div
            className={cn("animate-spin rounded-full border-2", sizeClasses[size], colorClasses[color])}
            aria-hidden="true"
          />
          {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

/**
 * Dots spinner animation
 */
export const DotsSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  className?: string;
}> = ({ size = "md", color = "primary", className }) => {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    white: "bg-white",
  };

  return (
    <div className={cn("flex space-x-1 items-center", className)} role="status" aria-label="Ładowanie">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("rounded-full animate-bounce", sizeClasses[size], colorClasses[color])}
          style={{ animationDelay: `${i * 0.1}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * Pulse spinner animation
 */
export const PulseSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "white";
  className?: string;
}> = ({ size = "md", color = "primary", className }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    white: "bg-white",
  };

  return (
    <div
      className={cn("rounded-full animate-pulse opacity-75", sizeClasses[size], colorClasses[color], className)}
      role="status"
      aria-label="Ładowanie"
    />
  );
};

/**
 * Loading overlay component
 */
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message?: string;
  spinnerSize?: "sm" | "md" | "lg";
  backdrop?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ isVisible, message = "Ładowanie...", spinnerSize = "lg", backdrop = true, className, children }) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        backdrop && "bg-background/80 backdrop-blur-sm",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Ładowanie"
    >
      <div className="flex flex-col items-center space-y-4 p-6">
        {children || <Spinner size={spinnerSize} color="primary" />}
        <div className="text-center max-w-xs">
          <p className="text-foreground font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline loading component for buttons and small spaces
 */
export const InlineLoader: React.FC<{
  size?: "sm" | "md" | "lg";
  type?: "spinner" | "dots" | "pulse";
  color?: "primary" | "secondary" | "white";
  text?: string;
  className?: string;
}> = ({ size = "sm", type = "spinner", color = "primary", text, className }) => {
  const LoaderComponent = {
    spinner: Spinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
  }[type];

  return (
    <div className={cn("inline-flex items-center space-x-2", className)}>
      <LoaderComponent size={size} color={color} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

/**
 * Loading state wrapper component
 */
export const LoadingWrapper: React.FC<{
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ loading, error, empty = false, loadingComponent, errorComponent, emptyComponent, children, className }) => {
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        {loadingComponent || <Spinner size="md" text="Ładowanie..." />}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        {errorComponent || (
          <div className="text-destructive">
            <p className="font-medium">Wystąpił błąd</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={cn("text-center py-8", className)}>
        {emptyComponent || (
          <div className="text-muted-foreground">
            <p>Brak danych do wyświetlenia</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export { Spinner };
