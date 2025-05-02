import { z } from "zod";
import type { APIRoute } from "astro";
import { OPENROUTER_API_KEY } from "astro:env/server";
import { GenerationService } from "../../lib/services/generationService";
import { ActionLogsService } from "../../lib/services/actionLogsService";
import { generateId } from "../../lib/utils/id";
import { log } from "../../lib/utils/logger";

// Schema for request validation
const generateRequestSchema = z.object({
  text: z.string().min(1).max(10000),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.supabase) {
      log("error", "Supabase client not found in locals for generate endpoint");
      return new Response("Internal Server Error", { status: 500 });
    }

    // Ensure user is logged in
    if (!locals.user) {
      log("warn", "Unauthorized attempt to generate flashcards without authentication.");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = locals.user.id;

    // Validate request body
    const body = await request.json();
    const validatedBody = generateRequestSchema.parse(body);

    log("info", "Generating flashcard suggestions", {
      textLength: validatedBody.text.length,
      userId: userId,
    });

    // Get OpenRouter API key from environment variables
    // const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;

    // Generate flashcard suggestions
    const generationService = new GenerationService(OPENROUTER_API_KEY);
    const suggestions = await generationService.generateFlashcards(validatedBody.text);

    // Add temporary IDs to suggestions
    const suggestionsWithIds = suggestions.map((suggestion) => ({
      ...suggestion,
      id: generateId(),
    }));

    // Log the action
    const logService = new ActionLogsService(locals.supabase);
    await logService.logAction(userId, "GENERATE", {
      input_text_length: validatedBody.text.length,
      cards_count: suggestionsWithIds.length,
    });

    log("info", "Successfully generated flashcard suggestions", {
      userId: userId,
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
      userId: locals.user?.id ?? "unknown",
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
