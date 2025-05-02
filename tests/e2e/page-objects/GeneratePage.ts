import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class GeneratePage extends BasePage {
  readonly viewContainer: Locator;
  readonly textInputArea: Locator;
  readonly generateButton: Locator;
  readonly suggestionsTable: Locator;
  readonly suggestionsTableBody: Locator;

  constructor(page: Page) {
    super(page);
    this.viewContainer = page.getByTestId("generate-view");
    this.textInputArea = page.getByTestId("text-input-area");
    this.generateButton = page.getByTestId("generate-button");
    this.suggestionsTable = page.getByTestId("suggestions-table");
    this.suggestionsTableBody = page.getByTestId("suggestions-table-body");
  }

  async generateFlashcards(text: string) {
    await this.textInputArea.fill(text);
    await this.generateButton.click();
    // Wait for the suggestions table to appear
    await expect(this.suggestionsTable).toBeVisible({ timeout: 15000 }); // Increase timeout for generation
  }

  // Helper to get a specific suggestion item row by its ID
  getSuggestionItem(suggestionId: string): Locator {
    return this.suggestionsTableBody.locator(`[data-testid="suggestion-item-${suggestionId}"]`);
  }

  // Helper to get the accept button for a specific suggestion
  getAcceptButton(suggestionId: string): Locator {
    return this.getSuggestionItem(suggestionId).getByTestId(`accept-button-${suggestionId}`);
  }

  // Helper to get the reject button for a specific suggestion
  getRejectButton(suggestionId: string): Locator {
    return this.getSuggestionItem(suggestionId).getByTestId(`reject-button-${suggestionId}`);
  }

  // Helper to get all suggestion items currently visible
  getAllSuggestionItems(): Locator {
    // Select rows within the suggestions table body
    return this.suggestionsTableBody.locator("tr");
  }

  // Method to accept a specific suggestion
  async acceptSuggestion(suggestionId: string) {
    await this.getAcceptButton(suggestionId).click();
    // Optionally, wait for the item state to change (e.g., to 'Added' badge)
    const item = this.getSuggestionItem(suggestionId);
    await expect(item.locator("text=Dodano")).toBeVisible(); // Example: wait for 'Added' status
  }

  // Method to reject a specific suggestion
  async rejectSuggestion(suggestionId: string) {
    await this.getRejectButton(suggestionId).click();
    // Optionally, wait for the item state to change (e.g., to 'Rejected' badge)
    const item = this.getSuggestionItem(suggestionId);
    await expect(item.locator("text=Odrzucono")).toBeVisible(); // Example: wait for 'Rejected' status
  }

  // Get the ID from a suggestion item locator (assumes ID is in data-testid)
  async getSuggestionId(itemLocator: Locator): Promise<string | null> {
    const testId = await itemLocator.getAttribute("data-testid");
    return testId ? testId.replace("suggestion-item-", "") : null;
  }
}
