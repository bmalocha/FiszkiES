/// <reference types="astro/client" />

import type { APIContext, APIRoute } from "astro";
import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { CreateFlashcardCommand, CreateFlashcardResponseDto, GetFlashcardsResponseDto } from "../../types";
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
    return text.trim().replace(/\s+/g, " "); // normalize whitespace
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

// Zod schema for validating GET /api/flashcards query parameters
const getFlashcardsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 20;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 20;
      // Limit maximum page size to prevent excessive data fetching
      return Math.min(parsed, 100);
    }),
  sortBy: z
    .enum(["created_at", "polish_word", "spanish_word"])
    .optional()
    .transform((val) => val ?? "created_at"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .transform((val) => val ?? "desc"),
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

export const GET: APIRoute = async (context: APIContext) => {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(context.url.searchParams.entries());
    const validationResult = getFlashcardsQuerySchema.safeParse(queryParams);

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

    const { page, pageSize, sortBy, sortOrder } = validationResult.data;

    // Get total count of user's flashcards first
    const { count: totalItems, error: countError } = await context.locals.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", DEFAULT_USER_ID);

    if (countError) {
      log("error", "Error counting flashcards", { error: countError });
      return new Response(JSON.stringify({ error: "Failed to fetch flashcards" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle case when there are no flashcards
    if (!totalItems) {
      const emptyResponse: GetFlashcardsResponseDto = {
        data: [],
        pagination: {
          currentPage: 1,
          pageSize,
          totalItems: 0,
          totalPages: 0,
        },
      };
      return new Response(JSON.stringify(emptyResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate total pages and handle out-of-range page number
    const totalPages = Math.ceil(totalItems / pageSize);
    const adjustedPage = Math.min(page, totalPages);

    // Calculate pagination range with adjusted page number
    const from = (adjustedPage - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch paginated and sorted flashcards
    const { data: flashcards, error: fetchError } = await context.locals.supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID)
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(from, to);

    if (fetchError) {
      log("error", "Error fetching flashcards", { error: fetchError });
      return new Response(JSON.stringify({ error: "Failed to fetch flashcards" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare and return the response
    const response: GetFlashcardsResponseDto = {
      data: flashcards ?? [],
      pagination: {
        currentPage: adjustedPage,
        pageSize,
        totalItems,
        totalPages,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    log(
      "error",
      "Unexpected error in GET /api/flashcards",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
