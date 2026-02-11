/**
 * StatCard - Individual statistics card component
 * Displays a single statistic with title, value, optional subtitle and icon
 */

import React, { memo } from "react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";
import type { StatCardProps } from "../../types";

export const StatCard = memo<StatCardProps>(function StatCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  onClick,
  className,
}) {
  // Format large numbers (e.g., 1000+ -> 1K+)
  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;
    if (val >= 1000) {
      return `${Math.floor(val / 1000)}K+`;
    }
    return val.toString();
  };

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && !loading && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  const isClickable = !!onClick && !loading;

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isClickable && [
          "cursor-pointer",
          "hover:shadow-md hover:scale-[1.02]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ],
        loading && "opacity-60",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      aria-label={isClickable ? `Zobacz szczegóły dla ${title}` : undefined}
    >
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton height="1rem" width="60%" />
              {icon && <Skeleton circle width={20} height={20} />}
            </div>
            <Skeleton height="2rem" width="40%" />
            <Skeleton height="0.75rem" width="50%" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header with title and optional icon */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              {icon && (
                <div className="text-muted-foreground/70" aria-hidden="true">
                  {icon}
                </div>
              )}
            </div>

            {/* Main value */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{formatValue(value)}</span>
              {typeof value === "number" && value >= 1000 && (
                <span className="text-xs text-muted-foreground">({value.toLocaleString()})</span>
              )}
            </div>

            {/* Optional subtitle */}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";
