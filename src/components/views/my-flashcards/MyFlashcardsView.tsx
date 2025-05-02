import React, { useState, useCallback } from "react";
import { useFlashcards } from "@/hooks/useFlashcards";
// Import placeholder components - we will create them later
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";
import { EmptyState } from "./EmptyState";
import { FlashcardList } from "./FlashcardList";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { log } from "@/lib/utils/logger";

export function MyFlashcardsView() {
  const {
    flashcards,
    pagination,
    isLoadingInitial,
    isLoadingMore,
    isDeleting,
    error,
    loadMoreFlashcards,
    deleteFlashcard,
    retryFetch,
  } = useFlashcards();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flashcardIdToDelete, setFlashcardIdToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteRequest = useCallback((id: string) => {
    setFlashcardIdToDelete(id);
    setDeleteError(null); // Clear previous delete error
    setIsModalOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setIsModalOpen(false);
    setFlashcardIdToDelete(null);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!flashcardIdToDelete) return;

    setDeleteError(null);
    try {
      await deleteFlashcard(flashcardIdToDelete);
      setIsModalOpen(false);
      setFlashcardIdToDelete(null);
    } catch (err) {
      log("error", "Failed to delete flashcard from view", {}, err instanceof Error ? err : new Error(String(err)));
      // Ensure err is treated as ApiError or create a fallback
      const errorMessage =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Nie udało się usunąć fiszki. Spróbuj ponownie.";
      // Set specific error message for the modal
      setDeleteError(errorMessage);
      // Don't close the modal on error, let the user see the message
    }
  }, [flashcardIdToDelete, deleteFlashcard]);

  // Determine if "Load More" should be possible
  const canLoadMore = pagination ? pagination.currentPage < pagination.totalPages : false;

  // --- Render Logic ---

  if (isLoadingInitial) {
    return <LoadingSpinner />; // Placeholder
  }

  if (error && !flashcards.length) {
    // Show main error view only if there's an error and no flashcards loaded at all
    return <ErrorMessage message={error.message || "Wystąpił błąd podczas ładowania fiszek."} onRetry={retryFetch} />; // Placeholder
  }

  if (flashcards.length === 0) {
    return <EmptyState />; // Placeholder
  }

  // Main content - Flashcard List
  return (
    <div className="container mx-auto p-4" data-testid="my-flashcards-view">
      <h1 className="text-2xl font-bold mb-4">Moje Fiszki</h1>

      {/* Optional: Display non-blocking fetch errors here if needed */}
      {/* {error && <div className="text-red-500">Error: {error.message}</div>} */}

      <FlashcardList
        flashcards={flashcards}
        onDeleteRequest={handleDeleteRequest}
        // Pass isDeleting state keyed by ID if needed for item-specific loading
        // isDeletingById={/* logic based on isDeleting and flashcardIdToDelete */}
        // For now, modal handles global deleting state

        // Load More functionality
        canLoadMore={canLoadMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMoreFlashcards}
      />

      {/* Modal for Delete Confirmation */}
      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isPending={isDeleting} // Use the global deleting flag from the hook
        errorMessage={deleteError} // Pass delete error to the modal
      />
    </div>
  );
}
