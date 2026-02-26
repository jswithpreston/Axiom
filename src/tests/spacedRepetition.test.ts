import { describe, it, expect } from "vitest";
import { reviewFlashcard } from "../domain/spacedRepetition.js";
import type { Flashcard } from "../domain/types.js";

// =============================================================================
// Helpers
// =============================================================================

/** Milliseconds in one day — used to verify nextReviewDate offsets. */
const MS_PER_DAY = 86_400_000;

/**
 * Create a fresh flashcard with sensible defaults.
 * Override any field by passing a partial.
 */
function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "card-1",
    courseId: "course-1",
    question: "What is 2 + 2?",
    answer: "4",
    easeFactor: 2.5,
    interval: 0,
    repetition: 0,
    nextReviewDate: new Date("2025-01-01"),
    ...overrides,
  };
}

const reviewDate = new Date("2025-06-15T12:00:00Z");

// =============================================================================
// Test Suite
// =============================================================================

describe("spacedRepetition — reviewFlashcard", () => {
  // ── First review (quality ≥ 3) ────────────────────────────────────────

  it("sets interval to 1 and repetition to 1 on the first successful review", () => {
    const card = makeCard({ repetition: 0, interval: 0 });
    const result = reviewFlashcard(card, 4, reviewDate);

    expect(result.repetition).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.lastReviewedAt).toEqual(reviewDate);
  });

  it("computes nextReviewDate as reviewDate + interval days", () => {
    const card = makeCard({ repetition: 0, interval: 0 });
    const result = reviewFlashcard(card, 4, reviewDate);

    const expectedNext = new Date(reviewDate.getTime() + 1 * MS_PER_DAY);
    expect(result.nextReviewDate.getTime()).toBe(expectedNext.getTime());
  });

  // ── Second review (quality ≥ 3) ───────────────────────────────────────

  it("sets interval to 6 on the second consecutive successful review", () => {
    const card = makeCard({ repetition: 1, interval: 1, easeFactor: 2.5 });
    const result = reviewFlashcard(card, 4, reviewDate);

    expect(result.repetition).toBe(2);
    expect(result.interval).toBe(6);
  });

  // ── Third+ review — interval grows by ease factor ─────────────────────

  it("multiplies interval by ease factor on the third successful review", () => {
    const card = makeCard({ repetition: 2, interval: 6, easeFactor: 2.5 });
    const result = reviewFlashcard(card, 4, reviewDate);

    // New EF after quality 4: 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + 0.0 = 2.5
    // New interval: round(6 * 2.5) = 15
    expect(result.repetition).toBe(3);
    expect(result.interval).toBe(15);
    expect(result.easeFactor).toBe(2.5);
  });

  it("grows interval further on subsequent reviews", () => {
    const card = makeCard({ repetition: 3, interval: 15, easeFactor: 2.5 });
    const result = reviewFlashcard(card, 5, reviewDate);

    // EF after quality 5: 2.5 + (0.1 - 0*(0.08 + 0*0.02)) = 2.6
    // interval: round(15 * 2.6) = 39
    expect(result.easeFactor).toBeCloseTo(2.6, 5);
    expect(result.interval).toBe(39);
  });

  // ── Reset on failure (quality < 3) ────────────────────────────────────

  it("resets repetition to 0 and interval to 1 when quality < 3", () => {
    const card = makeCard({ repetition: 5, interval: 30, easeFactor: 2.5 });
    const result = reviewFlashcard(card, 2, reviewDate);

    expect(result.repetition).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("resets on quality 0 (complete blackout)", () => {
    const card = makeCard({ repetition: 3, interval: 15, easeFactor: 2.5 });
    const result = reviewFlashcard(card, 0, reviewDate);

    expect(result.repetition).toBe(0);
    expect(result.interval).toBe(1);
  });

  // ── Ease factor floor ─────────────────────────────────────────────────

  it("never lets ease factor drop below 1.3", () => {
    // Start with a low EF and give a poor quality score.
    const card = makeCard({ repetition: 3, interval: 10, easeFactor: 1.3 });
    const result = reviewFlashcard(card, 0, reviewDate);

    // EF formula with q=0: 1.3 + (0.1 - 5*(0.08+5*0.02)) = 1.3 + (0.1-0.9) = 0.5
    // Floored to 1.3
    expect(result.easeFactor).toBe(1.3);
  });

  it("adjusts ease factor downward but respects the floor", () => {
    const card = makeCard({ repetition: 2, interval: 6, easeFactor: 1.4 });
    const result = reviewFlashcard(card, 1, reviewDate);

    // EF with q=1: 1.4 + (0.1 - 4*(0.08+4*0.02)) = 1.4 + (0.1-0.64) = 0.86
    // Floored to 1.3
    expect(result.easeFactor).toBe(1.3);
  });

  // ── Ease factor increases with high quality ───────────────────────────

  it("increases ease factor with quality 5", () => {
    const card = makeCard({ easeFactor: 2.5 });
    const result = reviewFlashcard(card, 5, reviewDate);

    // EF: 2.5 + (0.1 - 0*(0.08 + 0*0.02)) = 2.6
    expect(result.easeFactor).toBeCloseTo(2.6, 5);
  });

  it("keeps ease factor unchanged with quality 4", () => {
    const card = makeCard({ easeFactor: 2.5 });
    const result = reviewFlashcard(card, 4, reviewDate);

    // EF: 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + 0 = 2.5
    expect(result.easeFactor).toBeCloseTo(2.5, 5);
  });

  // ── Invalid quality throws ────────────────────────────────────────────

  it("throws RangeError for quality > 5", () => {
    const card = makeCard();
    expect(() => reviewFlashcard(card, 6, reviewDate)).toThrow(RangeError);
  });

  it("throws RangeError for quality < 0", () => {
    const card = makeCard();
    expect(() => reviewFlashcard(card, -1, reviewDate)).toThrow(RangeError);
  });

  it("throws RangeError for non-integer quality", () => {
    const card = makeCard();
    expect(() => reviewFlashcard(card, 3.5, reviewDate)).toThrow(RangeError);
  });

  // ── Immutability ──────────────────────────────────────────────────────

  it("does not mutate the input flashcard", () => {
    const card = makeCard({ repetition: 2, interval: 6, easeFactor: 2.5 });
    const originalEF = card.easeFactor;
    const originalInterval = card.interval;
    const originalRep = card.repetition;

    reviewFlashcard(card, 5, reviewDate);

    expect(card.easeFactor).toBe(originalEF);
    expect(card.interval).toBe(originalInterval);
    expect(card.repetition).toBe(originalRep);
  });

  // ── Boundary: quality exactly 3 ──────────────────────────────────────

  it("treats quality 3 as a successful review (does not reset)", () => {
    const card = makeCard({ repetition: 1, interval: 1 });
    const result = reviewFlashcard(card, 3, reviewDate);

    expect(result.repetition).toBe(2);
    expect(result.interval).toBe(6);
  });

  // ── Chained reviews simulation ────────────────────────────────────────

  it("produces correct state across a multi-review sequence", () => {
    let card = makeCard({ repetition: 0, interval: 0, easeFactor: 2.5 });
    let date = new Date("2025-01-01T10:00:00Z");

    // Review 1: quality 4
    card = reviewFlashcard(card, 4, date);
    expect(card.repetition).toBe(1);
    expect(card.interval).toBe(1);

    // Review 2: quality 4, next day
    date = new Date(date.getTime() + 1 * MS_PER_DAY);
    card = reviewFlashcard(card, 4, date);
    expect(card.repetition).toBe(2);
    expect(card.interval).toBe(6);

    // Review 3: quality 5, 6 days later
    date = new Date(date.getTime() + 6 * MS_PER_DAY);
    card = reviewFlashcard(card, 5, date);
    expect(card.repetition).toBe(3);
    // EF after q=4 twice then q=5: 2.5 → 2.5 → 2.6
    // interval = round(6 * 2.6) = 16
    expect(card.interval).toBe(16);

    // Review 4: quality 1 (failure) — everything resets
    date = new Date(date.getTime() + 16 * MS_PER_DAY);
    card = reviewFlashcard(card, 1, date);
    expect(card.repetition).toBe(0);
    expect(card.interval).toBe(1);
  });
});
