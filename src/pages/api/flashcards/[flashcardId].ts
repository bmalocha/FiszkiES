/// <reference types="astro/client" />

import type { APIContext, APIRoute } from "astro";
import { z } from "zod";
import { log } from "../../../lib/utils/logger";
import { FlashcardsService } from "../../../lib/services/flashcardsService";

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }: APIContext) => {
  try {
    // 1. Validate flashcardId parameter (ensure it's a UUID)
    if (!locals.user) {
      log("warn", "Unauthorized attempt to delete flashcard without authentication.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.user.id;

    const flashcardId = params.flashcardId;
    const idValidation = z
      .string()
      .uuid({
        message: "Invalid Flashcard ID format. Expected UUID.",
      })
      .safeParse(flashcardId);

    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid Flashcard ID",
          details: idValidation.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validFlashcardId = idValidation.data;

    // 2. Instantiate service
    const flashcardsService = new FlashcardsService(locals.supabase);

    // 3. Call service method to delete
    try {
      await flashcardsService.deleteFlashcard(userId, validFlashcardId);
      // 4. Return success (204 No Content)
      return new Response(null, { status: 204 });
    } catch (error) {
      // Handle specific errors from the service
      if (error instanceof Error) {
        log(
          "warn", // Log as warning, as it might be expected (e.g., not found)
          `Failed to delete flashcard ${validFlashcardId}: ${error.message}`,
          { flashcardId: validFlashcardId },
          error
        );
        // Check for specific error types if service throws custom errors
        if (error.message.includes("not found")) {
          // Simple check
          return new Response(
            JSON.stringify({ error: "Flashcard not found or you do not have permission to delete it." }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        // Generic service error
        return new Response(JSON.stringify({ error: "Failed to delete flashcard." }), {
          status: 500, // Or appropriate status based on error
          headers: { "Content-Type": "application/json" },
        });
      }
      // Re-throw if it's not an expected Error instance
      throw error;
    }
  } catch (error) {
    // Catch unexpected errors during validation or instantiation
    log(
      "error",
      "Unexpected error in DELETE /api/flashcards/{flashcardId}",
      { flashcardId: params.flashcardId }, // Log the potentially invalid ID
      error instanceof Error ? error : new Error(String(error))
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
