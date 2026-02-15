import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly backToHomeLink: Locator;
  readonly demoModeLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Form elements - using precise selectors
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.getByRole("button", { name: /zaloguj/i });

    // Error and success messages (using role alert)
    this.errorMessage = page.locator('[role="alert"]').first();

    // Navigation links
    this.backToHomeLink = page.getByRole("link", { name: /powrót na stronę główną/i });
    this.demoModeLink = page.getByRole("link", { name: /tryb demo/i });
    this.forgotPasswordLink = page.getByRole("link", { name: /zapomniałem hasła/i });
    this.registerLink = page.getByRole("link", { name: /zarejestruj/i });
  }

  async goto() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, password: string) {
    // Fill fields and trigger events manually
    await this.emailInput.fill(email);
    await this.emailInput.dispatchEvent("input");
    await this.emailInput.dispatchEvent("change");
    await expect(this.emailInput).toHaveValue(email);

    await this.passwordInput.fill(password);
    await this.passwordInput.dispatchEvent("input");
    await this.passwordInput.dispatchEvent("change");
    await expect(this.passwordInput).toHaveValue(password);

    // Wait for button to be enabled - validation passed (expect auto-waits)
    await expect(this.loginButton).toBeEnabled({ timeout: 5000 });

    await this.loginButton.click();
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async expectToBeVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  async expectErrorMessage(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectSuccessfulLogin() {
    // After successful login, should be redirected to dashboard
    await this.page.waitForURL("**/dashboard", { timeout: 30000 });
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async clickRegister() {
    await this.registerLink.click();
  }

  async clickBackToHome() {
    await this.backToHomeLink.click();
  }
}
