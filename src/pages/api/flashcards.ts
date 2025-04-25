/// <reference types="astro/client" />

import type { APIContext, APIRoute } from "astro";
import { z } from "zod";
import type { CreateFlashcardCommand, CreateFlashcardResponseDto, GetFlashcardsResponseDto } from "../../types";
import { log } from "../../lib/utils/logger";
import { FlashcardsService } from "../../lib/services/flashcardsService";

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
  polish_word: z.string().min(1, "Polish word is required").max(100, "Polish word must not exceed 100 characters"),
  spanish_word: z.string().min(1, "Spanish word is required").max(100, "Spanish word must not exceed 100 characters"),
  example_sentence: z
    .string()
    .min(1, "Example sentence is required")
    .max(300, "Example sentence must not exceed 300 characters"),
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

export const POST: APIRoute = async (context: APIContext) => {
  try {
    // Ensure user is logged in
    if (!context.locals.user) {
      log("warn", "Unauthorized attempt to create flashcard without authentication.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = context.locals.user.id;

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

    // Create flashcard using service
    const flashcardsService = new FlashcardsService(context.locals.supabase);

    try {
      const flashcard = await flashcardsService.createFlashcard(userId, command);

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
      if (error instanceof Error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.message.includes("already exists") ? 409 : 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }
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
    // Ensure user is logged in
    if (!context.locals.user) {
      log("warn", "Unauthorized attempt to get flashcards without authentication.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = context.locals.user.id;

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
    const flashcardsService = new FlashcardsService(context.locals.supabase);

    // Get total count of user's flashcards
    const totalItems = await flashcardsService.getFlashcardsCount(userId);

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
    const flashcards = await flashcardsService.getFlashcards(userId, {
      from,
      to,
      sortBy,
      sortOrder,
    });

    // Prepare and return the response
    const response: GetFlashcardsResponseDto = {
      data: flashcards,
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
