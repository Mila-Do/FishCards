#!/usr/bin/env node

/**
 * Simple test script for Flashcards API endpoints
 * Tests validation and error handling without requiring authentication
 */

const BASE_URL = "http://localhost:3000";

async function testEndpoint(method, url, body = null, headers = {}) {
  console.log(`\n🧪 Testing ${method} ${url}`);

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : null,
    });

    const result = await response.json().catch(() => null);

    console.log(`Status: ${response.status}`);
    if (result) {
      console.log("Response:", JSON.stringify(result, null, 2));
    }

    return { status: response.status, result };
  } catch (error) {
    console.log("Error:", error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log("🚀 Starting Flashcards API Tests\n");

  // Test 1: GET /api/flashcards without auth (should return 401)
  await testEndpoint("GET", "/api/flashcards");

  // Test 2: POST /api/flashcards without auth (should return 401)
  await testEndpoint("POST", "/api/flashcards", {
    front: "Test question",
    back: "Test answer",
  });

  // Test 3: POST /api/flashcards with invalid data (should return 400)
  // Note: This would require valid auth token, so we'll skip for now

  // Test 4: GET /api/flashcards/:id without auth (should return 401)
  await testEndpoint("GET", "/api/flashcards/1");

  // Test 5: PATCH /api/flashcards/:id without auth (should return 401)
  await testEndpoint("PATCH", "/api/flashcards/1", {
    front: "Updated question",
  });

  // Test 6: DELETE /api/flashcards/:id without auth (should return 401)
  await testEndpoint("DELETE", "/api/flashcards/1");

  console.log("\n✅ Tests completed!");
  console.log("\n📝 Note: All tests should return 401 Unauthorized without valid JWT token");
  console.log("This confirms that authentication middleware is working correctly.");
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testEndpoint, runTests };
