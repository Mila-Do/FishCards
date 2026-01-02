import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { SkeletonProps } from "@/lib/types/components";

/**
 * Basic skeleton component for loading placeholders
 */
const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, count = 1, circle = false, animation = "pulse", ...props }, ref) => {
    const animationClasses = {
      pulse: "animate-pulse",
      wave: "animate-shimmer bg-gradient-to-r from-accent via-accent-foreground/10 to-accent bg-[length:200%_100%]",
      none: "",
    };

    if (count === 1) {
      return (
        <div
          ref={ref}
          data-slot="skeleton"
          className={cn("bg-accent", animationClasses[animation], circle ? "rounded-full" : "rounded-md", className)}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
          }}
          {...props}
        />
      );
    }

    return (
      <div className="space-y-2" ref={ref}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            data-slot="skeleton"
            className={cn("bg-accent", animationClasses[animation], circle ? "rounded-full" : "rounded-md", className)}
            style={{
              width: typeof width === "number" ? `${width}px` : width,
              height: typeof height === "number" ? `${height}px` : height,
            }}
            {...props}
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";

/**
 * Pre-built skeleton for text content
 */
export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 3, className, lastLineWidth = "75%" }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height="1rem" width={index === lines - 1 ? lastLineWidth : "100%"} />
      ))}
    </div>
  );
};

/**
 * Pre-built skeleton for card content
 */
export const CardSkeleton: React.FC<{
  showHeader?: boolean;
  showFooter?: boolean;
  textLines?: number;
  className?: string;
}> = ({ showHeader = true, showFooter = false, textLines = 3, className }) => {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      {showHeader && (
        <div className="flex items-center space-x-4">
          <Skeleton circle width={40} height={40} />
          <div className="space-y-2 flex-1">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="0.75rem" width="40%" />
          </div>
        </div>
      )}

      <TextSkeleton lines={textLines} />

      {showFooter && (
        <div className="flex justify-between items-center pt-2">
          <Skeleton height="2rem" width="5rem" />
          <Skeleton height="2rem" width="4rem" />
        </div>
      )}
    </div>
  );
};

/**
 * Pre-built skeleton for table rows
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Table header */}
      <div className="flex space-x-4 p-2 bg-muted/50 rounded">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} height="1rem" width="100%" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4 p-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1rem" width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Pre-built skeleton for list items
 */
export const ListSkeleton: React.FC<{
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}> = ({ items = 5, showAvatar = true, showActions = false, className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-2">
          {showAvatar && <Skeleton circle width={32} height={32} />}

          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="0.75rem" width="50%" />
          </div>

          {showActions && (
            <div className="flex space-x-2">
              <Skeleton width={24} height={24} />
              <Skeleton width={24} height={24} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Pre-built skeleton for forms
 */
export const FormSkeleton: React.FC<{
  fields?: number;
  showButtons?: boolean;
  className?: string;
}> = ({ fields = 4, showButtons = true, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height="1rem" width="25%" />
          <Skeleton height="2.5rem" width="100%" />
        </div>
      ))}

      {showButtons && (
        <div className="flex space-x-2 pt-4">
          <Skeleton height="2.5rem" width="6rem" />
          <Skeleton height="2.5rem" width="4rem" />
        </div>
      )}
    </div>
  );
};

export { Skeleton };
