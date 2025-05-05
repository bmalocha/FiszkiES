import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  const itemClass = isProcessed ? "opacity-60" : "";

  return (
    <div className={`${itemClass} md:table-row`} data-testid={`suggestion-item-${suggestion.id}`}>
      {/* Mobile Card View (Default) */}
      <div className="md:hidden p-1">
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg">{suggestion.polish_word}</CardTitle>
            <p className="text-md text-muted-foreground">{suggestion.spanish_word}</p>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground">Przykład:</p>
            <p className="text-sm break-words whitespace-normal">{suggestion.example_sentence}</p>
          </CardContent>
          <CardFooter className="flex justify-end pt-0 pb-3 px-4">{renderActions()}</CardFooter>
        </Card>
      </div>

      {/* Desktop Table Cell View (md and up) */}
      <div
        className="hidden md:table-cell align-middle font-medium md:w-[30%] px-4 py-2"
        data-testid={`polish-word-${suggestion.id}`}
      >
        {suggestion.polish_word}
      </div>
      <div
        className="hidden md:table-cell align-middle md:w-[30%] px-4 py-2"
        data-testid={`spanish-word-${suggestion.id}`}
      >
        {suggestion.spanish_word}
      </div>
      <div
        className="hidden md:table-cell align-middle break-words whitespace-normal md:w-[30%] px-4 py-2"
        data-testid={`example-sentence-${suggestion.id}`}
      >
        {suggestion.example_sentence}
      </div>
      <div className="hidden md:table-cell align-middle text-right md:w-[10%] px-4 py-2">{renderActions()}</div>
    </div>
  );
};

export default SuggestionItem;
