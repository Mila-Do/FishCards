/**
 * Authentication and Route Protection Configuration
 *
 * This file defines which routes are protected, public, and auth-only.
 * Used by middleware and throughout the application for consistent auth behavior.
 */

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

/**
 * Routes that require user to be authenticated at MIDDLEWARE level
 * Note: /generator and /flashcards use client-side AuthGuard instead
 * Niezalogowani użytkownicy będą przekierowani do /auth/login
 */
export const PROTECTED_ROUTES = [
  "/learning", // Future implementation for spaced repetition
] as const;

/**
 * Routes that use client-side AuthGuard (not middleware protection)
 * These routes load normally but AuthGuard checks auth in React
 */
export const CLIENT_PROTECTED_ROUTES = ["/generator", "/flashcards"] as const;

/**
 * Routes accessible only to guests (not logged in users)
 * Zalogowani użytkownicy będą przekierowani do /generator
 */
export const GUEST_ONLY_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
] as const;

/**
 * API routes that are public (don't require authentication)
 * Wszystkie inne /api/* routes wymagają Bearer token auth
 */
export const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
] as const;

/**
 * Public routes accessible to everyone regardless of auth status
 * Głównie strona główna z wizualizacją fiszek dla niezalogowanych
 */
export const PUBLIC_ROUTES = [
  "/", // Landing page z graficzną wizualizacją fiszek
  "/demo", // Demo version mentioned in login.astro
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if route requires authentication at middleware level
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route uses client-side AuthGuard
 */
export function isClientProtectedRoute(pathname: string): boolean {
  return CLIENT_PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route is only for guests (unauthenticated users)
 */
export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if API route is public (doesn't require Bearer token)
 */
export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route);
}

/**
 * Check if route is public (accessible to everyone)
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
}

/**
 * Get redirect path for authenticated user
 */
export function getAuthenticatedRedirect(): string {
  return "/dashboard";
}

/**
 * Get redirect path for unauthenticated user
 * Includes current path as redirect parameter for post-login redirect
 */
export function getUnauthenticatedRedirect(currentPath: string): string {
  const redirectParam = currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";
  return `/auth/login${redirectParam}`;
}

// ============================================================================
// ACCESS RULES DOCUMENTATION
// ============================================================================

/**
 * ZASADY DOSTĘPU FISHCARDS:
 *
 * 1. NIEZALOGOWANI UŻYTKOWNICY:
 *    - Mają dostęp tylko do strony głównej (/) z graficzną wizualizacją fiszek
 *    - Mają dostęp do stron auth (/auth/*)
 *    - Mają dostęp do trybu demo (/demo)
 *    - Przekierowani z chronionych stron na /auth/login
 *
 * 2. ZALOGOWANI UŻYTKOWNICY:
 *    - Mają pełen dostęp do generowania fiszek (/generator)
 *    - Mają dostęp do zarządzania fiszkami (/flashcards)
 *    - Mają dostęp do sesji nauki (/learning)
 *    - Przekierowani ze stron auth na /dashboard
 *
 * 3. API ENDPOINTS:
 *    - /api/auth/* - publiczne (login, register, etc.)
 *    - Wszystkie inne /api/* - wymagają Bearer token auth
 *
 * 4. AUTOMATYCZNE TESTY:
 *    - Development tokens zachowane dla API endpoints
 *    - Tylko w trybie development dla bezpieczeństwa
 */
