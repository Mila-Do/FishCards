import React from "react";
import { Button } from "../ui/button";
import type { GenerateButtonProps } from "./types";

/**
 * Button that triggers AI proposal generation process
 */
const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isDisabled, isLoading }) => {
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled || isLoading}
      size="lg"
      className="w-full sm:w-auto min-w-[180px] font-semibold"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
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
          Generowanie...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generuj fiszki
        </>
      )}
    </Button>
  );
};

export default GenerateButton;
