import { z } from "zod";
import type { APIRoute } from "astro";
import { GenerationService } from "../../lib/services/generationService";
import { ActionLogsService } from "../../lib/services/actionLogsService";
import { generateId } from "../../lib/utils/id";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { log } from "../../lib/utils/logger";

// Schema for request validation
const generateRequestSchema = z.object({
  text: z.string().min(1).max(10000),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.supabase) {
      log("error", "Supabase client not found in locals");
      return new Response("Internal Server Error", { status: 500 });
    }

    // Validate request body
    const body = await request.json();
    const validatedBody = generateRequestSchema.parse(body);

    log("info", "Generating flashcard suggestions", {
      textLength: validatedBody.text.length,
      userId: DEFAULT_USER_ID,
    });

    // Generate flashcard suggestions
    const generationService = new GenerationService();
    const suggestions = await generationService.generateFlashcards();

    // Add temporary IDs to suggestions
    const suggestionsWithIds = suggestions.map((suggestion) => ({
      ...suggestion,
      id: generateId(),
    }));

    // Log the action
    const logService = new ActionLogsService(locals.supabase);
    await logService.logAction(DEFAULT_USER_ID, "GENERATE", {
      input_text_length: validatedBody.text.length,
      cards_count: suggestionsWithIds.length,
    });

    log("info", "Successfully generated flashcard suggestions", {
      userId: DEFAULT_USER_ID,
      suggestionsCount: suggestionsWithIds.length,
    });

    return new Response(JSON.stringify({ suggestions: suggestionsWithIds }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const context = {
      path: "/api/generate",
      method: "POST",
      userId: DEFAULT_USER_ID,
    };

    if (error instanceof z.ZodError) {
      log(
        "error",
        "Invalid request body",
        {
          ...context,
          validationErrors: error.errors,
        },
        error
      );

      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    log("error", "Unexpected error in generate endpoint", context, error as Error);

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
