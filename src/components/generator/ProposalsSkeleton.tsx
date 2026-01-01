import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProposalsSkeletonProps } from "./types";

/**
 * Skeleton UI for loading state during AI flashcard generation
 * Displays animated skeleton cards that mimic the structure of ProposalCard
 */
const ProposalsSkeleton: React.FC<ProposalsSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {/* Section header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Skeleton cards */}
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardContent className="space-y-4">
            {/* Source indicator skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>

            {/* Front side skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Label */}
              <div className="space-y-2">
                <Skeleton className="h-20 w-full rounded-md" /> {/* Text area */}
                <div className="flex justify-between">
                  <div className="space-y-1">{/* Potential error message space */}</div>
                  <Skeleton className="h-3 w-12" /> {/* Character count */}
                </div>
              </div>
            </div>

            {/* Back side skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" /> {/* Label */}
              <div className="space-y-2">
                <Skeleton className="h-24 w-full rounded-md" /> {/* Text area */}
                <div className="flex justify-between">
                  <div className="space-y-1">{/* Potential error message space */}</div>
                  <Skeleton className="h-3 w-12" /> {/* Character count */}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            {/* Action buttons skeleton */}
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20 rounded-md" /> {/* Akceptuj button */}
              <Skeleton className="h-8 w-16 rounded-md" /> {/* Edytuj button */}
              <Skeleton className="h-8 w-16 rounded-md" /> {/* Odrzuć button */}
            </div>

            {/* Status space - sometimes shows status */}
            <Skeleton className="h-4 w-24" />
          </CardFooter>
        </Card>
      ))}

      {/* Save button skeleton - shown as placeholder */}
      <div className="flex justify-center pt-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      {/* Loading message */}
      <div className="text-center py-2">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
          <span>Generuję propozycje fiszek...</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">To może potrwać 2-10 sekund</p>
      </div>
    </div>
  );
};

export default ProposalsSkeleton;
