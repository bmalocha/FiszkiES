import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Import Badge for status display
import type { SuggestionViewModel, FlashcardSuggestion } from "@/types";
import { SuggestionStatus } from "@/types";

interface SuggestionItemProps {
  suggestion: SuggestionViewModel;
  onAccept: (suggestion: FlashcardSuggestion) => void;
  onReject: (suggestionId: string) => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ suggestion: viewModel, onAccept, onReject }) => {
  const { suggestion, status, errorMessage } = viewModel;

  const handleAccept = () => {
    onAccept(suggestion);
  };

  const handleReject = () => {
    onReject(suggestion.id);
  };

  const renderActions = () => {
    switch (status) {
      case SuggestionStatus.PENDING:
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleReject} data-testid={`reject-button-${suggestion.id}`}>
              Odrzuć
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleAccept}
              data-testid={`accept-button-${suggestion.id}`}
            >
              Dodaj
            </Button>
          </div>
        );
      case SuggestionStatus.ADDING:
        return <Badge variant="secondary">Dodawanie...</Badge>;
      case SuggestionStatus.ADDED:
        return <Badge variant="success">Dodano</Badge>; // Assuming a 'success' variant exists or can be added
      case SuggestionStatus.REJECTED:
        return <Badge variant="destructive">Odrzucono</Badge>;
      case SuggestionStatus.ALREADY_EXISTS:
        return <Badge variant="outline">Już istnieje</Badge>;
      case SuggestionStatus.ERROR:
        return (
          <div className="flex flex-col items-end gap-1 text-right">
            <Badge variant="destructive">Błąd</Badge>
            <span className="text-xs text-destructive">{errorMessage || "Nieznany błąd"}</span>
            {/* Optional: Add a retry button if applicable */}
            {/* <Button variant="outline" size="xs" onClick={handleAccept} className="mt-1">Spróbuj ponownie</Button> */}
          </div>
        );
      default:
        return null;
    }
  };

  // Determine if the row should visually indicate a non-pending state
  const isProcessed = status !== SuggestionStatus.PENDING && status !== SuggestionStatus.ADDING;
  const rowClass = isProcessed ? "opacity-60" : ""; // Example: Reduce opacity for processed items

  return (
    <TableRow className={rowClass} data-testid={`suggestion-item-${suggestion.id}`}>
      <TableCell className="font-medium" data-testid={`polish-word-${suggestion.id}`}>
        {suggestion.polish_word}
      </TableCell>
      <TableCell data-testid={`spanish-word-${suggestion.id}`}>{suggestion.spanish_word}</TableCell>
      <TableCell className="break-words whitespace-normal max-w-xs" data-testid={`example-sentence-${suggestion.id}`}>
        {suggestion.example_sentence}
      </TableCell>
      <TableCell className="text-right">{renderActions()}</TableCell>
    </TableRow>
  );
};

export default SuggestionItem;
