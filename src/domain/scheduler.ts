// =============================================================================
// Axiom Study Engine — Study Scheduler Engine
// =============================================================================
//
// Allocates a student's daily available study hours across active courses
// using a weighted urgency model. The scheduler is deterministic and pure:
// given the same inputs it always produces the same allocation.
//
// ─── Urgency Formula ─────────────────────────────────────────────────────────
//
// For each course with an upcoming exam:
//
//   daysLeft = ceil((examDate − today) / MS_PER_DAY)
//
//   baseUrgency = 1 / daysLeft
//     → Hyperbolic curve: urgency rises sharply as the exam approaches.
//       At 30 days out the value is ~0.033; at 1 day out it is 1.0.
//
//   proximityBoost = (daysLeft ≤ 7) ? 2.0 : 1.0
//     → A discrete multiplier that doubles urgency in the final week,
//       modeling the well-known "crunch time" effect where marginal study
//       hours have disproportionate value.
//
//   urgencyScore = baseUrgency × difficultyWeight × proximityBoost
//     → Difficulty weight (1–5) linearly scales urgency so harder courses
//       receive proportionally more time even when exam dates are similar.
//
// Allocation is then proportional to each course's share of total urgency:
//
//   allocatedHours = (urgencyScore / Σ urgencyScores) × dailyAvailableHours
//
// Courses whose exam date is in the past (daysLeft ≤ 0) are excluded
// entirely — there is no value in studying for an exam that already happened.
//
// Edge cases:
//   - If no courses are active, every course gets 0 hours.
//   - Floating-point allocation is rounded to 2 decimal places. A final
//     rounding-error correction is applied to the largest allocation so
//     the sum matches `dailyAvailableHours` exactly.
// =============================================================================

import type { Course, StudyAllocation } from "./types.js";

/** Milliseconds in one calendar day. */
const MS_PER_DAY = 86_400_000;

/** Threshold (in days) below which the proximity boost activates. */
const PROXIMITY_THRESHOLD_DAYS = 7;

/** Multiplier applied when the exam is within the proximity threshold. */
const PROXIMITY_BOOST = 2.0;

/**
 * Compute the number of whole days between `today` and a future `date`.
 * Returns 0 or negative for dates in the past.
 */
function daysUntil(today: Date, date: Date): number {
  return Math.ceil((date.getTime() - today.getTime()) / MS_PER_DAY);
}

/**
 * Round a number to two decimal places (financial-style rounding).
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Generate a daily study plan that distributes `dailyAvailableHours`
 * across the provided courses based on exam urgency and difficulty.
 *
 * @param courses             — all courses the student is enrolled in
 * @param today               — the current date (injected for testability)
 * @param dailyAvailableHours — total hours the student can study today
 * @returns an allocation for each *active* course (exam still in the future)
 *
 * Guarantees:
 *   - The sum of `allocatedHours` equals `dailyAvailableHours` exactly.
 *   - No allocation is negative.
 *   - Courses with past exams are excluded from the result.
 */
export function generateStudyPlan(
  courses: readonly Course[],
  today: Date,
  dailyAvailableHours: number,
): StudyAllocation[] {
  // ── 1. Filter to active courses and compute urgency ─────────────────
  const scored: { courseId: string; urgencyScore: number }[] = [];

  for (const course of courses) {
    const days = daysUntil(today, course.examDate);

    // Past exams are irrelevant — skip them.
    if (days <= 0) continue;

    // Hyperbolic base urgency: approaches infinity as days → 0.
    const baseUrgency = 1 / days;

    // Discrete boost for the final week.
    const proximityBoost =
      days <= PROXIMITY_THRESHOLD_DAYS ? PROXIMITY_BOOST : 1.0;

    const urgencyScore =
      baseUrgency * course.difficultyWeight * proximityBoost;

    scored.push({ courseId: course.id, urgencyScore });
  }

  // ── 2. Edge case: no active courses ─────────────────────────────────
  if (scored.length === 0) return [];

  // ── 3. Proportional allocation ──────────────────────────────────────
  const totalUrgency = scored.reduce((sum, s) => sum + s.urgencyScore, 0);

  const allocations: StudyAllocation[] = scored.map((s) => ({
    courseId: s.courseId,
    allocatedHours: round2(
      (s.urgencyScore / totalUrgency) * dailyAvailableHours,
    ),
    urgencyScore: round2(s.urgencyScore),
  }));

  // ── 4. Rounding correction ──────────────────────────────────────────
  // Floating-point rounding can cause the sum to drift by a few hundredths.
  // We absorb the error into the course with the largest allocation, which
  // is least sensitive to small perturbations.
  const allocatedSum = allocations.reduce(
    (sum, a) => sum + a.allocatedHours,
    0,
  );
  const drift = round2(dailyAvailableHours - allocatedSum);

  if (drift !== 0 && allocations.length > 0) {
    // Find the index of the course with the largest allocation.
    let maxIndex = 0;
    for (let i = 1; i < allocations.length; i++) {
      if ((allocations[i]?.allocatedHours ?? 0) > (allocations[maxIndex]?.allocatedHours ?? 0)) {
        maxIndex = i;
      }
    }

    const target = allocations[maxIndex];
    if (target) {
      allocations[maxIndex] = {
        ...target,
        allocatedHours: round2(target.allocatedHours + drift),
      };
    }
  }

  return allocations;
}
