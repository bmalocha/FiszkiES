import { type Page, type Locator } from "@playwright/test";

export class BasePage {
  readonly page: Page;
  readonly navLoginLink: Locator;
  readonly navGenerateLink: Locator;
  readonly navMyFlashcardsLink: Locator;
  readonly navRepeatLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Using data-testid selectors added previously
    this.navLoginLink = page.getByTestId("login-button");
    this.navGenerateLink = page.getByTestId("nav-generate");
    this.navMyFlashcardsLink = page.getByTestId("nav-my-flashcards");
    this.navRepeatLink = page.getByTestId("nav-repeat");
    this.logoutButton = page.getByTestId("logout-button");
  }

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async navigateToLogin() {
    await this.navLoginLink.click();
    // Optional: Add waitForURL or expect URL to ensure navigation completes
    await this.page.waitForURL("**/login");
  }

  async navigateToGenerate() {
    await this.navGenerateLink.click();
    await this.page.waitForURL("**/generate");
  }

  async navigateToMyFlashcards() {
    await this.navMyFlashcardsLink.click();
    await this.page.waitForURL("**/my-flashcards");
  }

  async navigateToRepeat() {
    await this.navRepeatLink.click();
    await this.page.waitForURL("**/repeat");
  }

  async logout() {
    await this.logoutButton.click();
    // Wait for navigation to home or login page after logout
    await this.page.waitForURL((url) => url.pathname === "/" || url.pathname === "/login");
  }
}
