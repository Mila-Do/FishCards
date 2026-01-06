/**
 * Mock data generators for testing
 * Provides reusable factory functions for creating test data
 */

import type { CreateFlashcardCommand, UpdateFlashcardCommand, FlashcardStatus, FlashcardSource } from "../../types";
import type { ApiResult } from "../../lib/types/common";

// ============================================================================
// Flashcard Data Generators
// ============================================================================

/**
 * Creates a mock flashcard with default values and optional overrides
 */
export const createMockFlashcard = (
  overrides: Partial<{
    id: number;
    front: string;
    back: string;
    status: FlashcardStatus;
    source: FlashcardSource;
    repetition_count: number;
    created_at: string;
    updated_at: string;
    user_id: string;
    generation_id: number | null;
  }> = {}
) => ({
  id: 1,
  front: "What is the capital of Poland?",
  back: "Warsaw",
  status: "new" as FlashcardStatus,
  source: "manual" as FlashcardSource,
  repetition_count: 0,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  user_id: "user-123",
  generation_id: null,
  ...overrides,
});

/**
 * Creates a mock CreateFlashcardCommand
 */
export const createMockCreateFlashcardCommand = (
  overrides: Partial<CreateFlashcardCommand> = {}
): CreateFlashcardCommand => ({
  front: "Test question?",
  back: "Test answer",
  source: "manual",
  generation_id: null,
  ...overrides,
});

/**
 * Creates a mock UpdateFlashcardCommand
 */
export const createMockUpdateFlashcardCommand = (
  overrides: Partial<UpdateFlashcardCommand> = {}
): UpdateFlashcardCommand => ({
  front: "Updated question?",
  back: "Updated answer",
  status: "learning",
  repetition_count: 1,
  ...overrides,
});

/**
 * Creates multiple flashcards for testing collections
 */
export const createMockFlashcardCollection = (
  count: number,
  baseOverrides: Partial<Parameters<typeof createMockFlashcard>[0]> = {}
) => {
  return Array.from({ length: count }, (_, index) =>
    createMockFlashcard({
      id: index + 1,
      front: `Question ${index + 1}`,
      back: `Answer ${index + 1}`,
      created_at: new Date(Date.now() - (count - index) * 60000).toISOString(), // Staggered timestamps
      ...baseOverrides,
    })
  );
};

// ============================================================================
// API Response Generators
// ============================================================================

/**
 * Creates a successful API response
 */
export const createMockApiResponse = <T>(data: T): ApiResult<T> => ({
  success: true as const,
  data,
});

/**
 * Creates a failed API response
 */
export const createMockApiError = <T>(error: string, details?: Record<string, unknown>): ApiResult<T> => ({
  success: false,
  error,
  ...(details && { details }),
});

/**
 * Creates a paginated API response
 */
export const createMockPaginatedResponse = <T>(
  data: T[],
  pagination: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  } = {}
) => ({
  data,
  pagination: {
    total: data.length,
    page: 1,
    limit: 10,
    hasNext: false,
    hasPrev: false,
    ...pagination,
  },
  meta: {
    totalPages: Math.ceil((pagination.total || data.length) / (pagination.limit || 10)),
  },
});

// ============================================================================
// User and Authentication Data
// ============================================================================

/**
 * Creates a mock user object
 */
export const createMockUser = (
  overrides: Partial<{
    id: string;
    email: string;
    name: string;
    created_at: string;
    last_sign_in_at: string;
  }> = {}
) => ({
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  created_at: "2024-01-01T00:00:00Z",
  last_sign_in_at: "2024-06-15T12:00:00Z",
  ...overrides,
});

/**
 * Creates mock authentication tokens
 */
export const createMockTokenData = (
  overrides: Partial<{
    access_token: string;
    refresh_token: string;
    expires_at: number;
    user: ReturnType<typeof createMockUser>;
  }> = {}
) => ({
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token",
  refresh_token: "refresh-token-123",
  expires_at: Date.now() + 3600000, // 1 hour from now
  user: createMockUser(),
  ...overrides,
});

// ============================================================================
// Generation Data
// ============================================================================

/**
 * Creates a mock generation record
 */
export const createMockGeneration = (
  overrides: Partial<{
    id: string;
    user_id: string;
    source_text: string;
    generated_count: number;
    accepted_unedited_count: number;
    accepted_edited_count: number;
    rejected_count: number;
    generation_duration_ms: number;
    created_at: string;
    updated_at: string;
  }> = {}
) => ({
  id: "gen-123",
  user_id: "user-123",
  source_text: "Sample text for flashcard generation...",
  generated_count: 5,
  accepted_unedited_count: 3,
  accepted_edited_count: 1,
  rejected_count: 1,
  generation_duration_ms: 15000,
  created_at: "2024-06-15T10:00:00Z",
  updated_at: "2024-06-15T10:01:00Z",
  ...overrides,
});

/**
 * Creates a mock flashcard proposal from AI generation
 */
export const createMockFlashcardProposal = (
  overrides: Partial<{
    id: string;
    front: string;
    back: string;
    confidence: number;
    status: "pending" | "accepted" | "rejected" | "edited";
    generation_id: string;
  }> = {}
) => ({
  id: "proposal-123",
  front: "Generated question?",
  back: "Generated answer",
  confidence: 0.85,
  status: "pending" as const,
  generation_id: "gen-123",
  ...overrides,
});

// ============================================================================
// Dashboard and Statistics Data
// ============================================================================

/**
 * Creates mock dashboard statistics
 */
export const createMockDashboardStats = (
  overrides: Partial<{
    flashcardsToReviewToday: number;
    totalFlashcards: number;
    aiAcceptanceRate: number;
    totalGenerations: number;
    lastActivityDate?: Date;
  }> = {}
) => ({
  flashcardsToReviewToday: 12,
  totalFlashcards: 150,
  aiAcceptanceRate: 75, // 75%
  totalGenerations: 25,
  lastActivityDate: new Date("2024-06-15T10:30:00Z"),
  ...overrides,
});

// ============================================================================
// Text and Validation Data
// ============================================================================

/**
 * Creates text of specified length for boundary testing
 */
export const createLongText = (length: number, pattern = "A"): string => {
  return pattern.repeat(Math.ceil(length / pattern.length)).substring(0, length);
};

/**
 * Creates validation test cases for boundary testing
 */
export const createValidationTestCases = () => [
  // Empty/required tests
  { input: "", expected: { isValid: false, errors: ["Required"] }, description: "empty string" },
  { input: "   ", expected: { isValid: false, errors: ["Required"] }, description: "whitespace only" },

  // Length boundary tests
  { input: "A", expected: { isValid: true, errors: [] }, description: "minimum valid length" },
  {
    input: createLongText(200),
    expected: { isValid: true, errors: [] },
    description: "maximum flashcard front length",
  },
  {
    input: createLongText(201),
    expected: { isValid: false, errors: ["Too long"] },
    description: "exceeds maximum front length",
  },
  { input: createLongText(500), expected: { isValid: true, errors: [] }, description: "maximum flashcard back length" },
  {
    input: createLongText(501),
    expected: { isValid: false, errors: ["Too long"] },
    description: "exceeds maximum back length",
  },

  // Source text boundary tests
  {
    input: createLongText(999),
    expected: { isValid: false, errors: ["Too short"] },
    description: "below minimum source text",
  },
  { input: createLongText(1000), expected: { isValid: true, errors: [] }, description: "minimum source text length" },
  { input: createLongText(10000), expected: { isValid: true, errors: [] }, description: "maximum source text length" },
  {
    input: createLongText(10001),
    expected: { isValid: false, errors: ["Too long"] },
    description: "exceeds maximum source text",
  },
];

/**
 * Creates test cases for special characters and international text
 */
export const createSpecialCharacterTestCases = () => [
  { input: "Kraków, Żółć!", description: "Polish diacritics" },
  { input: "Café & Résumé", description: "French accents" },
  { input: "测试 データ тест", description: "Unicode characters" },
  { input: "Hello 🌟 World ✨", description: "Emoji characters" },
  { input: "!@#$%^&*()_+-=[]{}|;':\",./<>?", description: "Special symbols" },
  { input: "Multi-line\ntext\twith\ttabs", description: "Whitespace characters" },
];

// ============================================================================
// Error and Edge Case Data
// ============================================================================

/**
 * Creates mock error objects for different scenarios
 */
export const createMockError = (type: "network" | "validation" | "auth" | "server" | "timeout", message?: string) => {
  const errorMap = {
    network: { message: "Network connection failed", code: "NETWORK_ERROR" },
    validation: { message: "Invalid input provided", code: "VALIDATION_ERROR" },
    auth: { message: "Authentication failed", code: "AUTH_ERROR" },
    server: { message: "Internal server error", code: "SERVER_ERROR" },
    timeout: { message: "Request timeout", code: "TIMEOUT_ERROR" },
  };

  const baseError = errorMap[type];

  return {
    ...baseError,
    message: message || baseError.message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates test cases for different HTTP status codes
 */
export const createHttpStatusTestCases = () => [
  { status: 200, description: "OK", isSuccess: true },
  { status: 201, description: "Created", isSuccess: true },
  { status: 204, description: "No Content", isSuccess: true },
  { status: 400, description: "Bad Request", isSuccess: false },
  { status: 401, description: "Unauthorized", isSuccess: false },
  { status: 403, description: "Forbidden", isSuccess: false },
  { status: 404, description: "Not Found", isSuccess: false },
  { status: 422, description: "Unprocessable Entity", isSuccess: false },
  { status: 429, description: "Too Many Requests", isSuccess: false },
  { status: 500, description: "Internal Server Error", isSuccess: false },
  { status: 502, description: "Bad Gateway", isSuccess: false },
  { status: 503, description: "Service Unavailable", isSuccess: false },
];

// ============================================================================
// Performance and Load Testing Data
// ============================================================================

/**
 * Creates large datasets for performance testing
 */
export const createLargeDataset = <T>(factory: (index: number) => T, size: number): T[] => {
  return Array.from({ length: size }, (_, index) => factory(index));
};

/**
 * Creates a large flashcard dataset for testing
 */
export const createLargeFlashcardDataset = (size: number) => {
  return createLargeDataset(
    (index) =>
      createMockFlashcard({
        id: index + 1,
        front: `Performance test question ${index + 1}`,
        back: `Performance test answer ${index + 1}`,
        status: (["new", "learning", "review", "mastered"] as FlashcardStatus[])[index % 4],
        created_at: new Date(Date.now() - (size - index) * 1000).toISOString(),
      }),
    size
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a deep copy of mock data to prevent mutation issues in tests
 */
export const cloneMockData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

/**
 * Merges multiple mock objects with proper type safety
 */
export const mergeMockData = <T extends Record<string, unknown>>(base: T, ...overrides: Partial<T>[]): T => {
  let result = base;
  for (const override of overrides) {
    result = { ...result, ...override } as T;
  }
  return result;
};

/**
 * Creates a random selection from an array for varied testing
 */
export const randomSample = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

/**
 * Generates a sequence of dates for temporal testing
 */
export const createDateSequence = (
  startDate: Date,
  count: number,
  intervalMs = 86400000 // 1 day
): Date[] => {
  return Array.from({ length: count }, (_, index) => new Date(startDate.getTime() + index * intervalMs));
};
