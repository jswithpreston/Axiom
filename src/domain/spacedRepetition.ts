// =============================================================================
// Axiom Study Engine — Spaced Repetition Engine (SM-2 Variant)
// =============================================================================
//
// Implements a pure, deterministic variant of the SuperMemo SM-2 algorithm.
//
// SM-2 overview (Wozniak, 1990):
//   After each review, the student assigns a quality grade q ∈ [0, 5].
//   The algorithm adjusts three scheduling parameters:
//
//   1. Repetition counter (n):
//      - If q < 3 the card is "failed" → n resets to 0.
//      - Otherwise n increments by 1.
//
//   2. Inter-repetition interval (I):
//      - n = 1  → I = 1 day
//      - n = 2  → I = 6 days
//      - n > 2  → I = round(I_prev × EF)
//
//   3. Ease Factor (EF):
//      EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
//      EF is floored at 1.3 to prevent intervals from collapsing.
//
// Design decisions:
//   - The function is pure: it takes a flashcard + review data and returns
//     a *new* Flashcard. The input is never mutated.
//   - All date arithmetic uses plain UTC millisecond math (no library needed).
//   - Negative intervals are structurally impossible because every code path
//     produces a positive value, but we assert anyway for defense-in-depth.
// =============================================================================

import type { Flashcard } from "./types.js";

/** Number of milliseconds in one day. */
const MS_PER_DAY = 86_400_000;

/** Minimum allowed ease factor per SM-2 specification. */
const MIN_EASE_FACTOR = 1.3;

/**
 * Add `days` calendar days to a `Date`, returning a new `Date`.
 * Pure — does not modify the input.
 */
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Compute the updated ease factor after a review.
 *
 * Formula (SM-2):
 *   EF' = EF + (0.1 − (5 − q) × (0.08 + (5 − q) × 0.02))
 *
 * The result is floored at 1.3 so that intervals never shrink to zero.
 */
function computeEaseFactor(currentEF: number, quality: number): number {
  const delta = 5 - quality;
  const newEF = currentEF + (0.1 - delta * (0.08 + delta * 0.02));
  return Math.max(MIN_EASE_FACTOR, newEF);
}

/**
 * Compute the next inter-repetition interval in days.
 *
 * @param repetition   — the *new* repetition count (already incremented)
 * @param previousInterval — the card's interval before this review
 * @param easeFactor   — the *updated* ease factor
 * @returns positive integer interval in days
 */
function computeInterval(
  repetition: number,
  previousInterval: number,
  easeFactor: number,
): number {
  if (repetition <= 1) return 1;
  if (repetition === 2) return 6;
  // For repetition > 2, grow the previous interval by the ease factor.
  return Math.round(previousInterval * easeFactor);
}

/**
 * Review a flashcard and produce a new flashcard with updated SM-2 state.
 *
 * This is the core public function of the spaced repetition engine.
 * It is **pure**: the input `flashcard` is never mutated; a fresh object
 * is returned with the new scheduling parameters.
 *
 * @param flashcard  — current state of the card
 * @param quality    — student's self-assessed recall quality, integer in [0, 5]
 * @param reviewDate — the exact timestamp of this review
 * @returns a new `Flashcard` with updated repetition, interval, easeFactor,
 *          nextReviewDate, and lastReviewedAt
 *
 * @throws {RangeError} if `quality` is outside [0, 5] or not an integer
 */
export function reviewFlashcard(
  flashcard: Flashcard,
  quality: number,
  reviewDate: Date,
): Flashcard {
  // ── Input validation ────────────────────────────────────────────────
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new RangeError(
      `Quality must be an integer between 0 and 5 inclusive, received: ${String(quality)}`,
    );
  }

  // ── Ease factor update (always applied, even on failure) ────────────
  const newEaseFactor = computeEaseFactor(flashcard.easeFactor, quality);

  // ── Repetition & interval logic ─────────────────────────────────────
  let newRepetition: number;
  let newInterval: number;

  if (quality < 3) {
    // Failed recall — reset the learning streak.
    newRepetition = 0;
    newInterval = 1;
  } else {
    // Successful recall — advance the streak.
    newRepetition = flashcard.repetition + 1;
    newInterval = computeInterval(
      newRepetition,
      flashcard.interval,
      newEaseFactor,
    );
  }

  // Defense-in-depth: intervals must always be positive.
  // This is structurally guaranteed by the code paths above, but we
  // assert explicitly so any future refactors cannot introduce a bug.
  if (newInterval < 1) {
    newInterval = 1;
  }

  // ── Compute next review date ────────────────────────────────────────
  const nextReviewDate = addDays(reviewDate, newInterval);

  // ── Return a fresh Flashcard (no mutation) ──────────────────────────
  return {
    id: flashcard.id,
    courseId: flashcard.courseId,
    question: flashcard.question,
    answer: flashcard.answer,
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetition: newRepetition,
    nextReviewDate,
    lastReviewedAt: reviewDate,
  };
}
