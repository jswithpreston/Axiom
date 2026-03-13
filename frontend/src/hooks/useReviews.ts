// =============================================================================
// Axiom Frontend — Review Hooks
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Flashcard, ReviewSubmission } from "@/types/domain";
import { submitReview } from "@/services/reviews.service";

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation<Flashcard, Error, ReviewSubmission>({
    mutationFn: submitReview,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["flashcards"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["study-plan"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
    },
  });
}
