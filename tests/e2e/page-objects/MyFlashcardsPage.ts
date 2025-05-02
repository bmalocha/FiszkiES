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
    // Locate the row containing the specific Polish word
    const row = this.flashcardsTableBody.locator("tr", { has: this.page.locator(`text='${polishWord}'`) });
    // Within that row, check if the Spanish word also exists
    await expect(row.locator(`text='${spanishWord}'`)).toBeVisible();
    // Optionally check other details like example sentence if needed
  }
}
