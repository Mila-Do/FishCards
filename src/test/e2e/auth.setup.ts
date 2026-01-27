/**
 * Authentication setup test
 * This file tests that the login flow works correctly.
 * It does NOT create shared auth state for other tests - each test logs in independently.
 */

import { test, expect } from "@playwright/test";
import { loginAsTestUser, TEST_USER } from "./helpers/auth-helpers";
import { DashboardPage } from "./pages/DashboardPage";

test.describe("Authentication Setup", () => {
  test("should authenticate test user successfully", async ({ page }) => {
    // Test that login flow works
    await loginAsTestUser(page);

    // Verify we're on dashboard
    expect(page.url()).toContain("/dashboard");

    // Verify dashboard is visible
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectToBeVisible();

    // Log success for debugging
    console.log(`✅ Test user authenticated successfully: ${TEST_USER.email}`);
  });
});
