# Test info

- Name: Flashcard Creation Flow >> should generate, add, and verify flashcards
- Location: /Users/bartosz/Projects/FiszkiES/tests/e2e/flashcard-creation.spec.ts:30:3

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByTestId('login-button')

    at LoginPage.navigateToLogin (/Users/bartosz/Projects/FiszkiES/tests/e2e/page-objects/BasePage.ts:26:29)
    at LoginPage.login (/Users/bartosz/Projects/FiszkiES/tests/e2e/page-objects/LoginPage.ts:25:18)
    at /Users/bartosz/Projects/FiszkiES/tests/e2e/flashcard-creation.spec.ts:27:5
```

# Test source

```ts
   1 | import { type Page, type Locator } from "@playwright/test";
   2 |
   3 | export class BasePage {
   4 |   readonly page: Page;
   5 |   readonly navLoginLink: Locator;
   6 |   readonly navGenerateLink: Locator;
   7 |   readonly navMyFlashcardsLink: Locator;
   8 |   readonly navRepeatLink: Locator;
   9 |   readonly logoutButton: Locator;
  10 |
  11 |   constructor(page: Page) {
  12 |     this.page = page;
  13 |     // Using data-testid selectors added previously
  14 |     this.navLoginLink = page.getByTestId("login-button");
  15 |     this.navGenerateLink = page.getByTestId("nav-generate");
  16 |     this.navMyFlashcardsLink = page.getByTestId("nav-my-flashcards");
  17 |     this.navRepeatLink = page.getByTestId("nav-repeat");
  18 |     this.logoutButton = page.getByTestId("logout-button");
  19 |   }
  20 |
  21 |   async goto(path = "/") {
  22 |     await this.page.goto(path);
  23 |   }
  24 |
  25 |   async navigateToLogin() {
> 26 |     await this.navLoginLink.click();
     |                             ^ Error: locator.click: Test ended.
  27 |     // Optional: Add waitForURL or expect URL to ensure navigation completes
  28 |     await this.page.waitForURL("**/login");
  29 |   }
  30 |
  31 |   async navigateToGenerate() {
  32 |     await this.navGenerateLink.click();
  33 |     await this.page.waitForURL("**/generate");
  34 |   }
  35 |
  36 |   async navigateToMyFlashcards() {
  37 |     await this.navMyFlashcardsLink.click();
  38 |     await this.page.waitForURL("**/my-flashcards");
  39 |   }
  40 |
  41 |   async navigateToRepeat() {
  42 |     await this.navRepeatLink.click();
  43 |     await this.page.waitForURL("**/repeat");
  44 |   }
  45 |
  46 |   async logout() {
  47 |     await this.logoutButton.click();
  48 |     // Wait for navigation to home or login page after logout
  49 |     await this.page.waitForURL((url) => url.pathname === "/" || url.pathname === "/login");
  50 |   }
  51 | }
  52 |
```