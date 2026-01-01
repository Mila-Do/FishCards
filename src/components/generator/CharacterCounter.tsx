import React from "react";
import type { CharacterCounterProps } from "./types";

/**
 * Visual indicator for character count with validation status coloring
 */
const CharacterCounter: React.FC<CharacterCounterProps> = ({ count, min, max, isValid }) => {
  // Determine status and styling
  const getStatusInfo = () => {
    if (count === 0) {
      return {
        color: "text-gray-500 dark:text-gray-400",
        icon: null,
        message: "Wprowadź tekst",
      };
    }

    if (isValid) {
      return {
        color: "text-green-600 dark:text-green-400",
        icon: (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
        message: "Poprawna długość",
      };
    }

    return {
      color: "text-red-600 dark:text-red-400",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
      message: count < min ? "Za mało znaków" : "Za dużo znaków",
    };
  };

  const status = getStatusInfo();

  // Calculate progress percentage
  const progress = Math.min((count / max) * 100, 100);
  const isNearLimit = progress > 90;

  return (
    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-xs sm:text-sm">
      <div className={`flex items-center space-x-2 ${status.color}`}>
        {status.icon}
        <span className="font-medium">{status.message}</span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Progress bar for visual feedback */}
        <div className="w-12 sm:w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-200 ${
              isValid ? "bg-green-500" : isNearLimit ? "bg-red-500" : "bg-yellow-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Character count */}
        <span className={`font-mono tabular-nums ${status.color}`}>
          {count.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default CharacterCounter;
