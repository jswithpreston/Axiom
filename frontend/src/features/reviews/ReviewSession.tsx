"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { useDueFlashcards } from "@/hooks/useFlashcards";
import { useSubmitReview } from "@/hooks/useReviews";
import { useStudyStore } from "@/store/useStudyStore";
import type { FlashcardWithMeta, ReviewSubmission } from "@/types/domain";

// ---------------------------------------------------------------------------
// Quality rating configuration
// ---------------------------------------------------------------------------

interface QualityOption {
  readonly quality: ReviewSubmission["quality"];
  readonly label: string;
  readonly className: string;
}

const QUALITY_OPTIONS: readonly QualityOption[] = [
  {
    quality: 0,
    label: "Blackout",
    className:
      "bg-red-600/20 text-red-400 border-red-600/40 hover:bg-red-600/30",
  },
  {
    quality: 1,
    label: "Incorrect",
    className:
      "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25",
  },
  {
    quality: 2,
    label: "Hard",
    className:
      "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25",
  },
  {
    quality: 3,
    label: "Correct",
    className:
      "bg-gray-500/15 text-gray-300 border-gray-500/30 hover:bg-gray-500/25",
  },
  {
    quality: 4,
    label: "Easy",
    className:
      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25",
  },
  {
    quality: 5,
    label: "Perfect",
    className:
      "bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30",
  },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewSessionProps {
  readonly courseId?: string | undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReviewSession({ courseId }: ReviewSessionProps) {
  const { data: dueFlashcards, isLoading } = useDueFlashcards(courseId);
  const submitReview = useSubmitReview();

  const {
    reviewQueue,
    currentReviewIndex,
    setReviewQueue,
    advanceReview,
    resetReview,
  } = useStudyStore();

  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [cardsReviewed, setCardsReviewed] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Build a lookup map for quick access
  const [flashcardMap, setFlashcardMap] = useState<
    ReadonlyMap<string, FlashcardWithMeta>
  >(new Map());

  // Initialize review queue when due flashcards load
  useEffect(() => {
    if (dueFlashcards && dueFlashcards.length > 0) {
      const ids = dueFlashcards.map((fc) => fc.id);
      setReviewQueue(ids);
      setFlashcardMap(new Map(dueFlashcards.map((fc) => [fc.id, fc])));
      setCardsReviewed(0);
      setIsComplete(false);
      setIsAnswerRevealed(false);
    }
  }, [dueFlashcards, setReviewQueue]);

  // Current card
  const currentCardId = reviewQueue[currentReviewIndex] as string | undefined;
  const currentCard = currentCardId
    ? flashcardMap.get(currentCardId)
    : undefined;

  const totalCards = reviewQueue.length;

  const handleReveal = useCallback(() => {
    setIsAnswerRevealed(true);
  }, []);

  const handleRate = useCallback(
    (quality: ReviewSubmission["quality"]) => {
      if (!currentCardId) return;

      submitReview.mutate(
        { flashcardId: currentCardId, quality },
        {
          onSuccess: () => {
            const reviewed = cardsReviewed + 1;
            setCardsReviewed(reviewed);
            setIsAnswerRevealed(false);

            if (currentReviewIndex + 1 >= totalCards) {
              setIsComplete(true);
            } else {
              advanceReview();
            }
          },
        }
      );
    },
    [
      currentCardId,
      cardsReviewed,
      currentReviewIndex,
      totalCards,
      submitReview,
      advanceReview,
    ]
  );

  // Reset on unmount
  useEffect(() => {
    return () => {
      resetReview();
    };
  }, [resetReview]);

  // ---- Loading state ------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-axiom-muted">Loading due flashcards...</p>
      </div>
    );
  }

  // ---- No cards due -------------------------------------------------------
  if (!dueFlashcards || dueFlashcards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-axiom-text">No cards due for review.</p>
        <p className="text-xs text-axiom-muted">
          All caught up! Check back later.
        </p>
        <Link
          href="/dashboard"
          className="text-sm text-axiom-accent hover:underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // ---- Complete -----------------------------------------------------------
  if (isComplete) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Card className="w-full max-w-md text-center">
          <h3 className="text-lg font-semibold text-axiom-text">
            Session Complete
          </h3>
          <p className="mt-2 text-sm text-axiom-muted">
            You reviewed{" "}
            <span className="font-medium text-axiom-text">{cardsReviewed}</span>{" "}
            card{cardsReviewed !== 1 ? "s" : ""}.
          </p>
        </Card>
        <Link
          href="/dashboard"
          className="text-sm text-axiom-accent hover:underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // ---- Reviewing ----------------------------------------------------------
  if (!currentCard) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-axiom-muted">
          Something went wrong. No card available.
        </p>
      </div>
    );
  }

  const progress = totalCards > 0 ? (currentReviewIndex + 1) / totalCards : 0;

  return (
    <div className="flex flex-1 flex-col items-center gap-6">
      {/* Progress */}
      <div className="w-full max-w-2xl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-axiom-muted">
            Card {currentReviewIndex + 1} of {totalCards}
          </span>
          <span className="text-xs text-axiom-muted">
            {currentCard.courseName}
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Question card */}
      <Card className="w-full max-w-2xl">
        <h3 className="mb-1 text-xs uppercase tracking-wider text-axiom-muted">
          Question
        </h3>
        <p className="text-base text-axiom-text">{currentCard.question}</p>
      </Card>

      {/* Reveal / Answer */}
      {!isAnswerRevealed ? (
        <Button variant="primary" size="lg" onClick={handleReveal}>
          Reveal Answer
        </Button>
      ) : (
        <>
          <Card className="w-full max-w-2xl">
            <h3 className="mb-1 text-xs uppercase tracking-wider text-axiom-muted">
              Answer
            </h3>
            <p className="text-base text-axiom-text">{currentCard.answer}</p>
          </Card>

          {/* Quality rating buttons */}
          <div className="w-full max-w-2xl">
            <p className="mb-3 text-center text-xs text-axiom-muted">
              How well did you know this?
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.quality}
                  type="button"
                  onClick={() => handleRate(opt.quality)}
                  disabled={submitReview.isPending}
                  className={`flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${opt.className}`}
                >
                  <span className="text-base font-bold">{opt.quality}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
