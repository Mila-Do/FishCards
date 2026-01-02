import { z } from "zod";

/**
 * Base validation schemas for common types
 */
export const BaseSchemas = {
  id: z.string().min(1, "ID jest wymagane"),
  uuid: z.string().uuid("Nieprawidłowy format UUID"),
  email: z.string().email("Nieprawidłowy format adresu email"),
  url: z.string().url("Nieprawidłowy format URL"),
  positiveInt: z.number().int().positive("Wartość musi być dodatnią liczbą całkowitą"),
  nonEmptyString: z.string().min(1, "Pole nie może być puste"),
};

/**
 * Flashcard validation schemas
 */
export const FlashcardSchemas: Record<string, z.ZodTypeAny> = {
  // Flashcard status enum
  status: z.enum(["active", "archived", "draft"], {
    errorMap: () => ({ message: "Status musi być jednym z: active, archived, draft" }),
  }),

  // Flashcard source enum
  source: z.enum(["ai", "manual"], {
    errorMap: () => ({ message: "Źródło musi być jednym z: ai, manual" }),
  }),

  // Individual flashcard item
  flashcard: z.object({
    id: BaseSchemas.uuid.optional(),
    question: z.string().min(1, "Pytanie jest wymagane").max(1000, "Pytanie nie może przekraczać 1000 znaków"),
    answer: z.string().min(1, "Odpowiedź jest wymagana").max(2000, "Odpowiedź nie może przekraczać 2000 znaków"),
    source: z.lazy((): z.ZodEnum<["ai", "manual"]> => FlashcardSchemas.source as z.ZodEnum<["ai", "manual"]>),
    status: z.lazy(
      (): z.ZodEnum<["active", "archived", "draft"]> =>
        FlashcardSchemas.status as z.ZodEnum<["active", "archived", "draft"]>
    ),
    tags: z.array(z.string()).optional().default([]),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional(),
  }),

  // Create flashcard request
  createFlashcard: z.object({
    question: z.string().min(1, "Pytanie jest wymagane").max(1000, "Pytanie nie może przekraczać 1000 znaków"),
    answer: z.string().min(1, "Odpowiedź jest wymagana").max(2000, "Odpowiedź nie może przekraczać 2000 znaków"),
    source: z.lazy((): z.ZodEnum<["ai", "manual"]> => FlashcardSchemas.source as z.ZodEnum<["ai", "manual"]>),
    status: z
      .lazy(
        (): z.ZodEnum<["active", "archived", "draft"]> =>
          FlashcardSchemas.status as z.ZodEnum<["active", "archived", "draft"]>
      )
      .optional()
      .default("draft"),
    tags: z.array(z.string()).optional().default([]),
  }),

  // Update flashcard request
  updateFlashcard: z.object({
    question: z
      .string()
      .min(1, "Pytanie jest wymagane")
      .max(1000, "Pytanie nie może przekraczać 1000 znaków")
      .optional(),
    answer: z
      .string()
      .min(1, "Odpowiedź jest wymagana")
      .max(2000, "Odpowiedź nie może przekraczać 2000 znaków")
      .optional(),
    source: z
      .lazy((): z.ZodEnum<["ai", "manual"]> => FlashcardSchemas.source as z.ZodEnum<["ai", "manual"]>)
      .optional(),
    status: z
      .lazy(
        (): z.ZodEnum<["active", "archived", "draft"]> =>
          FlashcardSchemas.status as z.ZodEnum<["active", "archived", "draft"]>
      )
      .optional(),
    tags: z.array(z.string()).optional(),
  }),

  // Flashcard filters
  filters: z.object({
    status: z
      .lazy(
        (): z.ZodEnum<["active", "archived", "draft"]> =>
          FlashcardSchemas.status as z.ZodEnum<["active", "archived", "draft"]>
      )
      .optional(),
    source: z
      .lazy((): z.ZodEnum<["ai", "manual"]> => FlashcardSchemas.source as z.ZodEnum<["ai", "manual"]>)
      .optional(),
    search: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),

  // Pagination
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
  }),

  // Sort options
  sort: z.object({
    field: z.enum(["created_at", "updated_at", "question", "answer"]).default("created_at"),
    order: z.enum(["asc", "desc"]).default("desc"),
  }),
};

/**
 * Generation validation schemas
 */
export const GenerationSchemas: Record<string, z.ZodTypeAny> = {
  // Text input for generation
  sourceText: z
    .string()
    .min(100, "Tekst musi mieć co najmniej 100 znaków")
    .max(10000, "Tekst nie może przekraczać 10000 znaków")
    .refine((text) => text.trim().split(/\s+/).length >= 20, { message: "Tekst musi zawierać co najmniej 20 słów" }),

  // Generation request
  generateRequest: z.object({
    source_text: z.lazy((): z.ZodString => GenerationSchemas.sourceText as z.ZodString),
    max_proposals: z.number().int().positive().max(20).optional().default(10),
    difficulty_level: z.enum(["basic", "intermediate", "advanced"]).optional().default("intermediate"),
  }),

  // Single proposal
  proposal: z.object({
    question: z.string().min(1, "Pytanie jest wymagane"),
    answer: z.string().min(1, "Odpowiedź jest wymagana"),
    confidence: z.number().min(0).max(1).optional(),
    difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  }),

  // Generation response
  generateResponse: z.object({
    flashcards_proposals: z.array(z.lazy(() => GenerationSchemas.proposal as z.ZodType)),
    generation_id: BaseSchemas.uuid,
    source_text_length: z.number().int().nonnegative(),
    processing_time_ms: z.number().int().nonnegative(),
  }),

  // Proposal with UI state
  proposalWithState: z.object({
    id: BaseSchemas.nonEmptyString,
    question: z.string().min(1, "Pytanie jest wymagane"),
    answer: z.string().min(1, "Odpowiedź jest wymagana"),
    source: z.literal("ai"),
    isSelected: z.boolean().default(false),
    isEditing: z.boolean().default(false),
    isDirty: z.boolean().default(false),
    confidence: z.number().min(0).max(1).optional(),
    difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  }),
};

/**
 * API response schemas
 */
export const ApiSchemas = {
  // Generic success response
  successResponse: z.object({
    success: z.literal(true),
    data: z.unknown(),
    message: z.string().optional(),
  }),

  // Generic error response
  errorResponse: z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }),
  }),

  // Paginated response
  paginatedResponse: z.object({
    data: z.array(z.unknown()),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      total_pages: z.number().int().nonnegative(),
    }),
  }),

  // Health check response
  healthCheck: z.object({
    status: z.enum(["ok", "degraded", "error"]),
    timestamp: z.string().datetime(),
    services: z
      .record(
        z.object({
          status: z.enum(["ok", "error"]),
          message: z.string().optional(),
          latency_ms: z.number().nonnegative().optional(),
        })
      )
      .optional(),
  }),
};

/**
 * UI component prop validation schemas
 */
export const ComponentSchemas = {
  // Button props
  buttonProps: z.object({
    variant: z.enum(["default", "destructive", "outline", "secondary", "ghost", "link"]).optional(),
    size: z.enum(["default", "sm", "lg", "icon"]).optional(),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional(),
    children: z.unknown(),
  }),

  // Modal props
  modalProps: z.object({
    isOpen: z.boolean(),
    onClose: z.function(),
    title: z.string().optional(),
    description: z.string().optional(),
    size: z.enum(["sm", "md", "lg", "xl", "full"]).optional(),
  }),

  // Form field props
  formFieldProps: z.object({
    name: z.string(),
    label: z.string().optional(),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    error: z.string().optional(),
    helpText: z.string().optional(),
  }),

  // Loading state
  loadingState: z.object({
    isLoading: z.boolean(),
    loadingMessage: z.string().optional(),
    progress: z.number().min(0).max(100).optional(),
  }),

  // Error state
  errorState: z.object({
    hasError: z.boolean(),
    error: z.string().nullable(),
    canRetry: z.boolean().optional(),
    retryCount: z.number().int().nonnegative().optional(),
  }),
};

/**
 * Form validation schemas
 */
export const FormSchemas = {
  // Contact form
  contactForm: z.object({
    name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki"),
    email: BaseSchemas.email,
    message: z.string().min(10, "Wiadomość musi mieć co najmniej 10 znaków"),
  }),

  // Settings form
  settingsForm: z.object({
    notifications: z.boolean().default(true),
    darkMode: z.boolean().default(false),
    language: z.enum(["pl", "en"]).default("pl"),
    autoSave: z.boolean().default(true),
  }),

  // User profile form
  userProfileForm: z.object({
    displayName: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki").optional(),
    bio: z.string().max(500, "Bio nie może przekraczać 500 znaków").optional(),
    website: BaseSchemas.url.optional().or(z.literal("")),
    location: z.string().max(100, "Lokalizacja nie może przekraczać 100 znaków").optional(),
  }),
};

/**
 * Environment validation schemas
 */
export const EnvironmentSchemas = {
  // Environment variables
  envVars: z.object({
    // Database
    SUPABASE_URL: BaseSchemas.url,
    SUPABASE_ANON_KEY: BaseSchemas.nonEmptyString,
    SUPABASE_SERVICE_ROLE_KEY: BaseSchemas.nonEmptyString,

    // AI Service
    OPENROUTER_API_KEY: BaseSchemas.nonEmptyString.optional(),

    // Development
    PUBLIC_DEV_AUTH_TOKEN: BaseSchemas.nonEmptyString.optional(),

    // Feature flags
    ENABLE_MOCK_MODE: z.boolean().default(false),
    ENABLE_RATE_LIMITING: z.boolean().default(true),
  }),
};

/**
 * Utility functions for validation
 */
export const ValidationUtils = {
  /**
   * Safely parse and validate data with Zod schema
   */
  safeParse: <T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { success: true; data: T } | { success: false; errors: string[] } => {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    const errors = result.error.errors.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    });

    return { success: false, errors };
  },

  /**
   * Parse or throw error
   */
  parseOrThrow: <T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => {
          const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
          return `${path}${err.message}`;
        });
        throw new Error(`Validation failed${context ? ` for ${context}` : ""}: ${errorMessages.join(", ")}`);
      }
      throw error;
    }
  },

  /**
   * Create a validation middleware for API routes
   */
  createApiValidator: <T>(schema: z.ZodSchema<T>) => {
    return (data: unknown): T => {
      return ValidationUtils.parseOrThrow(schema, data, "API request");
    };
  },
};
