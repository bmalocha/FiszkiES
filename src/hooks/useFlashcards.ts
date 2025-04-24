import { useState, useEffect, useCallback } from "react";
import type { Flashcard, Pagination, GetFlashcardsResponseDto, ApiError } from "@/types";
import { log } from "@/lib/utils/logger";

const PAGE_SIZE = 20;

interface UseFlashcardsResult {
  flashcards: Flashcard[];
  pagination: Pagination | null;
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  isDeleting: boolean;
  error: ApiError | null;
  loadMoreFlashcards: () => Promise<void>;
  deleteFlashcard: (flashcardId: string) => Promise<void>;
  retryFetch: () => void; // Added for error handling
}

export function useFlashcards(): UseFlashcardsResult {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchFlashcards = useCallback(async (page: number, appending = false) => {
    setError(null); // Clear previous errors
    if (!appending) {
      setIsLoadingInitial(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetch(`/api/flashcards?page=${page}&pageSize=${PAGE_SIZE}`);
      if (!response.ok) {
        const errorData: ApiError = (await response.json().catch(() => ({
          message: "Failed to fetch flashcards",
          status: response.status,
        }))) || { message: "Failed to fetch flashcards", status: response.status };
        throw errorData;
      }
      const data: GetFlashcardsResponseDto = await response.json();

      setFlashcards((prev) => (appending ? [...prev, ...data.data] : data.data));
      setPagination(data.pagination);
      setCurrentPage(data.pagination.currentPage); // Ensure current page is synced with response
    } catch (err) {
      log(
        "error",
        "Error fetching flashcards",
        { page, appending },
        err instanceof Error ? err : new Error(String(err))
      );
      const apiError = err instanceof Error ? { message: err.message } : (err as ApiError);
      setError(apiError);
    } finally {
      if (!appending) {
        setIsLoadingInitial(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFlashcards(1, false);
  }, [fetchFlashcards]);

  const loadMoreFlashcards = useCallback(async () => {
    if (pagination && pagination.currentPage < pagination.totalPages && !isLoadingMore) {
      await fetchFlashcards(currentPage + 1, true);
    }
  }, [pagination, currentPage, isLoadingMore, fetchFlashcards]);

  const deleteFlashcard = useCallback(async (flashcardId: string) => {
    setError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Try to parse error, provide default if fails
        const errorData: ApiError = (await response.json().catch(() => ({
          message: `Failed to delete flashcard (status: ${response.status})`,
          status: response.status,
        }))) || { message: `Failed to delete flashcard (status: ${response.status})`, status: response.status };
        throw errorData;
      }

      // Success (204 No Content or similar)
      setFlashcards((prev) => prev.filter((fc) => fc.id !== flashcardId));
      setPagination((prev) =>
        prev
          ? {
              ...prev,
              totalItems: prev.totalItems - 1,
              // Recalculate totalPages, although it might get complex if removing last item on a page affects it
              // For simplicity, we might rely on the next GET request to fully correct pagination if needed
              totalPages: Math.ceil((prev.totalItems - 1) / prev.pageSize),
            }
          : null
      );
    } catch (err) {
      log("error", "Error deleting flashcard", { flashcardId }, err instanceof Error ? err : new Error(String(err)));
      const apiError = err instanceof Error ? { message: err.message } : (err as ApiError);
      setError(apiError);
      // Re-throw the error so the component knows deletion failed
      throw apiError;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const retryFetch = useCallback(() => {
    // Retry fetching the *first* page for now, can be made more sophisticated
    setError(null);
    setCurrentPage(1);
    setFlashcards([]); // Clear existing potentially partial data
    setPagination(null);
    fetchFlashcards(1, false);
  }, [fetchFlashcards]);

  return {
    flashcards,
    pagination,
    isLoadingInitial,
    isLoadingMore,
    isDeleting,
    error,
    loadMoreFlashcards,
    deleteFlashcard,
    retryFetch,
  };
}
