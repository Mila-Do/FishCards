import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./button";
import { Card } from "./card";
import type { ErrorBoundaryProps } from "@/lib/types/components";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * Provides fallback UI and error recovery strategies
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log error details for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderFallbackUI() {
    const { error, retryCount } = this.state;
    const canRetry = retryCount < this.maxRetries;
    const errorName = error?.name || "Błąd aplikacji";
    const errorMessage = error?.message || "Wystąpił nieoczekiwany błąd";

    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-6 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{errorName}</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
          </div>

          <div className="space-y-3">
            {canRetry && (
              <Button
                onClick={this.handleRetry}
                variant="default"
                className="w-full"
                aria-label={`Spróbuj ponownie (próba ${retryCount + 1}/${this.maxRetries})`}
              >
                Spróbuj ponownie
                {retryCount > 0 && (
                  <span className="ml-2 text-xs opacity-80">
                    ({retryCount}/{this.maxRetries})
                  </span>
                )}
              </Button>
            )}

            <Button
              onClick={this.handleReload}
              variant={canRetry ? "outline" : "default"}
              className="w-full"
              aria-label="Odśwież stronę"
            >
              Odśwież stronę
            </Button>
          </div>

          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Szczegóły błędu (dla deweloperów)
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
              {error?.stack || "Brak dodatkowych informacji"}
            </div>
          </details>
        </Card>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderFallbackUI();
    }

    return this.props.children;
  }
}

/**
 * Higher-order component that wraps components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: unknown) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
