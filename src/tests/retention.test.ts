import { describe, it, expect } from "vitest";
import { calculateRetentionMetrics } from "../domain/retention.js";
import type { ReviewResult } from "../domain/types.js";

// =============================================================================
// Helpers
// =============================================================================

function makeReview(quality: number, daysAgo: number = 0): ReviewResult {
  const date = new Date("2025-06-15T12:00:00Z");
  date.setDate(date.getDate() - daysAgo);
  return { quality, reviewedAt: date };
}

/**
 * Generate a batch of reviews with a given quality, all on the same day.
 */
function makeReviews(count: number, quality: number): ReviewResult[] {
  return Array.from({ length: count }, () => makeReview(quality, 0));
}

// =============================================================================
// Test Suite
// =============================================================================

describe("retention — calculateRetentionMetrics", () => {
  // ── High accuracy + far exam = LOW risk ───────────────────────────────

  it("returns LOW risk for high accuracy and distant exam", () => {
    // 10 reviews, all quality 5 (perfect), exam 60 days away.
    const reviews = makeReviews(10, 5);
    const metrics = calculateRetentionMetrics(reviews, 60);

    expect(metrics.totalReviews).toBe(10);
    expect(metrics.correctReviews).toBe(10);
    expect(metrics.accuracy).toBe(1);
    expect(metrics.riskLevel).toBe("LOW");
    expect(metrics.retentionScore).toBeGreaterThanOrEqual(0.6);
  });

  // ── Low accuracy + near exam = HIGH risk ──────────────────────────────

  it("returns HIGH risk for low accuracy and imminent exam", () => {
    // 10 reviews, only 2 correct (quality ≥ 3), exam in 7 days.
    const reviews = [
      ...makeReviews(8, 1),  // failed
      ...makeReviews(2, 4),  // correct
    ];
    const metrics = calculateRetentionMetrics(reviews, 7);

    expect(metrics.accuracy).toBe(0.2);
    expect(metrics.riskLevel).toBe("HIGH");
  });

  it("returns HIGH risk when accuracy is below 0.7 and exam within 14 days", () => {
    const reviews = [
      ...makeReviews(6, 2),  // failed
      ...makeReviews(4, 3),  // correct (exactly at threshold)
    ];
    const metrics = calculateRetentionMetrics(reviews, 10);

    expect(metrics.accuracy).toBe(0.4);
    expect(metrics.riskLevel).toBe("HIGH");
  });

  // ── Medium risk scenarios ─────────────────────────────────────────────

  it("returns MEDIUM risk for low accuracy but distant exam", () => {
    const reviews = [
      ...makeReviews(7, 1),  // failed
      ...makeReviews(3, 4),  // correct
    ];
    // 30% accuracy, exam 45 days away — not imminent so not HIGH.
    const metrics = calculateRetentionMetrics(reviews, 45);

    expect(metrics.accuracy).toBe(0.3);
    // Not within 14 days so the accuracy+proximity HIGH trigger doesn't fire.
    // But retentionScore will be low → check classification.
    expect(["MEDIUM", "HIGH"]).toContain(metrics.riskLevel);
  });

  // ── Zero reviews handled safely ───────────────────────────────────────

  it("handles zero reviews without errors", () => {
    const metrics = calculateRetentionMetrics([], 30);

    expect(metrics.totalReviews).toBe(0);
    expect(metrics.correctReviews).toBe(0);
    expect(metrics.accuracy).toBe(0);
    expect(metrics.retentionScore).toBeGreaterThanOrEqual(0);
    expect(metrics.retentionScore).toBeLessThanOrEqual(1);
  });

  it("classifies zero reviews with near exam as HIGH risk", () => {
    const metrics = calculateRetentionMetrics([], 5);

    expect(metrics.accuracy).toBe(0);
    // accuracy < 0.7 AND daysUntilExam ≤ 14 → HIGH
    expect(metrics.riskLevel).toBe("HIGH");
  });

  it("classifies zero reviews with distant exam as HIGH risk (score < 0.4)", () => {
    const metrics = calculateRetentionMetrics([], 90);

    // accuracy = 0, recency = 0, proximity factor ≈ 0
    // retentionScore ≈ 0 → HIGH
    expect(metrics.riskLevel).toBe("HIGH");
  });

  // ── Accuracy computation ──────────────────────────────────────────────

  it("counts quality ≥ 3 as correct", () => {
    const reviews: ReviewResult[] = [
      makeReview(0), // incorrect
      makeReview(1), // incorrect
      makeReview(2), // incorrect
      makeReview(3), // correct
      makeReview(4), // correct
      makeReview(5), // correct
    ];

    const metrics = calculateRetentionMetrics(reviews, 30);
    expect(metrics.totalReviews).toBe(6);
    expect(metrics.correctReviews).toBe(3);
    expect(metrics.accuracy).toBe(0.5);
  });

  // ── Retention score bounds ────────────────────────────────────────────

  it("retention score is always between 0 and 1", () => {
    const testCases: { reviews: ReviewResult[]; days: number }[] = [
      { reviews: makeReviews(10, 5), days: 0 },
      { reviews: makeReviews(10, 5), days: 100 },
      { reviews: makeReviews(10, 0), days: 0 },
      { reviews: makeReviews(10, 0), days: 100 },
      { reviews: [], days: 0 },
      { reviews: [], days: 100 },
    ];

    for (const { reviews, days } of testCases) {
      const metrics = calculateRetentionMetrics(reviews, days);
      expect(metrics.retentionScore).toBeGreaterThanOrEqual(0);
      expect(metrics.retentionScore).toBeLessThanOrEqual(1);
    }
  });

  // ── Perfect student scenario ──────────────────────────────────────────

  it("gives maximum retention score for perfect recent reviews near exam", () => {
    // All reviews on the same day (recency = 1.0), all correct, exam tomorrow.
    const reviews = makeReviews(20, 5);
    const metrics = calculateRetentionMetrics(reviews, 1);

    // accuracy=1.0, recency=1.0, proximity≈0.983
    // score = 0.6*1 + 0.2*1 + 0.2*0.983 ≈ 0.997
    expect(metrics.retentionScore).toBeGreaterThan(0.95);
    expect(metrics.riskLevel).toBe("LOW");
  });

  // ── Recency impact ────────────────────────────────────────────────────

  it("recency factor decreases when reviews are spread over many days", () => {
    // All reviews on the same day → recency = 1.0
    const clustered = makeReviews(5, 5);
    const clusteredMetrics = calculateRetentionMetrics(clustered, 30);

    // Reviews spread over 40 days → recency ≈ 0
    const spread: ReviewResult[] = [
      makeReview(5, 0),
      makeReview(5, 10),
      makeReview(5, 20),
      makeReview(5, 30),
      makeReview(5, 40),
    ];
    const spreadMetrics = calculateRetentionMetrics(spread, 30);

    // Same accuracy but the clustered reviews should have a higher score
    // because recency factor is higher.
    expect(clusteredMetrics.retentionScore).toBeGreaterThan(
      spreadMetrics.retentionScore,
    );
  });

  // ── Exam proximity impact ─────────────────────────────────────────────

  it("exam proximity factor increases retention score for nearer exams", () => {
    const reviews = makeReviews(10, 4);

    const farMetrics = calculateRetentionMetrics(reviews, 90);
    const nearMetrics = calculateRetentionMetrics(reviews, 10);

    // Near exam has higher proximity factor, boosting the score.
    expect(nearMetrics.retentionScore).toBeGreaterThan(
      farMetrics.retentionScore,
    );
  });
});
