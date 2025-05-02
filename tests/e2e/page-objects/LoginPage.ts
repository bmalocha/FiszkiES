import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page); // Initialize BasePage
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
  }

  async login(email: string, password?: string) {
    // Check if already logged in by looking for logout button
    if (await this.logoutButton.isVisible()) {
      console.log("Already logged in, skipping login step.");
      return; // Already logged in
    }

    // If not on login page, navigate there
    if (!this.page.url().includes("/login")) {
      await this.navigateToLogin();
    }

    await this.emailInput.fill(email);
    if (password) {
      await this.passwordInput.fill(password);
    }
    await this.submitButton.click();

    // Wait for navigation to the home page after successful login
    await this.page.waitForURL("**/");
    // Ensure logout button is visible, indicating successful login
    await expect(this.logoutButton).toBeVisible();
  }
}
