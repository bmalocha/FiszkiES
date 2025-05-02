import React from "react";
import type { SuggestionViewModel, FlashcardSuggestion } from "@/types";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <Table data-testid="suggestions-table">
      <TableCaption>Propozycje fiszek wygenerowane z Twojego tekstu.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[25%]">Polski</TableHead>
          <TableHead className="w-[25%]">Hiszpański</TableHead>
          <TableHead className="w-[35%]">Zdanie przykładowe</TableHead>
          <TableHead className="text-right w-[15%]">Akcje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody data-testid="suggestions-table-body">
        {suggestions.map((viewModel) => (
          <SuggestionItem
            key={viewModel.suggestion.id} // Use the unique frontend ID as key
            suggestion={viewModel}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default SuggestionsList;
