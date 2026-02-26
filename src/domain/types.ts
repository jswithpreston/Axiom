// =============================================================================
// Axiom Study Engine — Domain Types
// =============================================================================
// All domain models are plain data types with no behavior attached.
// They are designed to be serializable, immutable in use, and fully
// decoupled from any persistence or UI layer.
// =============================================================================

/**
 * Represents an academic course the student is preparing for.
 *
 * `difficultyWeight` is a subjective 1–5 scale where higher values cause
 * the scheduler to allocate proportionally more study time to the course.
 */
export interface Course {
  readonly id: string;
  readonly name: string;
  readonly examDate: Date;
  /** Subjective difficulty on a 1–5 scale. Affects time allocation. */
  readonly difficultyWeight: number;
  readonly createdAt: Date;
}

/**
 * A single flashcard belonging to a course.
 *
 * The spaced-repetition state is embedded directly on the card so that
 * each review produces a new `Flashcard` value with updated scheduling
 * parameters — no external state table needed.
 *
 * SM-2 fields:
 * - `easeFactor`    — multiplier that controls interval growth (≥ 1.3)
 * - `interval`      — days until the next scheduled review
 * - `repetition`    — consecutive correct-review streak counter
 * - `nextReviewDate` — the calendar date when this card is next due
 */
export interface Flashcard {
  readonly id: string;
  readonly courseId: string;
  readonly question: string;
  readonly answer: string;
  readonly easeFactor: number;
  readonly interval: number;
  readonly repetition: number;
  readonly nextReviewDate: Date;
  readonly lastReviewedAt?: Date | undefined;
}

/**
 * The outcome of a single review event.
 *
 * `quality` follows the SM-2 grading scale:
 *   0 — complete blackout
 *   1 — incorrect; but upon seeing the answer, it was remembered
 *   2 — incorrect; but the answer seemed easy to recall
 *   3 — correct with serious difficulty
 *   4 — correct after hesitation
 *   5 — perfect response
 */
export interface ReviewResult {
  /** SM-2 quality grade, integer in [0, 5]. */
  readonly quality: number;
  readonly reviewedAt: Date;
}

/**
 * Risk classification for a course's retention health.
 *
 * LOW    — student is on track; no intervention needed.
 * MEDIUM — some concern; recommend additional review sessions.
 * HIGH   — significant risk of poor exam performance.
 */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

/**
 * Aggregated retention analytics for a set of reviews.
 *
 * The `retentionScore` is a composite 0–1 value blending accuracy,
 * recency of study activity, and exam proximity. See `retention.ts`
 * for the full formula breakdown.
 */
export interface RetentionMetrics {
  readonly totalReviews: number;
  readonly correctReviews: number;
  /** Ratio of correct reviews to total reviews, in [0, 1]. */
  readonly accuracy: number;
  /** Composite retention health score, in [0, 1]. */
  readonly retentionScore: number;
  readonly riskLevel: RiskLevel;
}

/**
 * The output of the study scheduler: how many hours to allocate to
 * a single course on a given day.
 *
 * `urgencyScore` is an internal ranking value (higher = more urgent).
 * It is exposed so callers can display priority indicators in the UI.
 */
export interface StudyAllocation {
  readonly courseId: string;
  readonly allocatedHours: number;
  /** Raw urgency score before normalization. Higher = more pressing. */
  readonly urgencyScore: number;
}
