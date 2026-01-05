/**
 * React hook for authentication state management
 * Provides unified auth state across all components
 */

import { useState, useEffect, useCallback } from "react";
import { authService } from "../auth/auth-service";
import type { User } from "@supabase/supabase-js";
import type { AuthState, LoginCredentials, RegisterCredentials, AuthResult } from "../auth/auth-service";

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (credentials: RegisterCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  refreshAuth: () => Promise<void>;
}

/**
 * Hook for managing authentication state
 */
export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const result = await authService.login(credentials);
      return result;
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Register function
  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResult> => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const result = await authService.register(credentials);
      return result;
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      await authService.logout();
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    return await authService.resetPassword(email);
  }, []);

  // Update password function
  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    return await authService.updatePassword(newPassword);
  }, []);

  // Refresh auth state
  const refreshAuth = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const isAuthenticated = await authService.isAuthenticated();
      const user = authService.getCurrentUser();

      setAuthState({
        isAuthenticated,
        user,
        loading: false,
      });
    } catch (error) {
      console.error("Error refreshing auth:", error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    refreshAuth,
  };
}

/**
 * Hook for getting current user (simpler version)
 */
export function useUser(): { user: User | null; isAuthenticated: boolean; loading: boolean } {
  const { user, isAuthenticated, loading } = useAuth();
  return { user, isAuthenticated, loading };
}

/**
 * Hook that throws if user is not authenticated
 * Useful for components that require authentication
 */
export function useRequireAuth(): { user: User; isAuthenticated: true } {
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = "/auth/login";
    }
  }, [isAuthenticated, loading]);

  if (!isAuthenticated || !user) {
    throw new Error("Authentication required");
  }

  return { user, isAuthenticated: true };
}
