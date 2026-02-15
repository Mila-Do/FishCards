import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly passwordStrengthIndicator: Locator;
  readonly loginLink: Locator;
  readonly termsCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    // Form elements - using precise selectors
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.confirmPasswordInput = page.locator("#confirmPassword");
    this.registerButton = page.getByRole("button", { name: /zarejestruj/i });

    // Messages (using role alert)
    this.errorMessage = page.locator('[role="alert"]').first();
    this.successMessage = page.locator('[role="alert"]').first();

    // Other elements
    this.passwordStrengthIndicator = page.locator('[data-testid="password-strength"]');
    this.loginLink = page.getByRole("link", { name: /zaloguj/i });
    this.termsCheckbox = page.getByRole("checkbox", { name: /regulamin|terms/i });
  }

  async goto() {
    await this.page.goto("/auth/register");
  }

  async register(email: string, password: string, confirmPassword?: string) {
    // Wait for form to be ready
    await this.emailInput.waitFor({ state: "visible" });

    // Clear and type email (triggers React onChange properly)
    await this.emailInput.clear();
    await this.emailInput.pressSequentially(email, { delay: 10 });
    await expect(this.emailInput).toHaveValue(email);

    // Clear and type password
    await this.passwordInput.clear();
    await this.passwordInput.pressSequentially(password, { delay: 10 });
    await expect(this.passwordInput).toHaveValue(password);

    // Clear and type confirm password
    await this.confirmPasswordInput.clear();
    await this.confirmPasswordInput.pressSequentially(confirmPassword || password, { delay: 10 });
    await expect(this.confirmPasswordInput).toHaveValue(confirmPassword || password);

    // Accept terms if checkbox exists
    const termsVisible = await this.termsCheckbox.isVisible().catch(() => false);
    if (termsVisible) {
      await this.termsCheckbox.check();
    }

    // Wait for button to be enabled - validation passed (expect auto-waits)
    await expect(this.registerButton).toBeEnabled({ timeout: 10000 });

    await this.registerButton.click();
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async expectToBeVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  async expectErrorMessage(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectSuccessMessage(message?: string) {
    await expect(this.successMessage).toBeVisible();
    if (message) {
      await expect(this.successMessage).toContainText(message);
    }
  }

  async expectSuccessfulRegistration() {
    // After successful registration, should be redirected to generator or dashboard
    // Note: RegisterForm has 2s delay before redirect
    await this.page.waitForURL(/(dashboard|generator)/, { timeout: 15000 });
  }

  async expectPasswordStrength(strength: "weak" | "medium" | "strong") {
    const strengthIndicator = this.passwordStrengthIndicator;
    await expect(strengthIndicator).toBeVisible();

    // Assert password strength indicator shows correct strength level
    // (This would need to match your actual UI implementation)
    switch (strength) {
      case "weak":
        await expect(strengthIndicator).toContainText(/słab|weak/i);
        break;
      case "medium":
        await expect(strengthIndicator).toContainText(/średni|medium/i);
        break;
      case "strong":
        await expect(strengthIndicator).toContainText(/silny|strong/i);
        break;
    }
  }

  async clickLogin() {
    await this.loginLink.click();
  }
}
