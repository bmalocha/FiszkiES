/// <reference types="astro/client" />

import type { APIContext, APIRoute } from "astro";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { CreateFlashcardCommand, CreateFlashcardResponseDto } from "../../types";
import { log } from "../../lib/utils/logger";
import { ActionLogsService } from "../../lib/services/actionLogsService";

/**
 * Sanitizes text input by:
 * 1. Trimming whitespace
 * 2. Normalizing whitespace (no multiple spaces)
 * 3. Removing control characters
 * 4. Converting to proper case (first letter uppercase for polish_word and spanish_word)
 */
function sanitizeInput(input: CreateFlashcardCommand): CreateFlashcardCommand {
  const sanitizeText = (text: string) => {
    return text
      .trim()
      .replace(/\s+/g, " ") // normalize whitespace
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // remove control characters
  };

  return {
    polish_word: sanitizeText(input.polish_word).replace(/^\w/, (c) => c.toUpperCase()),
    spanish_word: sanitizeText(input.spanish_word).replace(/^\w/, (c) => c.toUpperCase()),
    example_sentence: sanitizeText(input.example_sentence),
  };
}

// Zod schema for validating the create flashcard command
const createFlashcardSchema = z.object({
  polish_word: z
    .string()
    .min(1, "Polish word is required")
    .max(100, "Polish word must not exceed 100 characters")
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, "Polish word can only contain letters, spaces, and hyphens"),
  spanish_word: z
    .string()
    .min(1, "Spanish word is required")
    .max(100, "Spanish word must not exceed 100 characters")
    .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s-]+$/, "Spanish word can only contain letters, spaces, and hyphens"),
  example_sentence: z
    .string()
    .min(1, "Example sentence is required")
    .max(300, "Example sentence must not exceed 300 characters")
    .regex(
      /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ.,!?¿¡\s-]+$/,
      "Example sentence can only contain letters, basic punctuation, spaces, and hyphens"
    ),
});

export const prerender = false;

/**
 * Handles specific database errors and returns appropriate error messages
 */
function handleDatabaseError(error: PostgrestError): { status: number; message: string } {
  // Check for unique constraint violation
  if (error.code === "23505") {
    return {
      status: 409,
      message: "This flashcard already exists in your collection",
    };
  }

  // Check for foreign key violation
  if (error.code === "23503") {
    return {
      status: 400,
      message: "Invalid user ID provided",
    };
  }

  // Default error handling
  log("error", "Unhandled database error", { code: error.code, message: error.message });
  return {
    status: 500,
    message: "Failed to create flashcard",
  };
}

export const POST: APIRoute = async (context: APIContext) => {
  try {
    // Parse and validate request body
    const body = await context.request.json();
    const validationResult = createFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize input
    const command = sanitizeInput(validationResult.data as CreateFlashcardCommand);

    // Create flashcard using Supabase
    const { data: flashcard, error } = await context.locals.supabase
      .from("flashcards")
      .insert({
        ...command,
        user_id: DEFAULT_USER_ID,
      })
      .select()
      .single();

    if (error) {
      const { status, message } = handleDatabaseError(error);
      log("error", "Error creating flashcard", { command, error });
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log the ADD action
    const actionLogsService = new ActionLogsService(context.locals.supabase);
    await actionLogsService.logFlashcardAdd(DEFAULT_USER_ID, flashcard.id);

    // Return the created flashcard
    const response: CreateFlashcardResponseDto = {
      id: flashcard.id,
      polish_word: flashcard.polish_word,
      spanish_word: flashcard.spanish_word,
      example_sentence: flashcard.example_sentence,
      created_at: flashcard.created_at,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    log(
      "error",
      "Unexpected error in POST /api/flashcards",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
