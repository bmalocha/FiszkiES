import type { FlashcardSuggestion } from "../../types";
import { log } from "../utils/logger";
import { OpenRouterService, type Message } from "./openRouterService";
import { z } from "zod";
import { topics } from "../mockdata/flashcards";
import { createSystemPrompt, createUserPrompt } from "./promptBuilder";

export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

/**
 * Schema defining the structure of flashcards returned by the LLM
 */
const FlashcardsResponseSchema = z.object({
  flashcards: z.array(
    z.object({
      polish: z.string().describe("The Polish translation of the Spanish word/phrase."),
      spanish: z.string().describe("The generated Spanish word/phrase, including the definite article for nouns."),
      example_sentence: z.string(),
      polish_translation: z.string().describe("The Polish translation of the example sentence."),
    })
  ),
});

export type FlashcardsResponse = z.infer<typeof FlashcardsResponseSchema>;

export class GenerationService {
  private readonly openRouterService: OpenRouterService | null = null;

  /**
   * Creates a new instance of the GenerationService
   * @param openRouterApiKey Optional OpenRouter API key - if not provided, mock data will be used
   */
  constructor(openRouterApiKey?: string) {
    if (openRouterApiKey) {
      try {
        this.openRouterService = new OpenRouterService(openRouterApiKey);
        log("info", "OpenRouter service initialized successfully");
      } catch (error) {
        log(
          "error",
          "Failed to initialize OpenRouter service",
          {},
          error instanceof Error ? error : new Error(String(error))
        );
        this.openRouterService = null;
      }
    } else {
      log("info", "No OpenRouter API key provided, using mock data");
    }
  }

  /**
   * Generate flashcard suggestions from Spanish text using OpenRouter API
   * @param text Spanish text to analyze
   * @returns Array of flashcard suggestions without temporary IDs
   */
  async generateFlashcardsFromText(text: string): Promise<Omit<FlashcardSuggestion, "id">[]> {
    // If no OpenRouter service is available, fall back to mock data
    if (!this.openRouterService) {
      log("warn", "OpenRouter service not available, falling back to mock data");
      return this.generateMockFlashcards();
    }

    try {
      // Prepare messages for the LLM
      const messages: Message[] = [
        { role: "system", content: createSystemPrompt() },
        { role: "user", content: createUserPrompt(text) },
      ];

      // Define JSON schema for structured response
      const response = await this.openRouterService.generateChatCompletion({
        model: "google/gemini-2.0-flash-exp:free", //"google/gemini-2.0-flash-exp:free", // Could be configurable
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "FlashcardsResponse",
            strict: true,
            schema: {
              type: "object",
              properties: {
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      polish: {
                        type: "string",
                        description: "The Polish translation of the Spanish word/phrase.",
                      },
                      spanish: {
                        type: "string",
                        description: "The generated Spanish word/phrase, including the definite article for nouns.",
                      },
                      example_sentence: {
                        type: "string",
                        description:
                          "An example sentence in Spanish using the word/phrase, followed by the Polish translation in parentheses.",
                      },
                      polish_translation: {
                        type: "string",
                        description: "The Polish translation of the example sentence.",
                      },
                    },
                    required: ["polish", "spanish", "example_sentence", "polish_translation"],
                  },
                },
              },
              required: ["flashcards"],
              additionalProperties: false,
            },
          },
        },
        params: {
          temperature: 0.7,
          max_tokens: 2000,
        },
      });

      // Extract and parse the response
      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage || !assistantMessage.content) {
        throw new GenerationError("Empty response from language model");
      }

      // Parse and validate the response
      const responseData = JSON.parse(assistantMessage.content);
      const validationResult = FlashcardsResponseSchema.safeParse(responseData);

      if (!validationResult.success) {
        log("error", "Invalid response format from language model", {
          error: validationResult.error.format(),
          responseData: JSON.stringify(responseData),
        });
        throw new GenerationError(
          "Invalid response format from language model. Response: " + JSON.stringify(responseData),
          validationResult.error
        );
      }

      // Map the validated data to the expected output format
      const formattedFlashcards = this._mapApiResponseToFlashcardSuggestions(validationResult.data);

      return formattedFlashcards;
    } catch (error) {
      log(
        "error",
        "Error generating flashcards from text",
        { textLength: text.length },
        error instanceof Error ? error : new Error(String(error))
      );

      // When API fails, fall back to mock data
      log("info", "Falling back to mock flashcards due to API error");
      return this.generateMockFlashcards();
    }
  }

  private _mapApiResponseToFlashcardSuggestions(responseData: FlashcardsResponse): Omit<FlashcardSuggestion, "id">[] {
    return responseData.flashcards.map((card) => ({
      polish_word: card.polish,
      spanish_word: card.spanish,
      example_sentence: `${card.example_sentence} (${card.polish_translation})`,
    }));
  }

  /**
   * Generates random flashcard suggestions from a randomly selected topic.
   * This is used as a fallback when the OpenRouter API is not available.
   * @returns Array of 5-10 flashcard suggestions without temporary IDs
   */
  private generateMockFlashcards(): Omit<FlashcardSuggestion, "id">[] {
    // Get random topic
    const topicKeys = Object.keys(topics);
    const randomTopicKey = topicKeys[Math.floor(Math.random() * topicKeys.length)] as keyof typeof topics;

    // Get random number of flashcards (between 5 and 10)
    const numberOfCards = Math.floor(Math.random() * 6) + 5;

    // Get random cards from selected topic
    const topicCards = topics[randomTopicKey];
    const shuffled = [...topicCards].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, numberOfCards);
  }

  /**
   * Generates flashcard suggestions - either from text using the API or mock data if no text provided.
   * This maintains backward compatibility with the previous implementation.
   * @param text Optional Spanish text to analyze. If not provided, mock data is used.
   * @returns Array of flashcard suggestions without temporary IDs
   */
  async generateFlashcards(text?: string): Promise<Omit<FlashcardSuggestion, "id">[]> {
    if (text) {
      return this.generateFlashcardsFromText(text);
    } else {
      return this.generateMockFlashcards();
    }
  }

  // Mock data for fallback when the API is not available
  // private readonly topics = { ... }; // This will be removed
}
