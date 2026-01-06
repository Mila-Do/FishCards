/**
 * Client-side HeaderComponent
 * Replaces server-side header in Layout.astro with React component
 * Uses authService.onAuthStateChange for real-time auth state
 */

import React, { useState, useEffect } from "react";
import { authService } from "../lib/auth/auth-service";
import type { AuthState } from "../lib/auth/auth-service";

interface HeaderComponentProps {
  currentPath?: string;
}

export function HeaderComponent({ currentPath = "/" }: HeaderComponentProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    console.log("🔍 HeaderComponent: Subscribing to auth state changes...");

    const unsubscribe = authService.onAuthStateChange((state) => {
      console.log("🔍 HeaderComponent: Auth state updated:", {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        loading: state.loading,
      });
      setAuthState(state);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Redirect to home page after logout
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading skeleton while initializing
  if (authState.loading) {
    return <HeaderSkeleton />;
  }

  const { isAuthenticated, user } = authState;
  const userEmail = user?.email || "";

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo/Brand (left) */}
          <div className="flex items-center">
            <a href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">FC</span>
              </div>
              <span className="font-bold text-xl">FishCards</span>
            </a>
          </div>

          {/* Main Navigation (center) - only for authenticated users */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Nawigacja główna">
              <a
                href="/generator"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  currentPath === "/generator" ? "text-primary" : ""
                }`}
                aria-current={currentPath === "/generator" ? "page" : undefined}
              >
                Generator
              </a>
              <a
                href="/flashcards"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  currentPath === "/flashcards" ? "text-primary" : ""
                }`}
                aria-current={currentPath === "/flashcards" ? "page" : undefined}
              >
                Moje Fiszki
              </a>
              <a
                href="/learning"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  currentPath === "/learning" ? "text-primary" : ""
                }`}
                aria-current={currentPath === "/learning" ? "page" : undefined}
              >
                Sesja Nauki
              </a>
            </nav>
          )}

          {/* Auth Section (right) */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-medium">
                      {userEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{userEmail}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1"
                >
                  Wyloguj
                </button>
              </div>
            ) : (
              <a
                href="/auth/login"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                Zaloguj się
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * HeaderSkeleton - Loading state during auth initialization
 * Prevents FOUC and provides smooth transition
 */
function HeaderSkeleton() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo/Brand (left) - Static */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">FC</span>
              </div>
              <span className="font-bold text-xl">FishCards</span>
            </div>
          </div>

          {/* Navigation placeholder */}
          <nav className="hidden md:flex items-center space-x-6">
            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
          </nav>

          {/* Auth Section placeholder */}
          <div className="flex items-center">
            <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
