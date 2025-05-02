import React from "react";
import type { Flashcard } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react"; // Icon for delete button

interface FlashcardItemProps {
  flashcard: Flashcard;
  onDeleteRequest: (id: string) => void;
  // isDeleting?: boolean; // Optional prop for item-specific loading state (not used yet)
}

export function FlashcardItem({
  flashcard,
  onDeleteRequest,
}: // isDeleting,
FlashcardItemProps) {
  const handleDeleteClick = () => {
    onDeleteRequest(flashcard.id);
  };

  return (
    <TableRow key={flashcard.id} data-testid={`flashcard-item-${flashcard.id}`}>
      <TableCell className="font-medium" data-testid={`polish-word-${flashcard.id}`}>
        {flashcard.polish_word}
      </TableCell>
      <TableCell data-testid={`spanish-word-${flashcard.id}`}>{flashcard.spanish_word}</TableCell>
      <TableCell className="whitespace-normal" data-testid={`example-sentence-${flashcard.id}`}>
        {flashcard.example_sentence}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="destructive"
          size="icon"
          onClick={handleDeleteClick}
          // disabled={isDeleting} // Disable button if this specific item is being deleted
          aria-label={`Usuń fiszkę ${flashcard.polish_word}`}
          data-testid={`delete-button-${flashcard.id}`}
        >
          {/* {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} */}
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
