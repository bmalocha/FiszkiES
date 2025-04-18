import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { CreateFlashcardCommand, Flashcard } from "../../types";
import { log } from "../utils/logger";
import { ActionLogsService } from "./actionLogsService";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export class FlashcardsService {
  private readonly actionLogsService: ActionLogsService;

  constructor(private readonly supabase: SupabaseClient) {
    this.actionLogsService = new ActionLogsService(supabase);
  }

  /**
   * Creates a new flashcard for the default user
   */
  async createFlashcard(command: CreateFlashcardCommand): Promise<Flashcard> {
    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .insert({
        ...command,
        user_id: DEFAULT_USER_ID,
      })
      .select()
      .single();

    if (error) {
      throw this.handleDatabaseError(error);
    }

    // Log the ADD action
    await this.actionLogsService.logFlashcardAdd(DEFAULT_USER_ID, flashcard.id);

    return flashcard;
  }

  /**
   * Gets the total count of flashcards for the default user
   */
  async getFlashcardsCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", DEFAULT_USER_ID);

    if (error) {
      log("error", "Error counting flashcards", { error });
      throw new Error("Failed to count flashcards");
    }

    return count ?? 0;
  }

  /**
   * Gets paginated flashcards for the default user
   */
  async getFlashcards(params: {
    from: number;
    to: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  }): Promise<Flashcard[]> {
    const { data: flashcards, error } = await this.supabase
      .from("flashcards")
      .select("id, created_at, example_sentence, polish_word, spanish_word, user_id")
      .eq("user_id", DEFAULT_USER_ID)
      .order(params.sortBy, { ascending: params.sortOrder === "asc" })
      .range(params.from, params.to);

    if (error) {
      log("error", "Error fetching flashcards", { error });
      throw new Error("Failed to fetch flashcards");
    }

    return flashcards ?? [];
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
