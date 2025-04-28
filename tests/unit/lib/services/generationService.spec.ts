import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenerationService, type FlashcardsResponse } from "../../../../src/lib/services/generationService";
import { OpenRouterService } from "../../../../src/lib/services/openRouterService";
import type { FlashcardSuggestion } from "../../../../src/types";

// Define mock function for OpenRouterService *outside* the mock factory
const mockGenerateChatCompletion = vi.fn();
// Define a predictable return value for the mock fallback
const MOCK_FALLBACK_CARDS: Omit<FlashcardSuggestion, "id">[] = [
  { polish_word: "mock_pl", spanish_word: "mock_es", example_sentence: "mock_ex" },
];

// Mock OpenRouterService
vi.mock("../../../../src/lib/services/openRouterService", () => {
  return {
    OpenRouterService: vi.fn().mockImplementation(() => ({
      generateChatCompletion: mockGenerateChatCompletion,
    })),
  };
});

describe("GenerationService", () => {
  const apiKey = "test-api-key";
  const inputText = "Some input text about food.";

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Re-assign mock implementations after clearing, especially for module mocks

    vi.mocked(OpenRouterService).mockImplementation(
      () =>
        ({
          generateChatCompletion: mockGenerateChatCompletion,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize OpenRouterService when API key is provided", () => {
      new GenerationService(apiKey);
      expect(OpenRouterService).toHaveBeenCalledWith(apiKey);
    });

    it("should handle OpenRouterService constructor errors", () => {
      const constructorError = new Error("Failed to init");

      vi.mocked(OpenRouterService).mockImplementationOnce(() => {
        throw constructorError;
      });

      const service = new GenerationService(apiKey);
      expect(OpenRouterService).toHaveBeenCalledWith(apiKey);
      // Service should still be created but openRouterService property will be null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).openRouterService).toBeNull();
    });
  });

  describe("generateFlashcardsFromText", () => {
    // Define shared mock responses for this suite
    const mockApiResponse: FlashcardsResponse = {
      flashcards: [
        {
          polish_word: "jedzenie",
          spanish_word: "la comida",
          example_sentence: "Me gusta la comida española. (Lubię hiszpańskie jedzenie.)",
        },
        {
          polish_word: "restauracja",
          spanish_word: "el restaurante",
          example_sentence: "Vamos a un restaurante mexicano. (Idziemy do meksykańskiej restauracji.)",
        },
      ],
    };
    const successfulGenerationResult = {
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify(mockApiResponse),
          },
        },
      ],
    };

    // Reset the mock implementation before each test in this suite
    beforeEach(() => {
      // Default to successful API response for tests in this block
      mockGenerateChatCompletion.mockResolvedValue(successfulGenerationResult);
    });

    it("should call OpenRouterService with correct parameters and return parsed flashcards", async () => {
      const service = new GenerationService(apiKey);
      // Spy on the instance AFTER it's created
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generateMockFlashcardsSpy = vi.spyOn(service as any, "generateMockFlashcards");

      const result = await service.generateFlashcardsFromText(inputText);

      expect(mockGenerateChatCompletion).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateChatCompletion.mock.calls[0][0];
      expect(callArgs.model).toBe("google/gemini-2.0-flash-exp:free");
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe("system");
      expect(callArgs.messages[0].content).toContain("expert Spanish language tutor");
      expect(callArgs.messages[1].role).toBe("user");
      expect(callArgs.messages[1].content).toContain(inputText);
      expect(callArgs.response_format?.type).toBe("json_schema");
      expect(callArgs.response_format?.json_schema?.name).toBe("FlashcardsResponse");
      expect(callArgs.params).toEqual({ temperature: 0.7, max_tokens: 2000 });

      expect(result).toEqual(mockApiResponse.flashcards);
      // Ensure the fallback was NOT called
      expect(generateMockFlashcardsSpy).not.toHaveBeenCalled();
    });

    it("should return mock flashcards if OpenRouter API call fails or returns invalid data", async () => {
      const service = new GenerationService(apiKey);
      // Spy on the instance AFTER it's created, inside the loop for clarity

      const testCases = [
        { case: "API Error", setup: () => mockGenerateChatCompletion.mockRejectedValue(new Error("API Failed")) },
        { case: "Empty Response", setup: () => mockGenerateChatCompletion.mockResolvedValue({ choices: [] }) }, // More realistic empty response
        {
          case: "No Content",
          setup: () => mockGenerateChatCompletion.mockResolvedValue({ choices: [{ message: {} }] }),
        },
        {
          case: "Invalid JSON",
          setup: () =>
            mockGenerateChatCompletion.mockResolvedValue({
              choices: [{ message: { role: "assistant", content: "invalid json" } }],
            }),
        },
        {
          case: "Schema Mismatch",
          setup: () =>
            mockGenerateChatCompletion.mockResolvedValue({
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: JSON.stringify({ flashcards: [{ spanish: "word" }] }), // Missing required fields
                  },
                },
              ],
            }),
        },
      ];

      for (const { case: testCaseName, setup } of testCases) {
        // Reset mocks for each sub-case
        vi.clearAllMocks();
        // Re-apply necessary mocks that clearAllMocks might remove

        vi.mocked(OpenRouterService).mockImplementation(
          () => ({ generateChatCompletion: mockGenerateChatCompletion }) as any
        );
        // Spy on the instance method for this specific test run

        const generateMockFlashcardsSpy = vi
          .spyOn(service as any, "generateMockFlashcards")
          .mockReturnValue(MOCK_FALLBACK_CARDS);

        setup(); // Set up the specific failure condition

        const result = await service.generateFlashcardsFromText(inputText);

        expect(mockGenerateChatCompletion, `Failed on case: ${testCaseName}`).toHaveBeenCalledTimes(1);
        expect(generateMockFlashcardsSpy, `Failed on case: ${testCaseName}`).toHaveBeenCalledTimes(1);
        expect(result, `Failed on case: ${testCaseName}`).toEqual(MOCK_FALLBACK_CARDS);

        // Clear mocks again before the next iteration inside the loop is generally good practice
        vi.clearAllMocks();
      }
    });
  });

  describe("generateFlashcards (main method)", () => {
    // Re-use the successful mock response setup from the suite above if needed
    const mockApiResponse: FlashcardsResponse = {
      flashcards: [
        {
          polish_word: "jedzenie",
          spanish_word: "la comida",
          example_sentence: "Me gusta la comida española. (Lubię hiszpańskie jedzenie.)",
        },
      ],
    };
    const successfulGenerationResult = {
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify(mockApiResponse), // Use a simplified version or the full one
          },
        },
      ],
    };

    it("should call generateFlashcardsFromText when text is provided", async () => {
      const service = new GenerationService(apiKey);
      // Spy on the instance method AFTER the instance is created
      const spyGenerateFromText = vi.spyOn(service, "generateFlashcardsFromText");
      // Spy on the mock fallback method on the instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generateMockFlashcardsSpy = vi.spyOn(service as any, "generateMockFlashcards");

      // Ensure the underlying API call mock is set to succeed
      mockGenerateChatCompletion.mockResolvedValue(successfulGenerationResult);

      await service.generateFlashcards(inputText);

      expect(spyGenerateFromText).toHaveBeenCalledWith(inputText);
      expect(generateMockFlashcardsSpy).not.toHaveBeenCalled(); // Fallback shouldn't be called
    });

    it("should call generateMockFlashcards when no text is provided (with API key)", async () => {
      const service = new GenerationService(apiKey); // API key exists, but no text provided
      const spyGenerateFromText = vi.spyOn(service, "generateFlashcardsFromText");
      // Spy on the instance method AFTER it's created

      const generateMockFlashcardsSpy = vi
        .spyOn(service as any, "generateMockFlashcards")
        .mockReturnValue(MOCK_FALLBACK_CARDS); // Mock return needed as it's actually called

      await service.generateFlashcards(); // No text

      expect(spyGenerateFromText).not.toHaveBeenCalled();
      // Check the instance spy we set up
      expect(generateMockFlashcardsSpy).toHaveBeenCalledTimes(1);
    });
  });
});
