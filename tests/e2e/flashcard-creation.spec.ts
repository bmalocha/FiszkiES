import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { GeneratePage } from "./page-objects/GeneratePage";
import { MyFlashcardsPage } from "./page-objects/MyFlashcardsPage";

test.describe("Flashcard Creation Flow", () => {
  let loginPage: LoginPage;
  let generatePage: GeneratePage;
  let myFlashcardsPage: MyFlashcardsPage;

  test.beforeEach(async ({ page }) => {
    // Initialize POMs before each test
    loginPage = new LoginPage(page);
    generatePage = new GeneratePage(page);
    myFlashcardsPage = new MyFlashcardsPage(page);

    // Ensure environment variables are loaded (they should be by playwright.config)
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!username || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set in .env.test");
    }

    // 1. Log in
    await loginPage.goto("/"); // Start at home page
    await loginPage.login(username, password);
  });

  test("should generate, add, and verify flashcards", async (/*{ page }*/) => {
    // Arrange - Data & POMs are initialized in beforeEach
    const inputText = "wakacje";
    const flashcardsToAccept = 2;
    const acceptedFlashcardsData: { polish: string; spanish: string }[] = [];

    // Act
    // 2. Navigate to Generate page
    await generatePage.navigateToGenerate();
    await expect(generatePage.viewContainer).toBeVisible();

    // 3. Enter text and generate suggestions
    await generatePage.generateFlashcards(inputText);

    // 4. Accept the first 2 suggestions and reject the rest
    const allSuggestions = await generatePage.getAllSuggestionItems().all();
    console.log(`Found ${allSuggestions.length} suggestions.`);
    expect(allSuggestions.length).toBeGreaterThan(0); // Ensure suggestions were generated

    for (let i = 0; i < allSuggestions.length; i++) {
      const suggestionItem = allSuggestions[i];
      const suggestionId = await generatePage.getSuggestionId(suggestionItem);

      if (!suggestionId) {
        console.warn(`Could not get ID for suggestion item index ${i}`);
        continue; // Skip if ID couldn't be extracted
      }

      if (i < flashcardsToAccept) {
        // Get Polish and Spanish words before accepting
        const polishWord = await suggestionItem.locator(`[data-testid^='polish-word-']`).textContent();
        const spanishWord = await suggestionItem.locator(`[data-testid^='spanish-word-']`).textContent();
        if (polishWord && spanishWord) {
          acceptedFlashcardsData.push({ polish: polishWord, spanish: spanishWord });
        }

        console.log(`Accepting suggestion ${i + 1} (ID: ${suggestionId})`);
        await generatePage.acceptSuggestion(suggestionId);
      } else {
        console.log(`Rejecting suggestion ${i + 1} (ID: ${suggestionId})`);
        await generatePage.rejectSuggestion(suggestionId);
      }
    }

    expect(acceptedFlashcardsData.length).toBe(flashcardsToAccept);

    // 5. Navigate to My Flashcards page
    await myFlashcardsPage.navigateToMyFlashcards();
    await expect(myFlashcardsPage.viewContainer).toBeVisible();
    await expect(myFlashcardsPage.flashcardsTable).toBeVisible();

    // Assert
    // 6. Verify the accepted flashcards are present
    console.log("Verifying accepted flashcards on My Flashcards page...");
    for (const flashcard of acceptedFlashcardsData) {
      console.log(`Checking for: ${flashcard.polish} / ${flashcard.spanish}`);
      await myFlashcardsPage.expectFlashcardToExist(flashcard.polish, flashcard.spanish);
    }
    console.log("Verification complete.");

    // Optional: Add logout at the end?
    // await myFlashcardsPage.logout();
  });
});
