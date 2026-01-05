/**
 * AuthGuard - Client-side authentication guard
 * Checks localStorage token and redirects if not authenticated
 * Wraps protected components to ensure they only render for logged users
 */

import React, { useEffect, useState } from "react";
import { authService } from "../../lib/auth/auth-service";
import { Spinner } from "../ui/spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

export function AuthGuard({ children, fallbackUrl = "/auth/login" }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log("🔍 AuthGuard: Subscribing to auth state changes...");

    // Subscribe to auth state changes instead of manual check
    const unsubscribe = authService.onAuthStateChange((state) => {
      console.log("🔍 AuthGuard: Auth state changed:", {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        loading: state.loading,
      });

      if (!mounted) return;

      if (state.loading) {
        // Still initializing, keep loading
        setIsChecking(true);
        setIsAuthenticated(null);
        return;
      }

      setIsChecking(false);

      if (state.isAuthenticated && state.user) {
        console.log("✅ AuthGuard: User is authenticated");
        setIsAuthenticated(true);
      } else {
        console.log("❌ AuthGuard: User not authenticated, redirecting...");
        setIsAuthenticated(false);

        // Redirect to login
        const currentPath = window.location.pathname + window.location.search;
        const redirectParam = currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";
        window.location.href = `${fallbackUrl}${redirectParam}`;
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fallbackUrl]);

  // Show loading while checking authentication
  if (isChecking || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Sprawdzanie uwierzytelnienia...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect is happening)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Przekierowywanie...</p>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}
