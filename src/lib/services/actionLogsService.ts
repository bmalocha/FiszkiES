import type { SupabaseClient } from "@supabase/supabase-js";
import type { TablesInsert } from "../../db/database.types";
import { log } from "../utils/logger";

export class ActionLogsService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Logs a user action to the action_logs table
   * @param userId The ID of the user performing the action
   * @param actionType The type of action being performed
   * @param details Additional details about the action
   */
  async logAction(
    userId: string,
    actionType: TablesInsert<"action_logs">["action_type"],
    details: {
      input_text_length?: number;
      cards_count?: number;
      related_flashcard_id?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from("action_logs").insert({
        user_id: userId,
        action_type: actionType,
        input_text_length: details.input_text_length,
        cards_count: details.cards_count,
        related_flashcard_id: details.related_flashcard_id,
        created_at: new Date().toISOString(),
      });

      if (error) {
        log("error", "Failed to log action", { userId, actionType }, error);
        // We don't throw here as logging failures shouldn't break the main flow
      }
    } catch (error) {
      log("error", "Unexpected error while logging action", { userId, actionType }, error as Error);
      // We don't throw here as logging failures shouldn't break the main flow
    }
  }

  /**
   * Logs a flashcard ADD action to the action_logs table
   * @param userId - ID of the user performing the action
   * @param flashcardId - ID of the flashcard being added
   * @returns void - This function doesn't throw errors, it only logs them
   */
  async logFlashcardAdd(userId: string, flashcardId: string): Promise<void> {
    await this.logAction(userId, "ADD", { related_flashcard_id: flashcardId });
  }
}
