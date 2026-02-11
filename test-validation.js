#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Test validation schemas for Flashcards API
 */

import {
  createFlashcardSchema,
  createFlashcardsSchema,
  updateFlashcardSchema,
  flashcardQuerySchema,
  flashcardIdSchema,
} from "./src/lib/validation/flashcard.ts";

console.log("đź§Ş Testing Flashcard Validation Schemas\n");

// Test data
const testCases = [
  {
    name: "Valid create flashcard",
    schema: createFlashcardSchema,
    data: {
      front: "What is React?",
      back: "A JavaScript library for building user interfaces",
      source: "manual",
    },
    shouldPass: true,
  },
  {
    name: "Create flashcard with generation_id",
    schema: createFlashcardSchema,
    data: {
      front: "What is TypeScript?",
      back: "A typed superset of JavaScript",
      source: "ai",
      generation_id: 123,
    },
    shouldPass: true,
  },
  {
    name: "Invalid create flashcard - empty front",
    schema: createFlashcardSchema,
    data: {
      front: "",
      back: "Some answer",
    },
    shouldPass: false,
  },
  {
    name: "Invalid create flashcard - front too long",
    schema: createFlashcardSchema,
    data: {
      front: "a".repeat(201),
      back: "Some answer",
    },
    shouldPass: false,
  },
  {
    name: "Valid update flashcard",
    schema: updateFlashcardSchema,
    data: {
      status: "learning",
      repetition_count: 5,
    },
    shouldPass: true,
  },
  {
    name: "Valid query params",
    schema: flashcardQuerySchema,
    data: {
      page: 2,
      limit: 50,
      status: "review",
      sort: "updated_at",
      order: "desc",
    },
    shouldPass: true,
  },
  {
    name: "Invalid query params - negative page",
    schema: flashcardQuerySchema,
    data: {
      page: -1,
      limit: 50,
    },
    shouldPass: false,
  },
  {
    name: "Valid flashcard ID",
    schema: flashcardIdSchema,
    data: "123",
    shouldPass: true,
  },
  {
    name: "Invalid flashcard ID",
    schema: flashcardIdSchema,
    data: "abc",
    shouldPass: false,
  },
  {
    name: "Valid batch create",
    schema: createFlashcardsSchema,
    data: [
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "A2", source: "ai" },
    ],
    shouldPass: true,
  },
  {
    name: "Invalid batch create - empty array",
    schema: createFlashcardsSchema,
    data: [],
    shouldPass: false,
  },
];

let passed = 0;
let total = testCases.length;

for (const testCase of testCases) {
  console.log(`Testing: ${testCase.name}`);

  try {
    const result = testCase.schema.safeParse(testCase.data);
    const success = result.success === testCase.shouldPass;

    if (success) {
      console.log("  âś… PASS");
      passed++;
    } else {
      console.log("  âťŚ FAIL");
      if (!result.success) {
        console.log("     Errors:", result.error.issues.map((i) => i.message).join(", "));
      }
    }
  } catch (error) {
    console.log("  âťŚ ERROR:", error.message);
  }

  console.log("");
}

console.log(`đź“Š Results: ${passed}/${total} tests passed`);

if (passed === total) {
  console.log("đźŽ‰ All validation tests passed!");
  process.exit(0);
} else {
  console.log("đź’Ą Some tests failed!");
  process.exit(1);
}
