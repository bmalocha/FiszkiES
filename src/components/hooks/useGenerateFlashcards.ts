import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner"; // Import toast
import type {
  FlashcardSuggestion,
  SuggestionViewModel,
  GenerateSuggestionsCommand,
  GenerateSuggestionsResponseDto,
  CreateFlashcardCommand,
  // CreateFlashcardResponseDto // Not used currently, but might be useful later
} from "@/types";
import { SuggestionStatus } from "@/types";
import { log } from "@/lib/utils/logger"; // Import the custom logger

export function useGenerateFlashcards() {
  const [suggestions, setSuggestions] = useState<SuggestionViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = useCallback(async (text: string) => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]); // Clear previous suggestions

    try {
      const command: GenerateSuggestionsCommand = { text };
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized (e.g., redirect to login)
          // For now, just set a generic error
          throw new Error("Nieautoryzowany dostęp. Zaloguj się.");
        }
        const errorData = await response.json().catch(() => ({})); // Try to parse error response
        throw new Error(errorData.message || `Błąd serwera (${response.status})`);
      }

      const data: GenerateSuggestionsResponseDto = await response.json();

      // Map API response to ViewModel with PENDING status and unique IDs
      const viewModels: SuggestionViewModel[] = data.suggestions.map((suggestion) => ({
        suggestion: { ...suggestion, id: uuidv4() }, // Ensure a unique frontend ID
        status: SuggestionStatus.PENDING,
        errorMessage: null,
      }));
      setSuggestions(viewModels);
    } catch (err) {
      const errorToLog = err instanceof Error ? err : new Error(String(err));
      log("error", "Error generating suggestions", { command: { textLength: text.length } }, errorToLog);
      setError(errorToLog.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptSuggestion = useCallback(async (suggestionData: FlashcardSuggestion) => {
    setSuggestions((prev) =>
      prev.map((vm) =>
        vm.suggestion.id === suggestionData.id ? { ...vm, status: SuggestionStatus.ADDING, errorMessage: null } : vm
      )
    );

    const command: CreateFlashcardCommand = {
      polish_word: suggestionData.polish_word,
      spanish_word: suggestionData.spanish_word,
      example_sentence: suggestionData.example_sentence,
    };

    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (response.status === 201) {
        setSuggestions((prev) =>
          prev.map((vm) => (vm.suggestion.id === suggestionData.id ? { ...vm, status: SuggestionStatus.ADDED } : vm))
        );
        toast.success(`Dodano fiszkę: "${suggestionData.polish_word}" / "${suggestionData.spanish_word}"`);
      } else if (response.status === 409) {
        setSuggestions((prev) =>
          prev.map((vm) =>
            vm.suggestion.id === suggestionData.id
              ? {
                  ...vm,
                  status: SuggestionStatus.ALREADY_EXISTS,
                  errorMessage: "Fiszka już istnieje w Twojej kolekcji.",
                }
              : vm
          )
        );
        toast.info(`Fiszka "${suggestionData.polish_word}" już istnieje.`);
      } else {
        // Other errors
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Nie udało się dodać fiszki (${response.status}).`;
        setSuggestions((prev) =>
          prev.map((vm) =>
            vm.suggestion.id === suggestionData.id
              ? { ...vm, status: SuggestionStatus.ERROR, errorMessage: message }
              : vm
          )
        );
        log(
          "error",
          "Error adding flashcard (API)",
          { command, responseStatus: response.status, errorData },
          new Error(message)
        );
        toast.error(`Błąd podczas dodawania fiszki: ${message}`);
      }
    } catch (err) {
      const errorToLog = err instanceof Error ? err : new Error(String(err));
      const message = errorToLog.message;
      setSuggestions((prev) =>
        prev.map((vm) =>
          vm.suggestion.id === suggestionData.id ? { ...vm, status: SuggestionStatus.ERROR, errorMessage: message } : vm
        )
      );
      log("error", "Network or unexpected error adding flashcard", { command }, errorToLog);
      toast.error(`Błąd sieci lub nieoczekiwany: ${message}`);
    }
  }, []);

  const rejectSuggestion = useCallback((suggestionId: string) => {
    // Find the suggestion first to show its content in the toast
    let rejectedSuggestionWord = "";
    setSuggestions((prev) =>
      prev.map((vm) => {
        if (vm.suggestion.id === suggestionId) {
          rejectedSuggestionWord = vm.suggestion.polish_word;
          return { ...vm, status: SuggestionStatus.REJECTED };
        }
        return vm;
      })
    );
    if (rejectedSuggestionWord) {
      toast.warning(`Odrzucono sugestię: "${rejectedSuggestionWord}"`);
    }
  }, []);

  const resetView = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    generateSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    resetView,
  };
}
