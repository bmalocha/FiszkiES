import type { Tables, TablesInsert } from "./db/database.types";

// --- Base Entity Types ---

/** Represents a flashcard stored in the database. */
export type Flashcard = Tables<"flashcards">;

/** Represents an action log entry stored in the database. */
export type ActionLog = Tables<"action_logs">;

// --- API Plan Types ---

// --- Shared ---

/** Structure for pagination details in API responses. */
export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// --- Flashcards Resource (`/api/flashcards`) ---

/**
 * Response DTO for GET /api/flashcards.
 * Contains a paginated list of the user's flashcards.
 */
export interface GetFlashcardsResponseDto {
  data: Flashcard[];
  pagination: Pagination;
}

/**
 * Command for POST /api/flashcards.
 * Represents the data required to create a new flashcard.
 * The 'user_id' will be inferred from the authenticated session.
 */
export type CreateFlashcardCommand = Pick<
  TablesInsert<"flashcards">,
  "polish_word" | "spanish_word" | "example_sentence"
>;

/**
 * Response DTO for POST /api/flashcards.
 * Represents the newly created flashcard, excluding the user_id.
 */
export type CreateFlashcardResponseDto = Omit<Flashcard, "user_id">;

// DELETE /api/flashcards/{flashcardId} - No specific DTO/Command needed, uses URL parameter.

// --- Flashcard Generation Resource (`/api/generate`) ---

/**
 * Command for POST /api/generate.
 * Contains the text input for generating flashcard suggestions.
 */
export interface GenerateSuggestionsCommand {
  text: string;
}

/** Helper type for a single flashcard suggestion in the generation response. */
type BaseFlashcardSuggestion = Omit<Flashcard, "created_at" | "user_id" | "id">;

/** Represents a single flashcard suggestion returned by the generation endpoint. Includes a temporary frontend ID. */
export interface FlashcardSuggestion extends BaseFlashcardSuggestion {
  /** Temporary frontend ID for tracking before saving. */
  id: string;
}

/**
 * Response DTO for POST /api/generate.
 * Contains a list of generated flashcard suggestions.
 */
export interface GenerateSuggestionsResponseDto {
  suggestions: FlashcardSuggestion[];
}

// --- Repetition Session Resource (`/api/sessions`) ---

/** Represents a simplified flashcard structure used within a repetition session. */
export type SessionFlashcard = Pick<Flashcard, "id" | "polish_word" | "spanish_word" | "example_sentence">;

/**
 * Response DTO for POST /api/sessions/start.
 * Contains the details of the started session, including the selected cards.
 */
export interface StartSessionResponseDto {
  /** A unique identifier for the started session (can be transient). */
  sessionId: string;
  /** Array of flashcards selected for this session. */
  cards: SessionFlashcard[];
  /** The total number of cards included in this session. */
  totalCardsInSession: number;
}

/**
 * Command for POST /api/sessions/end.
 * Optionally includes the sessionId to mark a specific session as ended.
 */
export interface EndSessionCommand {
  /** The ID of the session being ended. */
  sessionId: string;
}

// --- Generate View UI Types ---

/** Status of processing a single suggestion in the UI */
export enum SuggestionStatus {
  PENDING = "pending", // Waiting for user action
  ADDING = "adding", // Add to database in progress
  ADDED = "added", // Successfully added to database
  REJECTING = "rejecting", // Rejection process (usually instant)
  REJECTED = "rejected", // Rejected by user
  ERROR = "error", // An error occurred during adding
  ALREADY_EXISTS = "already_exists", // Flashcard already exists (409 response)
}

/** ViewModel representing a suggestion along with its UI state */
export interface SuggestionViewModel {
  /** The original suggestion data from the API */
  suggestion: FlashcardSuggestion;
  /** The current processing status of this suggestion */
  status: SuggestionStatus;
  /** Error message specific to this suggestion (if status === ERROR) */
  errorMessage?: string | null;
}
