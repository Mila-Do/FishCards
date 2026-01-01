import React from "react";
import { Textarea } from "../ui/textarea";
import { useTextValidation } from "./hooks/useTextValidation";
import CharacterCounter from "./CharacterCounter";
import GenerateButton from "./GenerateButton";
import type { TextInputProps } from "./types";
import { VALIDATION_LIMITS } from "./types";

/**
 * Section containing text input field with character counter and generate button
 */
const TextInputSection: React.FC<TextInputProps> = ({ value, onChange, onGenerate, isLoading, errors }) => {
  const validation = useTextValidation(value);

  const handleGenerate = () => {
    if (!validation.isValid || isLoading) return;
    onGenerate();
  };

  // Combine validation errors with prop errors
  const allErrors = [...validation.errors, ...errors];
  const hasErrors = allErrors.length > 0;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Tekst ĹşrĂłdĹ‚owy</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Wklej lub wpisz tekst, z ktĂłrego AI wygeneruje propozycje fiszek
        </p>
      </div>

      {/* Text Input */}
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Wklej tutaj tekst do nauki... (minimum 1000 znakĂłw)"
            className={`min-h-[200px] resize-y transition-colors ${
              hasErrors
                ? "border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
                : validation.isValid && value.length > 0
                  ? "border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500"
                  : ""
            }`}
            disabled={isLoading}
            maxLength={VALIDATION_LIMITS.SOURCE_TEXT_MAX}
          />

          {/* Loading overlay for textarea */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-md flex items-center justify-center">
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm font-medium">Generowanie propozycji...</span>
              </div>
            </div>
          )}
        </div>

        {/* Character Counter */}
        <CharacterCounter
          count={validation.characterCount}
          min={VALIDATION_LIMITS.SOURCE_TEXT_MIN}
          max={VALIDATION_LIMITS.SOURCE_TEXT_MAX}
          isValid={validation.isValid}
        />

        {/* Error Messages */}
        {hasErrors && (
          <div className="space-y-1">
            {allErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center sm:justify-end pt-2">
          <GenerateButton
            onClick={handleGenerate}
            isDisabled={!validation.isValid || value.trim().length === 0}
            isLoading={isLoading}
          />
        </div>

        {/* Help Text */}
        {!hasErrors && value.length === 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">WskazĂłwki dotyczÄ…ce tekstu ĹşrĂłdĹ‚owego:</p>
                <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                  <li>â€˘ UĹĽyj tekstu z materiaĹ‚Ăłw edukacyjnych, artykuĹ‚Ăłw lub notatek</li>
                  <li>â€˘ Im bardziej uporzÄ…dkowany tekst, tym lepsze propozycje fiszek</li>
                  <li>â€˘ AI najlepiej radzi sobie z definicjami, faktami i pojÄ™ciami</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInputSection;
