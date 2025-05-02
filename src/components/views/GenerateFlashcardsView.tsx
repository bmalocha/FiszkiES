import React from "react";
import { useGenerateFlashcards } from "@/components/hooks/useGenerateFlashcards";
import TextInputForm from "./TextInputForm"; // Use the actual component
import SuggestionsList from "./SuggestionsList"; // Use the actual component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { Loader2 } from "lucide-react"; // Import Loader icon

const GenerateFlashcardsView: React.FC = () => {
  const { suggestions, isLoading, error, generateSuggestions, acceptSuggestion, rejectSuggestion /* resetView */ } =
    useGenerateFlashcards(); // resetView might be used later

  return (
    <div className="flex flex-col gap-6" data-testid="generate-view">
      <TextInputForm onSubmit={generateSuggestions} isGenerating={isLoading} />
      {/* <div>TextInputForm Placeholder</div> */} {/* Removed placeholder */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Błąd!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {suggestions.length > 0 && !isLoading && (
        <SuggestionsList suggestions={suggestions} onAccept={acceptSuggestion} onReject={rejectSuggestion} />
      )}
      {/* Optional: Button to reset the view manually? */}
      {/* {suggestions.length > 0 && <button onClick={resetView}>Wyczyść</button>} */}
    </div>
  );
};

export default GenerateFlashcardsView;
