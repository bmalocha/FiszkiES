import type { FlashcardSuggestion } from "../../types";
import { log } from "../utils/logger";
import { OpenRouterService, type Message } from "./openRouterService";
import { z } from "zod";

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
      polish_word: z.string(),
      spanish_word: z.string(),
      example_sentence: z.string(),
    })
  ),
});

export type FlashcardsResponse = z.infer<typeof FlashcardsResponseSchema>;

export class GenerationService {
  private readonly openRouterService: OpenRouterService | null = null;

  // Mock data for fallback when the API is not available
  private readonly topics = {
    daily_routines: [
      {
        polish_word: "budzić się",
        spanish_word: "despertarse",
        example_sentence: "Me despierto a las siete. (Budzę się o siódmej.)",
      },
      {
        polish_word: "myć się",
        spanish_word: "lavarse",
        example_sentence: "Me lavo la cara cada mañana. (Myję twarz każdego ranka.)",
      },
      {
        polish_word: "ubierać się",
        spanish_word: "vestirse",
        example_sentence: "Me visto rápidamente. (Ubieram się szybko.)",
      },
      {
        polish_word: "śniadanie",
        spanish_word: "desayuno",
        example_sentence: "Tomo el desayuno a las ocho. (Jem śniadanie o ósmej.)",
      },
      {
        polish_word: "iść do pracy",
        spanish_word: "ir al trabajo",
        example_sentence: "Voy al trabajo en autobús. (Jadę do pracy autobusem.)",
      },
      {
        polish_word: "wracać do domu",
        spanish_word: "volver a casa",
        example_sentence: "Vuelvo a casa a las cinco. (Wracam do domu o piątej.)",
      },
      {
        polish_word: "gotować obiad",
        spanish_word: "preparar la comida",
        example_sentence: "Preparo la comida para mi familia. (Gotuję obiad dla rodziny.)",
      },
      {
        polish_word: "odpoczywać",
        spanish_word: "descansar",
        example_sentence: "Descanso un poco después del trabajo. (Odpoczywam trochę po pracy.)",
      },
      {
        polish_word: "oglądać telewizję",
        spanish_word: "ver la televisión",
        example_sentence: "Veo la televisión por la noche. (Oglądam telewizję wieczorem.)",
      },
      {
        polish_word: "iść spać",
        spanish_word: "irse a dormir",
        example_sentence: "Me voy a dormir a las once. (Idę spać o jedenastej.)",
      },
    ],
    food_and_restaurant: [
      {
        polish_word: "zamawiać",
        spanish_word: "pedir",
        example_sentence: "¿Puedo pedir el menú? (Czy mogę prosić o menu?)",
      },
      {
        polish_word: "rachunek",
        spanish_word: "la cuenta",
        example_sentence: "La cuenta, por favor. (Poproszę rachunek.)",
      },
      {
        polish_word: "przystawka",
        spanish_word: "entrante",
        example_sentence: "De entrante quiero una sopa. (Na przystawkę chcę zupę.)",
      },
      {
        polish_word: "danie główne",
        spanish_word: "plato principal",
        example_sentence: "El plato principal es pescado. (Daniem głównym jest ryba.)",
      },
      {
        polish_word: "deser",
        spanish_word: "postre",
        example_sentence: "¿Qué hay de postre? (Co jest na deser?)",
      },
      {
        polish_word: "kelner",
        spanish_word: "camarero",
        example_sentence: "El camarero es muy amable. (Kelner jest bardzo miły.)",
      },
      {
        polish_word: "rezerwacja",
        spanish_word: "reserva",
        example_sentence: "Tengo una reserva para dos. (Mam rezerwację dla dwóch osób.)",
      },
      {
        polish_word: "stolik",
        spanish_word: "mesa",
        example_sentence: "¿Tiene una mesa libre? (Czy ma pan wolny stolik?)",
      },
      {
        polish_word: "napój",
        spanish_word: "bebida",
        example_sentence: "¿Qué bebida quieres? (Jaki napój chcesz?)",
      },
      {
        polish_word: "smacznego",
        spanish_word: "buen provecho",
        example_sentence: "¡Buen provecho! (Smacznego!)",
      },
    ],
    shopping: [
      {
        polish_word: "sklep",
        spanish_word: "tienda",
        example_sentence: "La tienda está cerrada. (Sklep jest zamknięty.)",
      },
      {
        polish_word: "przymierzać",
        spanish_word: "probarse",
        example_sentence: "Me pruebo estos pantalones. (Przymierzam te spodnie.)",
      },
      {
        polish_word: "rozmiar",
        spanish_word: "talla",
        example_sentence: "¿Qué talla necesitas? (Jakiego rozmiaru potrzebujesz?)",
      },
      {
        polish_word: "przecena",
        spanish_word: "rebaja",
        example_sentence: "Hay rebajas en esta tienda. (W tym sklepie są przeceny.)",
      },
      {
        polish_word: "kasa",
        spanish_word: "caja",
        example_sentence: "La caja está al fondo. (Kasa jest w głębi.)",
      },
      {
        polish_word: "przymierzalnia",
        spanish_word: "probador",
        example_sentence: "El probador está ocupado. (Przymierzalnia jest zajęta.)",
      },
      {
        polish_word: "paragon",
        spanish_word: "ticket",
        example_sentence: "¿Necesita el ticket? (Potrzebuje pan paragon?)",
      },
      {
        polish_word: "koszyk",
        spanish_word: "cesta",
        example_sentence: "Cojo una cesta para comprar. (Biorę koszyk na zakupy.)",
      },
      {
        polish_word: "promocja",
        spanish_word: "oferta",
        example_sentence: "Hay una oferta especial. (Jest specjalna promocja.)",
      },
      {
        polish_word: "płacić",
        spanish_word: "pagar",
        example_sentence: "¿Cómo quiere pagar? (Jak chce pan zapłacić?)",
      },
    ],
    health: [
      {
        polish_word: "ból głowy",
        spanish_word: "dolor de cabeza",
        example_sentence: "Tengo dolor de cabeza. (Boli mnie głowa.)",
      },
      {
        polish_word: "gorączka",
        spanish_word: "fiebre",
        example_sentence: "Tiene fiebre alta. (Ma wysoką gorączkę.)",
      },
      {
        polish_word: "przeziębienie",
        spanish_word: "resfriado",
        example_sentence: "Estoy resfriado. (Jestem przeziębiony.)",
      },
      {
        polish_word: "apteka",
        spanish_word: "farmacia",
        example_sentence: "La farmacia está cerca. (Apteka jest blisko.)",
      },
      {
        polish_word: "recepta",
        spanish_word: "receta",
        example_sentence: "Necesito una receta. (Potrzebuję recepty.)",
      },
      {
        polish_word: "lekarz",
        spanish_word: "médico",
        example_sentence: "Voy al médico mañana. (Idę do lekarza jutro.)",
      },
      {
        polish_word: "tabletka",
        spanish_word: "pastilla",
        example_sentence: "Tomo una pastilla cada día. (Biorę tabletkę codziennie.)",
      },
      {
        polish_word: "syrop",
        spanish_word: "jarabe",
        example_sentence: "El jarabe es para la tos. (Syrop jest na kaszel.)",
      },
      {
        polish_word: "alergia",
        spanish_word: "alergia",
        example_sentence: "Tengo alergia al polen. (Mam alergię na pyłki.)",
      },
      {
        polish_word: "wizyta",
        spanish_word: "cita",
        example_sentence: "Tengo una cita con el dentista. (Mam wizytę u dentysty.)",
      },
    ],
    travel: [
      {
        polish_word: "bilet",
        spanish_word: "billete",
        example_sentence: "Necesito un billete de ida y vuelta. (Potrzebuję bilet w obie strony.)",
      },
      {
        polish_word: "walizka",
        spanish_word: "maleta",
        example_sentence: "Mi maleta es grande. (Moja walizka jest duża.)",
      },
      {
        polish_word: "lotnisko",
        spanish_word: "aeropuerto",
        example_sentence: "El aeropuerto está lejos. (Lotnisko jest daleko.)",
      },
      {
        polish_word: "paszport",
        spanish_word: "pasaporte",
        example_sentence: "¿Dónde está mi pasaporte? (Gdzie jest mój paszport?)",
      },
      {
        polish_word: "rezerwacja hotelu",
        spanish_word: "reserva de hotel",
        example_sentence: "Tengo una reserva de hotel. (Mam rezerwację hotelu.)",
      },
      {
        polish_word: "zwiedzać",
        spanish_word: "visitar",
        example_sentence: "Quiero visitar el museo. (Chcę zwiedzić muzeum.)",
      },
      {
        polish_word: "mapa",
        spanish_word: "mapa",
        example_sentence: "Necesito un mapa de la ciudad. (Potrzebuję mapę miasta.)",
      },
      {
        polish_word: "zagubiony",
        spanish_word: "perdido",
        example_sentence: "Estoy perdido. (Jestem zagubiony.)",
      },
      {
        polish_word: "kierunek",
        spanish_word: "dirección",
        example_sentence: "¿Cuál es la dirección? (Jaki jest kierunek?)",
      },
      {
        polish_word: "dworzec",
        spanish_word: "estación",
        example_sentence: "La estación está cerca. (Dworzec jest blisko.)",
      },
    ],
  };

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
   * Creates a system prompt for the LLM to generate flashcards
   */
  private createSystemPrompt(): string {
    return `You are an expert Spanish language tutor, helping Polish speakers learn Spanish. 
Your task is to analyze the provided Spanish text and extract 5-10 useful vocabulary items with their translations and example sentences.

You must follow these requirements:
1. Extract 5-10 words or phrases from the text that would be useful for a Polish speaker learning Spanish
2. For each word or phrase, provide:
   - The Spanish word/phrase
   - The Polish translation
   - An example sentence in Spanish that shows how to use the word/phrase in context
   - Include the Polish translation of the example sentence in parentheses
3. Select a variety of vocabulary (nouns, verbs, adjectives, phrases)
4. Choose words that are useful for everyday conversation
5. Ensure the Spanish example sentences are grammatically correct
6. Format your response as a valid JSON object following the provided schema`;
  }

  /**
   * Creates a user prompt containing the text to analyze
   */
  private createUserPrompt(text: string): string {
    return `Please analyze this Spanish text and create flashcards for important vocabulary:

${text}`;
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
        { role: "system", content: this.createSystemPrompt() },
        { role: "user", content: this.createUserPrompt(text) },
      ];

      // Define JSON schema for structured response
      const response = await this.openRouterService.generateChatCompletion({
        model: "anthropic/claude-3-haiku-20240307", // Could be configurable
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "FlashcardsResponse",
            strict: true,
            schema: FlashcardsResponseSchema.shape,
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
        throw new GenerationError("Invalid response format from language model", validationResult.error);
      }

      // Return the flashcards
      return validationResult.data.flashcards;
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

  /**
   * Generates random flashcard suggestions from a randomly selected topic.
   * This is used as a fallback when the OpenRouter API is not available.
   * @returns Array of 5-10 flashcard suggestions without temporary IDs
   */
  private generateMockFlashcards(): Omit<FlashcardSuggestion, "id">[] {
    // Get random topic
    const topics = Object.keys(this.topics);
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // Get random number of flashcards (between 5 and 10)
    const numberOfCards = Math.floor(Math.random() * 6) + 5;

    // Get random cards from selected topic
    const topicCards = this.topics[randomTopic as keyof typeof this.topics];
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
}
