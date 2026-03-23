// =============================================================================
// Axiom Frontend — Flashcard Hooks
// =============================================================================

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  Flashcard,
  FlashcardWithMeta,
  CreateFlashcardInput,
  UpdateFlashcardInput,
} from "@/types/domain";
import {
  getFlashcards,
  getDueFlashcards,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
} from "@/services/flashcards.service";

export function useFlashcards(courseId?: string) {
  return useQuery<FlashcardWithMeta[]>({
    queryKey: ["flashcards", courseId],
    queryFn: () => getFlashcards(courseId),
  });
}

export function useDueFlashcards(courseId?: string) {
  return useQuery<FlashcardWithMeta[]>({
    queryKey: ["flashcards", "due", courseId],
    queryFn: () => getDueFlashcards(courseId),
  });
}

export function useCreateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation<Flashcard, Error, CreateFlashcardInput>({
    mutationFn: createFlashcard,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });
}

export function useUpdateFlashcard() {
  const queryClient = useQueryClient();

  return useMutation<Flashcard, Error, { id: string; input: UpdateFlashcardInput }>({
    mutationFn: ({ id, input }) => updateFlashcard(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteFlashcard,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });
}
