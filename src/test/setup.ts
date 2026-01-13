import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi, expect } from "vitest";

// Extend global type to include vi
declare global {
  interface GlobalThis {
    vi: typeof import("vitest").vi;
  }
}

// Make vi globally available
Object.assign(globalThis, { vi });

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

// ============================================================================
// Custom Matchers for API Testing
// ============================================================================

import type { ApiResult } from "@/lib/types/common";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
interface CustomMatchers<T = unknown> {
  toBeApiSuccess(expectedData?: T): void;
  toBeApiError(expectedError?: string): void;
  toHaveRetryCount(expectedCount: number): void;
}

// Custom matchers for API results
expect.extend({
  /**
   * Custom matcher for API success results
   */
  toBeApiSuccess(received: ApiResult<unknown>, expectedData?: unknown) {
    const { isNot } = this;

    const pass = received.success === true && (expectedData === undefined || this.equals(received.data, expectedData));

    return {
      pass,
      message: () => {
        const notText = isNot ? "not " : "";
        return `Expected API result to ${notText}be successful${
          expectedData !== undefined ? ` with data: ${this.utils.printExpected(expectedData)}` : ""
        }\nReceived: ${this.utils.printReceived(received)}`;
      },
    };
  },

  /**
   * Custom matcher for API error results
   */
  toBeApiError(received: ApiResult<unknown>, expectedError?: string) {
    const { isNot } = this;

    const pass = received.success === false && (expectedError === undefined || received.error === expectedError);

    return {
      pass,
      message: () => {
        const notText = isNot ? "not " : "";
        return `Expected API result to ${notText}be an error${
          expectedError !== undefined ? ` with message: "${expectedError}"` : ""
        }\nReceived: ${this.utils.printReceived(received)}`;
      },
    };
  },

  /**
   * Custom matcher for checking retry attempts on mock functions
   */
  toHaveRetryCount(received: unknown, expectedCount: number) {
    const { isNot } = this;

    // Check if received is a mock function
    if (!vi.isMockFunction(received)) {
      return {
        pass: false,
        message: () => `Expected ${this.utils.printReceived(received)} to be a mock function`,
      };
    }

    const actualCount = received.mock.calls.length;
    const pass = isNot ? actualCount !== expectedCount : actualCount === expectedCount;

    return {
      pass,
      message: () => {
        const notText = isNot ? "not " : "";
        return `Expected mock function to ${notText}have been called ${expectedCount} time(s), but was called ${actualCount} time(s)`;
      },
    };
  },
});

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
