import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { CreateFlashcardCommand, Flashcard } from "../../types";
import { log } from "../utils/logger";
import { ActionLogsService } from "./actionLogsService";

export class FlashcardsService {
  private readonly actionLogsService: ActionLogsService;

  constructor(private readonly supabase: SupabaseClient) {
    this.actionLogsService = new ActionLogsService(supabase);
  }

  /**
   * Creates a new flashcard for the default user
   */
  async createFlashcard(userId: string, command: CreateFlashcardCommand): Promise<Flashcard> {
    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .insert({
        ...command,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw this.handleDatabaseError(error);
    }

    // Log the ADD action
    await this.actionLogsService.logFlashcardAdd(userId, flashcard.id);

    return flashcard;
  }

  /**
   * Gets the total count of flashcards for the default user
   */
  async getFlashcardsCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      log("error", "Error counting flashcards", { error });
      throw new Error("Failed to count flashcards");
    }

    return count ?? 0;
  }

  /**
   * Gets paginated flashcards for the default user
   */
  async getFlashcards(
    userId: string,
    params: {
      from: number;
      to: number;
      sortBy: string;
      sortOrder: "asc" | "desc";
    }
  ): Promise<Flashcard[]> {
    const { data: flashcards, error } = await this.supabase
      .from("flashcards")
      .select("id, created_at, example_sentence, polish_word, spanish_word, user_id")
      .eq("user_id", userId)
      .order(params.sortBy, { ascending: params.sortOrder === "asc" })
      .range(params.from, params.to);

    if (error) {
      log("error", "Error fetching flashcards", { error });
      throw new Error("Failed to fetch flashcards");
    }

    return flashcards ?? [];
  }

  /**
   * Deletes a specific flashcard for the default user
   */
  async deleteFlashcard(userId: string, flashcardId: string): Promise<void> {
    const { error } = await this.supabase.from("flashcards").delete().match({ id: flashcardId, user_id: userId }); // Ensure user owns the flashcard

    if (error) {
      log("error", `Error deleting flashcard ${flashcardId}`, { error });
      throw new Error("Failed to delete flashcard");
    }

    // TODO: Decide if we should check the count/data to see if a row was actually deleted.
    // Supabase delete doesn't error if the match condition finds 0 rows.
    // If no row was deleted (e.g., wrong ID or not user's card), the client currently gets 204.
    // We might want to return a specific count or fetch the card first to ensure it exists and belongs to the user,
    // which would allow returning a 404 from the service if not found.
    // For now, we rely on the match condition and assume success if no DB error occurred.

    // Log the DELETE action
    await this.actionLogsService.logFlashcardDelete(userId, flashcardId);
  }

  /**
   * Handles specific database errors and returns appropriate error messages
   */
  private handleDatabaseError(error: PostgrestError): Error {
    // Check for unique constraint violation
    if (error.code === "23505") {
      return new Error("This flashcard already exists in your collection");
    }

    // Check for foreign key violation
    if (error.code === "23503") {
      return new Error("Invalid user ID provided");
    }

    // Default error handling
    log("error", "Unhandled database error", { code: error.code, message: error.message });
    return new Error("Failed to create flashcard");
  }
}
