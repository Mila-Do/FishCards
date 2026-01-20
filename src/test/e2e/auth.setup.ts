import { test as setup } from "@playwright/test";
import path from "path";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";

const authFile = path.resolve(process.cwd(), "playwright/.auth/user.json");

// Test user credentials - fallback to known test user
const TEST_USER = {
  email: process.env.E2E_USERNAME || "testuser01@gmail.com",
  password: process.env.E2E_PASSWORD || "testUser01",
};

setup("authenticate", async ({ page }) => {
  /* eslint-disable no-console */
  console.log("🔐 Starting authentication setup...");

  const loginPage = new LoginPage(page);
  const registerPage = new RegisterPage(page);
  const dashboardPage = new DashboardPage(page);

  // Strategy: Try to login first, if it fails, register new user
  try {
    console.log("🔑 Attempting to login with existing user...");

    // Navigate to login page
    await loginPage.goto();
    await loginPage.waitForLoad();
    await loginPage.expectToBeVisible();

    console.log(`📧 Logging in as: ${TEST_USER.email}`);

    // Try to login
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // Wait a bit for potential redirect or error
    await page.waitForTimeout(2000);

    // Check if we're on dashboard (successful login)
    if (page.url().includes("/dashboard")) {
      console.log("✅ Login successful!");
      await dashboardPage.expectToBeVisible();
    } else {
      throw new Error("Login failed - will try registration");
    }
  } catch {
    console.log("⚠️ Login failed, trying registration...");

    // Generate unique email for registration
    const timestamp = Date.now();
    const registerEmail = `test-${timestamp}@example.com`;
    const registerPassword = "TestPassword123!";

    console.log(`📝 Registering new user: ${registerEmail}`);

    // Navigate to registration page
    await registerPage.goto();
    await registerPage.waitForLoad();
    await registerPage.expectToBeVisible();

    // Register new user
    await registerPage.register(registerEmail, registerPassword);

    // Wait for successful registration
    await page.waitForTimeout(3000);

    // Should redirect to dashboard after registration
    if (!page.url().includes("/dashboard") && !page.url().includes("/generator")) {
      // If not redirected, navigate manually
      await dashboardPage.goto();
    }

    await dashboardPage.waitForLoad();
    await dashboardPage.expectToBeVisible();

    console.log(`✅ Registration successful for: ${registerEmail}`);
  }

  // Final verification
  console.log("🔍 Final verification - checking authenticated state...");

  // Ensure we're on dashboard
  if (!page.url().includes("/dashboard")) {
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();
  }

  await dashboardPage.expectToBeVisible();
  console.log("✅ Authentication verified - saving state");

  // Save authentication state
  console.log("💾 Saving authentication state to:", authFile);
  const storageState = await page.context().storageState({ path: authFile });
  console.log("✅ Storage state saved with", storageState.cookies.length, "cookies");

  console.log("💾 Authentication state saved to:", authFile);
  /* eslint-enable no-console */
});
