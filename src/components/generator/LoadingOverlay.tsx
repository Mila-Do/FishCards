import React from "react";
import type { LoadingOverlayProps } from "./types";

/**
 * Non-blocking loading indicator displayed during short API operations
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full">
        <div className="flex items-center space-x-4">
          {/* Spinner */}
          <div className="flex-shrink-0">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>

          {/* Message */}
          <div>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{message}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">To może potrwać chwilę...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
