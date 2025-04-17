# REST API Plan

## 1. Resources

-   **Flashcards**: Represents individual flashcards created by users. Corresponds to the `public.flashcards` table.
-   **Flashcard Generation**: Represents the process of generating flashcard suggestions from text. Not directly mapped to a single table, involves AI interaction and potential creation of `flashcards` and `action_logs` entries.
-   **Repetition Session**: Represents a user's practice session with their flashcards. Primarily interacts with the `flashcards` table and logs actions in `action_logs`.

## 2. Endpoints

### Flashcards Resource (`/api/flashcards`)

1.  **Get User's Flashcards**
    -   **Method**: `GET`
    -   **Path**: `/api/flashcards`
    -   **Description**: Retrieves all flashcards belonging to the authenticated user. Supports pagination and potentially filtering/sorting in the future.
    -   **Query Parameters**:
        -   `page` (optional, integer, default=1): Page number for pagination.
        -   `pageSize` (optional, integer, default=20): Number of items per page.
        -   `sortBy` (optional, string, e.g., `created_at`): Field to sort by.
        -   `sortOrder` (optional, string, `asc` or `desc`, default=`desc`): Sort order.
    -   **Request Payload**: None
    -   **Response Payload**:
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "polish_word": "string",
              "spanish_word": "string",
              "example_sentence": "string",
              "created_at": "timestamp"
            }
            // ... more flashcards
          ],
          "pagination": {
            "currentPage": 1,
            "pageSize": 20,
            "totalItems": 150,
            "totalPages": 8
          }
        }
        ```
    -   **Success Codes**: `200 OK`
    -   **Error Codes**: `401 Unauthorized`, `500 Internal Server Error`

2.  **Delete a Flashcard**
    -   **Method**: `DELETE`
    -   **Path**: `/api/flashcards/{flashcardId}`
    -   **Description**: Deletes a specific flashcard belonging to the authenticated user. Logs the `DELETE` action.
    -   **URL Parameters**:
        -   `flashcardId` (uuid): The ID of the flashcard to delete.
    -   **Request Payload**: None
    -   **Response Payload**: None
    -   **Success Codes**: `204 No Content`
    -   **Error Codes**: `401 Unauthorized`, `403 Forbidden` (if user tries to delete another user's flashcard - handled by RLS but good practice for API layer too), `404 Not Found`, `500 Internal Server Error`

### Flashcard Generation Resource (`/api/generate`)

1.  **Generate Flashcard Suggestions**
    -   **Method**: `POST`
    -   **Path**: `/api/generate`
    -   **Description**: Takes user-provided text, sends it to the AI service to generate flashcard suggestions (6-12), deduplicates results, and returns the suggestions. Logs the `GENERATE` action with input text length and number of suggestions generated.
    -   **Request Payload**:
        ```json
        {
          "text": "string" // Max 10000 characters
        }
        ```
    -   **Response Payload**:
        ```json
        {
          "suggestions": [
            {
              "id": "temp_uuid", // Temporary frontend ID for tracking
              "polish_word": "string",
              "spanish_word": "string",
              "example_sentence": "string"
            }
            // ... 5 to 11 more suggestions
          ]
        }
        ```
    -   **Success Codes**: `200 OK`
    -   **Error Codes**: `400 Bad Request` (e.g., text too long, invalid format), `401 Unauthorized`, `500 Internal Server Error`

2.  **Accept Flashcard Suggestion**
    -   **Method**: `POST`
    -   **Path**: `/api/flashcards`
    -   **Description**: Accepts a specific flashcard suggestion generated previously and saves it to the user's collection. Logs the `ADD` action with the related flashcard ID. This reuses the Flashcards resource endpoint but specifically handles adding *new* cards originating from suggestions.
    -   **Request Payload**:
        ```json
        {
          "polish_word": "string", // Max 100 chars
          "spanish_word": "string", // Max 100 chars
          "example_sentence": "string" // Max 300 chars
        }
        ```
    -   **Response Payload**:
        ```json
        {
          "id": "uuid", // ID of the newly created flashcard
          "polish_word": "string",
          "spanish_word": "string",
          "example_sentence": "string",
          "created_at": "timestamp"
        }
        ```
    -   **Success Codes**: `201 Created`
    -   **Error Codes**: `400 Bad Request` (Validation errors: missing fields, length limits, `unique_flashcard_content_for_user` constraint violation), `401 Unauthorized`, `500 Internal Server Error`

### Repetition Session Resource (`/api/sessions`)

1.  **Start Repetition Session**
    -   **Method**: `POST`
    -   **Path**: `/api/sessions/start`
    -   **Description**: Initiates a new repetition session for the user. Selects up to 20 random flashcards from the user's collection. Logs the `START_SESSION` action with the number of cards in the session. Returns the session details including the cards.
    -   **Request Payload**: None
    -   **Response Payload**:
        ```json
        {
          "sessionId": "uuid", // Generated session ID (can be transient/in-memory or persisted if needed later)
          "cards": [
            {
              "id": "uuid",
              "polish_word": "string",
              "spanish_word": "string",
              "example_sentence": "string"
            }
            // ... up to 19 more cards
          ],
          "totalCardsInSession": 20 // or less if user has fewer cards
        }
        ```
    -   **Success Codes**: `200 OK`
    -   **Error Codes**: `401 Unauthorized`, `500 Internal Server Error`

2.  **End Repetition Session**
    -   **Method**: `POST`
    -   **Path**: `/api/sessions/end`
    -   **Description**: Marks the completion of a repetition session (could be called explicitly by the frontend or implicitly after the last card). Logs the `END_SESSION` action.
    -   **Request Payload**:
        ```json
        {
          "sessionId": "uuid" // ID from the start response if needed for tracking
        }
        ```
    -   **Response Payload**: None
    -   **Success Codes**: `204 No Content`
    -   **Error Codes**: `401 Unauthorized`, `400 Bad Request` (e.g., invalid sessionId if provided), `500 Internal Server Error`

## 3. Authentication and Authorization

-   **Mechanism**: Supabase Auth (JWT-based). The frontend client will obtain a JWT upon user login/signup via Supabase's client library.
-   **Implementation**:
    -   All API requests (except potentially auth endpoints handled by Supabase directly) must include the JWT in the `Authorization: Bearer <token>` header.
    -   The Astro backend middleware (`src/middleware/index.ts`) will intercept requests, validate the JWT using Supabase's server-side SDK, and extract the `user_id`.
    -   The `user_id` will be attached to the request context (`Astro.locals`) for use in API route handlers.
    -   Authorization is primarily handled by PostgreSQL Row-Level Security (RLS) policies defined in the database schema (`db-plan.md`). These policies ensure users can only access/modify their own `flashcards`. API logic should redundantly check ownership where critical, especially before database operations.
    -   The `action_logs` table does not have RLS in MVP; access control (if needed) would be at the API level or through dedicated roles, but no direct API endpoints are planned for manipulating logs in MVP.

## 4. Validation and Business Logic

-   **General Validation**: Input validation (data types, required fields, length limits) will be performed at the API route level before interacting with the database or external services. Libraries like Zod can be used for schema validation.
-   **Flashcards Resource**:
    -   `POST /api/flashcards`: Validates `polish_word` (max 100), `spanish_word` (max 100), `example_sentence` (max 300). Enforces `unique_flashcard_content_for_user` constraint (handled by DB, but API should return a meaningful `409 Conflict` error).
    -   `DELETE /api/flashcards/{flashcardId}`: Validates `flashcardId` format (UUID). Relies on RLS for authorization. Logs `DELETE` action via `action_logs` service.
-   **Flashcard Generation Resource**:
    -   `POST /api/generate`: Validates `text` length (max 10000). Handles interaction with the AI service (Openrouter.ai). Implements deduplication logic for generated suggestions *within the same response*. Logs `GENERATE` action via `action_logs` service, including `input_text_length` and `cards_count` (number of suggestions).
-   **Repetition Session Resource**:
    -   `POST /api/sessions/start`: Fetches random flashcards (up to 20) belonging *only* to the authenticated user (enforced by RLS/API query). Logs `START_SESSION` action via `action_logs` service, including `cards_count` (number of cards in session).
    -   `POST /api/sessions/end`: Logs `END_SESSION` action via `action_logs` service.
-   **Action Logging**: A dedicated internal service/helper (`src/lib/logAction.ts` or similar) will be used by relevant API endpoints (`POST /api/flashcards`, `DELETE /api/flashcards/*`, `POST /api/generate`, `POST /api/sessions/start`, `POST /api/sessions/end`) to insert records into the `action_logs` table. This service will encapsulate the logic for creating log entries with the correct `action_type`, `user_id`, and relevant metadata (`related_flashcard_id`, `input_text_length`, `cards_count`). 