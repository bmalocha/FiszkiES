import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenerationService, type FlashcardsResponse } from "../../../../src/lib/services/generationService";
import { OpenRouterService } from "../../../../src/lib/services/openRouterService";

// Define mock function for OpenRouterService *outside* the mock factory
const mockGenerateChatCompletion = vi.fn();

// Mock OpenRouterService
vi.mock("../../../../src/lib/services/openRouterService", () => {
  // No need to define mockGenerateChatCompletion inside
  return {
    OpenRouterService: vi.fn().mockImplementation(() => ({
      // Use the *external* mock function defined above
      generateChatCompletion: mockGenerateChatCompletion,
    })),
    // No need to export the mock function from here
  };
});

// Mock Math.random for predictable mock data selection
// Selects index floor(0.3 * 5) = 1 ('food_and_restaurant')
const MOCK_RANDOM_VALUE = 0.3;
const MOCK_RANDOM_CARD_COUNT = 7;
let randomCallCount = 0;
const mockMathRandom = vi.fn(() => {
  randomCallCount++;
  if (randomCallCount === 1) {
    // 1st call: Topic selection (0.5 -> index 1 of 5 topics -> food_and_restaurant)
    return MOCK_RANDOM_VALUE;
  }
  if (randomCallCount === 2) {
    // 2nd call: Card count selection (Math.floor(random * 6) + 5)
    // We want floor(X*6)+5 = 7 => floor(X*6) = 2. Need X*6 to be >= 2 and < 3.
    // Example: X = 0.34 => 0.34*6 = 2.04. floor(2.04)=2. 2+5=7.
    // Example: X = 0.49 => 0.49*6 = 2.94. floor(2.94)=2. 2+5=7.
    // Let's return a value in the middle, like 0.4
    return 0.4; // This should result in Math.floor(0.4 * 6) + 5 = Math.floor(2.4) + 5 = 2 + 5 = 7
  }
  // Subsequent calls (e.g., from array shuffle): Return a stable value
  return 0.5;
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

    // Restore Math.random before each test if needed, or set it up
    randomCallCount = 0; // Reset counter for Math.random mock
    vi.spyOn(Math, "random").mockImplementation(mockMathRandom);
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore original Math.random
  });

  describe("Constructor", () => {
    it("should initialize OpenRouterService when API key is provided", () => {
      new GenerationService(apiKey);
      expect(OpenRouterService).toHaveBeenCalledWith(apiKey);
    });

    it("should not initialize OpenRouterService when no API key is provided", () => {
      new GenerationService();
      expect(OpenRouterService).not.toHaveBeenCalled();
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
    });

    it("should return mock flashcards if OpenRouterService is not initialized (no API key)", async () => {
      const service = new GenerationService(); // No API key
      const result = await service.generateFlashcardsFromText(inputText);

      expect(mockGenerateChatCompletion).not.toHaveBeenCalled();
      // Check if it returns the expected number of mock cards from the selected topic
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(MOCK_RANDOM_CARD_COUNT); // Based on mocked Math.random
      expect(result[0].spanish_word).toBe("pedir"); // First word from 'food_and_restaurant'
    });

    it("should return mock flashcards if OpenRouter API call fails", async () => {
      const apiError = new Error("API Failed");
      mockGenerateChatCompletion.mockRejectedValue(apiError);
      const service = new GenerationService(apiKey);
      const result = await service.generateFlashcardsFromText(inputText);

      expect(mockGenerateChatCompletion).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(MOCK_RANDOM_CARD_COUNT);
      expect(result[0].spanish_word).toBe("pedir");
    });

    it("should return mock flashcards if API response is empty", async () => {
      mockGenerateChatCompletion.mockResolvedValue({ choices: [{ message: {} }] }); // Empty message
      const service = new GenerationService(apiKey);
      const result = await service.generateFlashcardsFromText(inputText);

      expect(mockGenerateChatCompletion).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(MOCK_RANDOM_CARD_COUNT);
      expect(result[0].spanish_word).toBe("pedir");
    });

    it("should return mock flashcards if API response is not valid JSON", async () => {
      mockGenerateChatCompletion.mockResolvedValue({
        choices: [{ message: { role: "assistant", content: "invalid json" } }],
      });
      const service = new GenerationService(apiKey);
      const result = await service.generateFlashcardsFromText(inputText);

      expect(mockGenerateChatCompletion).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(MOCK_RANDOM_CARD_COUNT);
      expect(result[0].spanish_word).toBe("pedir");
    });

    it("should return mock flashcards if API response does not match Zod schema", async () => {
      const invalidResponse = { flashcards: [{ spanish: "word" }] }; // Missing required fields
      mockGenerateChatCompletion.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant",
              content: JSON.stringify(invalidResponse),
            },
          },
        ],
      });
      const service = new GenerationService(apiKey);
      const result = await service.generateFlashcardsFromText(inputText);

      expect(mockGenerateChatCompletion).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(MOCK_RANDOM_CARD_COUNT);
      expect(result[0].spanish_word).toBe("pedir");
    });
  });

  describe("generateMockFlashcards", () => {
    it("should return a specific subset of mock flashcards based on mocked Math.random", () => {
      const service = new GenerationService(); // Doesn't matter if key is provided
      // Need to call the private method directly for isolated testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).generateMockFlashcards();

      // 1 call for topic, 1 call for count, >=0 calls for shuffle
      // Check at least the first two calls happened
      expect(mockMathRandom.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(MOCK_RANDOM_CARD_COUNT); // 7 cards based on mock
      // Check if cards are from the expected topic ('food_and_restaurant')
      expect(result[0].spanish_word).toBe("pedir");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.forEach((card: any) => {
        expect(card).toHaveProperty("polish_word");
        expect(card).toHaveProperty("spanish_word");
        expect(card).toHaveProperty("example_sentence");
      });
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
      const spyGenerateFromText = vi.spyOn(service, "generateFlashcardsFromText");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spyGenerateMock = vi.spyOn(service as any, "generateMockFlashcards");

      // Ensure the underlying API call mock is set to succeed for this specific test
      // (even though generateFlashcardsFromText is spied on, the real method is still called)
      mockGenerateChatCompletion.mockResolvedValue(successfulGenerationResult);

      await service.generateFlashcards(inputText);

      expect(spyGenerateFromText).toHaveBeenCalledWith(inputText);
      expect(spyGenerateMock).not.toHaveBeenCalled();
    });

    it("should call generateMockFlashcards when no text is provided (with API key)", async () => {
      const service = new GenerationService(apiKey); // API key exists, but no text provided
      const spyGenerateFromText = vi.spyOn(service, "generateFlashcardsFromText");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spyGenerateMock = vi.spyOn(service as any, "generateMockFlashcards");

      await service.generateFlashcards(); // No text

      expect(spyGenerateFromText).not.toHaveBeenCalled();
      expect(spyGenerateMock).toHaveBeenCalledTimes(1);
    });

    it("should call generateMockFlashcards when no text is provided (no API key)", async () => {
      const service = new GenerationService(); // No API key
      const spyGenerateFromText = vi.spyOn(service, "generateFlashcardsFromText");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spyGenerateMock = vi.spyOn(service as any, "generateMockFlashcards");

      await service.generateFlashcards(); // No text

      expect(spyGenerateFromText).not.toHaveBeenCalled(); // Correct check, it shouldn't be called
      expect(spyGenerateMock).toHaveBeenCalledTimes(1);
    });
  });
});
