import React from "react";
import type { SuggestionViewModel, FlashcardSuggestion } from "@/types";
import SuggestionItem from "./SuggestionItem"; // Import SuggestionItem

interface SuggestionsListProps {
  suggestions: SuggestionViewModel[];
  onAccept: (suggestion: FlashcardSuggestion) => void;
  onReject: (suggestionId: string) => void;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({ suggestions, onAccept, onReject }) => {
  if (suggestions.length === 0) {
    return null; // Don't render anything if there are no suggestions
  }

  return (
    <div className="md:table md:w-full p-1" data-testid="suggestions-list-container">
      <p className="text-center text-sm text-muted-foreground mb-4 md:whitespace-nowrap">
        Propozycje fiszek wygenerowane z Twojego tekstu.
      </p>
      <div className="flex flex-col gap-4 md:table-row-group" data-testid="suggestions-list-body">
        {suggestions.map((viewModel) => (
          <SuggestionItem
            key={viewModel.suggestion.id}
            suggestion={viewModel}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
};

export default SuggestionsList;
