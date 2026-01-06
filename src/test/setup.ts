import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";

// Extend global type to include vi
declare global {
  interface GlobalThis {
    vi: typeof import("vitest").vi;
  }
}

// Make vi globally available
globalThis.vi = vi;

// DOM environment should be available via vitest jsdom environment
// If not available, tests will show appropriate errors

// MSW setup
import { server } from "./__mocks__/server";

// Start worker before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test `important for test isolation`
afterEach(() => {
  server.resetHandlers();
  // Cleanup DOM after each test
  cleanup();
});

// Clean up after all tests
afterAll(() => server.close());

/* eslint-disable @typescript-eslint/no-empty-function */
// Global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia for tests that use it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: readonly number[] = [0];

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as typeof IntersectionObserver;
