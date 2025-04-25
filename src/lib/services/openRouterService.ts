import { z } from "zod";
import { log } from "../utils/logger";

// Define Zod schemas for validation
const ModelParamsSchema = z.object({
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
});

// Message schema for chat completions
const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

// JSON Schema format for structured responses
const JsonSchemaFormatSchema = z.object({
  type: z.literal("json_schema"),
  json_schema: z.object({
    name: z.string(),
    strict: z.boolean(),
    schema: z.record(z.any()),
  }),
});

// Options for chat completion requests
const ChatCompletionOptionsSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema).min(1),
  response_format: JsonSchemaFormatSchema.optional(),
  params: ModelParamsSchema.optional(),
});

// Types derived from schemas
export type ModelParams = z.infer<typeof ModelParamsSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type JsonSchemaFormat = z.infer<typeof JsonSchemaFormatSchema>["json_schema"];
export type ChatCompletionOptions = z.infer<typeof ChatCompletionOptionsSchema>;

/**
 * Response choice from OpenRouter API
 */
export interface ChatCompletionChoice {
  message: Message;
  finish_reason: string;
  index: number;
}

/**
 * Response structure from OpenRouter API
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Service for interacting with the OpenRouter API to generate responses from language models.
 */
export class OpenRouterService {
  private apiKey: string;
  private openRouterApiUrl = "https://openrouter.ai/api/v1/chat/completions";

  /**
   * Creates a new instance of the OpenRouterService.
   * @param apiKey The OpenRouter API key
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      log("error", "OpenRouter API key is required.");
      throw new Error("OpenRouter API key is required.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Generates a chat completion using the OpenRouter API.
   * @param options Configuration options for the chat completion request
   * @returns A promise that resolves to the API response
   */
  public async generateChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    try {
      // Validate options with Zod
      const validationResult = ChatCompletionOptionsSchema.safeParse(options);

      if (!validationResult.success) {
        const errorMessage = "Invalid options provided to generateChatCompletion";
        log("error", errorMessage, { errors: validationResult.error.format() });
        throw new Error(errorMessage);
      }

      // Prepare request body
      const requestBody = {
        model: options.model,
        messages: options.messages,
        ...(options.response_format && { response_format: options.response_format }),
        ...(options.params && options.params),
      };

      // Send request to OpenRouter API
      const response = await fetch(this.openRouterApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle HTTP errors
      if (!response.ok) {
        await this.handleApiError(response);
      }

      // Parse response
      const data = await response.json();

      // Validate response JSON if using json_schema
      if (options.response_format?.type === "json_schema") {
        try {
          const assistantMessageContent = data.choices[0]?.message?.content;
          if (assistantMessageContent) {
            // Just parse to verify valid JSON - we're not using the result directly
            JSON.parse(assistantMessageContent);
            // Additional validation could be added here if needed
          }
        } catch (parseError) {
          log(
            "error",
            "Failed to parse JSON response from model",
            {},
            parseError instanceof Error ? parseError : new Error(String(parseError))
          );
          throw new Error("Failed to parse JSON response from model");
        }
      }

      return data;
    } catch (error) {
      // Log the error with context
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("error", "Error in generateChatCompletion", { errorMessage });
      throw error;
    }
  }

  /**
   * Handles API errors from OpenRouter
   * @param response The fetch Response object
   */
  private async handleApiError(response: Response): Promise<never> {
    // Define a more specific type for OpenRouter error responses
    interface OpenRouterErrorResponse {
      error?: {
        message?: string;
        type?: string;
        param?: string;
        code?: string;
      };
    }

    let errorData: OpenRouterErrorResponse = {};

    try {
      errorData = (await response.json()) as OpenRouterErrorResponse;
    } catch {
      // Failed to parse error response as JSON
    }

    const statusText = response.statusText || "Unknown error";
    const errorMessage = errorData.error?.message || statusText;

    // Convert to Record<string, unknown> for logger compatibility
    const logContext = errorData as unknown as Record<string, unknown>;
    log("error", `OpenRouter API error: ${response.status} ${statusText}`, logContext);

    // Handle specific error types
    switch (response.status) {
      case 401:
        throw new Error("Authentication failed: Invalid or missing API key");
      case 402:
        throw new Error("Payment required: Check your OpenRouter account billing");
      case 403:
        throw new Error("Forbidden: You don't have access to this model or feature");
      case 429:
        throw new Error("Rate limit exceeded: Too many requests, please try again later");
      case 500:
      case 502:
      case 503:
      case 504:
        throw new Error(`Server error: ${errorMessage}`);
      default:
        throw new Error(`OpenRouter API error: ${response.status} ${errorMessage}`);
    }
  }
}
