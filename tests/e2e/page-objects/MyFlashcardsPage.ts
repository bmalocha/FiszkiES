import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class MyFlashcardsPage extends BasePage {
  readonly viewContainer: Locator;
  readonly flashcardsTable: Locator;
  readonly flashcardsTableBody: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);
    this.viewContainer = page.getByTestId("my-flashcards-view");
    this.flashcardsTable = page.getByTestId("flashcards-table");
    this.flashcardsTableBody = page.getByTestId("flashcards-table-body");
    this.loadMoreButton = page.getByTestId("load-more-button");
  }

  // Helper to get a specific flashcard item row by its ID
  getFlashcardItem(flashcardId: string): Locator {
    return this.flashcardsTableBody.locator(`[data-testid="flashcard-item-${flashcardId}"]`);
  }

  // Helper to get the Polish word cell for a specific flashcard
  getPolishWordCell(flashcardId: string): Locator {
    return this.getFlashcardItem(flashcardId).locator(`[data-testid="polish-word-${flashcardId}"]`);
  }

  // Helper to get the Spanish word cell for a specific flashcard
  getSpanishWordCell(flashcardId: string): Locator {
    return this.getFlashcardItem(flashcardId).locator(`[data-testid="spanish-word-${flashcardId}"]`);
  }

  // Helper to get all flashcard items currently visible
  getAllFlashcardItems(): Locator {
    return this.flashcardsTableBody.locator("tr[data-testid^='flashcard-item-']");
  }

  // Method to check if a specific flashcard exists by Polish and Spanish words
  async expectFlashcardToExist(polishWord: string, spanishWord: string) {
    // Find all flashcard rows
    const rows = this.getAllFlashcardItems();
    // Filter rows to find one that contains both the expected Polish and Spanish words in their respective cells.
    // This is more robust than relying on text within the row.
    const matchingRow = rows
      .filter({
        has: this.page.locator(`[data-testid^='polish-word-']:has-text("${polishWord}")`),
        hasText: spanishWord, // Check if the Spanish word exists somewhere in the row context
      })
      .filter({
        has: this.page.locator(`[data-testid^='spanish-word-']:has-text("${spanishWord}")`),
      });

    // Assert that exactly one such row is visible
    await expect(matchingRow).toBeVisible();
    await expect(matchingRow).toHaveCount(1);

    // Optional: Further assert the text content of the specific cells in the found row
    // await expect(matchingRow.locator(`[data-testid^='polish-word-']`)).toHaveText(polishWord);
    // await expect(matchingRow.locator(`[data-testid^='spanish-word-']`)).toHaveText(spanishWord);
  }
}
