/**
 * AuthButton - Authentication button component
 * Displays login button for guests or user dropdown for authenticated users
 */

import React, { useState } from "react";
import { Button } from "../ui/button";

interface AuthButtonProps {
  isAuthenticated: boolean;
  userEmail?: string;
  onLogout: () => Promise<void>;
  onDeleteAccount?: () => void;
}

export function AuthButton({ isAuthenticated, userEmail = "", onLogout, onDeleteAccount }: AuthButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();
    } catch {
      // Silently handle logout error
    } finally {
      setIsLoggingOut(false);
      setIsDropdownOpen(false);
    }
  };

  const handleDeleteAccount = () => {
    setIsDropdownOpen(false);
    onDeleteAccount?.();
  };

  // Guest user - show login button
  if (!isAuthenticated) {
    return (
      <Button asChild size="sm" className="h-9">
        <a href="/auth/login">Zaloguj się</a>
      </Button>
    );
  }

  // Authenticated user - show dropdown menu
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-3"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="menu"
        aria-label="Menu użytkownika"
      >
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-medium">{userEmail.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-sm font-medium max-w-[120px] truncate">{userEmail}</span>
          <svg
            className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </Button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} aria-hidden="true" />

          {/* Menu */}
          <div
            className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-20"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1">
              {/* User Info */}
              <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
                <div className="font-medium text-foreground mb-1">Zalogowany jako</div>
                <div className="truncate">{userEmail}</div>
              </div>

              {/* Menu Items */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
                role="menuitem"
              >
                {isLoggingOut ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Wylogowywanie...
                  </span>
                ) : (
                  "Wyloguj się"
                )}
              </button>

              <button
                onClick={handleDeleteAccount}
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground focus:outline-none"
                role="menuitem"
              >
                Usuń konto
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
