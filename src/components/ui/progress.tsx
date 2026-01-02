import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Progress bar component props
 */
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  indeterminate?: boolean;
}

/**
 * Progress bar component for showing completion status
 */
const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = "md",
      variant = "default",
      showLabel = false,
      label,
      animated = false,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeStyles = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    };

    const variantStyles = {
      default: "bg-primary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
    };

    return (
      <div className="w-full space-y-2">
        {(showLabel || label) && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">{label || "Postęp"}</span>
            {showLabel && !indeterminate && (
              <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
            )}
          </div>
        )}

        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={indeterminate ? undefined : value}
          aria-label={label || "Pasek postępu"}
          className={cn("relative w-full overflow-hidden rounded-full bg-secondary", sizeStyles[size], className)}
          {...props}
        >
          <div
            className={cn("h-full transition-all duration-500 ease-out", variantStyles[variant], {
              "animate-pulse": animated && !indeterminate,
              "bg-gradient-to-r from-primary/50 via-primary to-primary/50 bg-[length:200%_100%] animate-shimmer":
                indeterminate,
            })}
            style={{
              width: indeterminate ? "100%" : `${percentage}%`,
              animation: indeterminate ? "shimmer 2s infinite" : undefined,
            }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

/**
 * Circular progress component
 */
export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string;
  strokeWidth?: number;
  indeterminate?: boolean;
}

const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = "md",
      variant = "default",
      showLabel = false,
      label,
      strokeWidth,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeConfig = {
      sm: { width: 32, height: 32, strokeWidth: strokeWidth || 2 },
      md: { width: 48, height: 48, strokeWidth: strokeWidth || 3 },
      lg: { width: 64, height: 64, strokeWidth: strokeWidth || 4 },
      xl: { width: 80, height: 80, strokeWidth: strokeWidth || 5 },
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const variantColors = {
      default: "stroke-primary",
      success: "stroke-green-500",
      warning: "stroke-yellow-500",
      error: "stroke-red-500",
    };

    return (
      <div ref={ref} className={cn("relative inline-flex items-center justify-center", className)} {...props}>
        <svg
          width={config.width}
          height={config.height}
          className="transform -rotate-90"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={indeterminate ? undefined : value}
          aria-label={label || "Okrągły pasek postępu"}
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            className="text-secondary"
          />

          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeLinecap="round"
            className={cn("transition-all duration-500 ease-out", variantColors[variant], {
              "animate-spin": indeterminate,
            })}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: indeterminate ? circumference * 0.25 : offset,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {showLabel && !indeterminate && (
            <span className="text-xs font-medium text-foreground">{Math.round(percentage)}%</span>
          )}
          {label && indeterminate && <span className="text-xs font-medium text-foreground">{label}</span>}
        </div>
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

/**
 * Step progress component for multi-step processes
 */
export interface StepProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: {
    id: string;
    label: string;
    description?: string;
    status: "pending" | "current" | "completed" | "error";
  }[];
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
}

const StepProgress = forwardRef<HTMLDivElement, StepProgressProps>(
  ({ className, steps, orientation = "horizontal", size = "md", ...props }, ref) => {
    const sizeConfig = {
      sm: {
        stepSize: "w-6 h-6",
        fontSize: "text-xs",
        gap: orientation === "horizontal" ? "gap-2" : "gap-1",
      },
      md: {
        stepSize: "w-8 h-8",
        fontSize: "text-sm",
        gap: orientation === "horizontal" ? "gap-3" : "gap-2",
      },
      lg: {
        stepSize: "w-10 h-10",
        fontSize: "text-base",
        gap: orientation === "horizontal" ? "gap-4" : "gap-3",
      },
    };

    const config = sizeConfig[size];

    const getStepIcon = (step: StepProgressProps["steps"][0], index: number) => {
      switch (step.status) {
        case "completed":
          return (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );
        case "error":
          return (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          );
        case "current":
          return <div className="w-2 h-2 bg-white rounded-full animate-pulse" />;
        default:
          return <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>;
      }
    };

    const getStepStyles = (status: StepProgressProps["steps"][0]["status"]) => {
      switch (status) {
        case "completed":
          return "bg-green-500 text-white";
        case "error":
          return "bg-red-500 text-white";
        case "current":
          return "bg-primary text-primary-foreground border-2 border-primary";
        default:
          return "bg-secondary text-muted-foreground border border-border";
      }
    };

    const getConnectorStyles = (
      currentStatus: StepProgressProps["steps"][0]["status"],
      nextStatus: StepProgressProps["steps"][0]["status"]
    ) => {
      if (currentStatus === "completed") {
        return "bg-green-500";
      }
      return "bg-secondary";
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? `items-center ${config.gap}` : `flex-col ${config.gap}`,
          className
        )}
        role="progressbar"
        aria-label="Postęp kroków"
        {...props}
      >
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={cn("flex items-center", orientation === "horizontal" ? "flex-col" : "flex-row", config.gap)}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full flex-shrink-0",
                  config.stepSize,
                  getStepStyles(step.status)
                )}
                aria-label={`Krok ${index + 1}: ${step.label}`}
              >
                {getStepIcon(step, index)}
              </div>

              {/* Step content */}
              <div className={cn(orientation === "horizontal" ? "text-center" : "flex-1 min-w-0")}>
                <div className={cn("font-medium", config.fontSize)}>{step.label}</div>
                {step.description && (
                  <div className={cn("text-muted-foreground", config.fontSize)}>{step.description}</div>
                )}
              </div>
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  orientation === "horizontal" ? "h-px flex-1" : "w-px h-8 ml-4",
                  getConnectorStyles(step.status, steps[index + 1]?.status)
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

StepProgress.displayName = "StepProgress";

export { Progress, CircularProgress, StepProgress };
