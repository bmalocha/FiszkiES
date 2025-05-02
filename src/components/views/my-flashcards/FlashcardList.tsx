import React from "react";
import type { Flashcard } from "@/types";
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlashcardItem } from "./FlashcardItem"; // To be implemented
import { LoadMoreButton } from "./LoadMoreButton";

interface FlashcardListProps {
  flashcards: Flashcard[];
  onDeleteRequest: (id: string) => void;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function FlashcardList({
  flashcards,
  onDeleteRequest,
  canLoadMore,
  isLoadingMore,
  onLoadMore,
}: FlashcardListProps) {
  return (
    <>
      <Table data-testid="flashcards-table">
        <TableCaption>Lista Twoich fiszek.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%]">Polski</TableHead>
            <TableHead className="w-[20%]">Hiszpański</TableHead>
            <TableHead>Przykładowe zdanie</TableHead>
            <TableHead className="text-right w-[100px]">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-testid="flashcards-table-body">
          {flashcards.map((flashcard) => (
            <FlashcardItem
              key={flashcard.id}
              flashcard={flashcard}
              onDeleteRequest={onDeleteRequest}
              // Pass isDeleting prop if needed for item-specific state later
            />
          ))}
        </TableBody>
      </Table>
      {canLoadMore && (
        <LoadMoreButton
          onClick={onLoadMore}
          isLoading={isLoadingMore}
          isDisabled={!canLoadMore} // isDisabled is true if canLoadMore is false
          data-testid="load-more-button"
        />
      )}
    </>
  );
}
