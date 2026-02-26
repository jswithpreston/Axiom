import { describe, it, expect } from "vitest";
import { generateStudyPlan } from "../domain/scheduler.js";
import type { Course } from "../domain/types.js";

// =============================================================================
// Helpers
// =============================================================================

const MS_PER_DAY = 86_400_000;

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-1",
    name: "Mathematics",
    examDate: new Date("2025-07-01"),
    difficultyWeight: 3,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

function sumHours(allocations: { allocatedHours: number }[]): number {
  const raw = allocations.reduce((s, a) => s + a.allocatedHours, 0);
  return Math.round(raw * 100) / 100;
}

const today = new Date("2025-06-15T00:00:00Z");

// =============================================================================
// Test Suite
// =============================================================================

describe("scheduler — generateStudyPlan", () => {
  // ── Basic allocation ──────────────────────────────────────────────────

  it("allocates all hours to a single active course", () => {
    const courses = [makeCourse()];
    const plan = generateStudyPlan(courses, today, 4);

    expect(plan).toHaveLength(1);
    expect(plan[0]?.allocatedHours).toBe(4);
    expect(plan[0]?.courseId).toBe("course-1");
  });

  // ── Closer exam gets more hours ───────────────────────────────────────

  it("allocates more hours to the course with the closer exam", () => {
    const courses = [
      makeCourse({ id: "far", examDate: new Date("2025-08-01"), difficultyWeight: 3 }),
      makeCourse({ id: "near", examDate: new Date("2025-06-20"), difficultyWeight: 3 }),
    ];

    const plan = generateStudyPlan(courses, today, 6);
    const nearAlloc = plan.find((a) => a.courseId === "near");
    const farAlloc = plan.find((a) => a.courseId === "far");

    expect(nearAlloc).toBeDefined();
    expect(farAlloc).toBeDefined();
    expect(nearAlloc!.allocatedHours).toBeGreaterThan(farAlloc!.allocatedHours);
  });

  // ── Higher difficulty gets more hours ─────────────────────────────────

  it("allocates more hours to the course with higher difficulty", () => {
    const sameExam = new Date("2025-07-15");
    const courses = [
      makeCourse({ id: "easy", examDate: sameExam, difficultyWeight: 1 }),
      makeCourse({ id: "hard", examDate: sameExam, difficultyWeight: 5 }),
    ];

    const plan = generateStudyPlan(courses, today, 8);
    const easyAlloc = plan.find((a) => a.courseId === "easy");
    const hardAlloc = plan.find((a) => a.courseId === "hard");

    expect(hardAlloc!.allocatedHours).toBeGreaterThan(easyAlloc!.allocatedHours);
  });

  // ── Past exam excluded ────────────────────────────────────────────────

  it("excludes courses whose exam date is in the past", () => {
    const courses = [
      makeCourse({ id: "past", examDate: new Date("2025-06-10") }),
      makeCourse({ id: "future", examDate: new Date("2025-07-01") }),
    ];

    const plan = generateStudyPlan(courses, today, 5);
    const ids = plan.map((a) => a.courseId);

    expect(ids).not.toContain("past");
    expect(ids).toContain("future");
    expect(plan[0]?.allocatedHours).toBe(5);
  });

  it("returns an empty plan when all exams are in the past", () => {
    const courses = [
      makeCourse({ id: "a", examDate: new Date("2025-01-01") }),
      makeCourse({ id: "b", examDate: new Date("2025-03-01") }),
    ];

    const plan = generateStudyPlan(courses, today, 5);
    expect(plan).toHaveLength(0);
  });

  // ── Total allocation equals available hours ───────────────────────────

  it("total allocated hours equals dailyAvailableHours exactly", () => {
    const courses = [
      makeCourse({ id: "a", examDate: new Date("2025-06-20"), difficultyWeight: 2 }),
      makeCourse({ id: "b", examDate: new Date("2025-07-01"), difficultyWeight: 4 }),
      makeCourse({ id: "c", examDate: new Date("2025-08-15"), difficultyWeight: 1 }),
    ];

    const plan = generateStudyPlan(courses, today, 10);
    expect(sumHours(plan)).toBe(10);
  });

  it("handles fractional hours and sums correctly", () => {
    const courses = [
      makeCourse({ id: "a", examDate: new Date("2025-06-18"), difficultyWeight: 3 }),
      makeCourse({ id: "b", examDate: new Date("2025-06-25"), difficultyWeight: 2 }),
      makeCourse({ id: "c", examDate: new Date("2025-07-10"), difficultyWeight: 5 }),
    ];

    const plan = generateStudyPlan(courses, today, 7);
    expect(sumHours(plan)).toBe(7);
  });

  // ── No negative allocations ───────────────────────────────────────────

  it("never produces negative allocated hours", () => {
    const courses = [
      makeCourse({ id: "a", examDate: new Date("2025-06-16"), difficultyWeight: 5 }),
      makeCourse({ id: "b", examDate: new Date("2025-12-01"), difficultyWeight: 1 }),
    ];

    const plan = generateStudyPlan(courses, today, 3);
    for (const alloc of plan) {
      expect(alloc.allocatedHours).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Proximity boost (< 7 days) ───────────────────────────────────────

  it("significantly boosts urgency for exams within 7 days", () => {
    const courses = [
      makeCourse({ id: "imminent", examDate: new Date("2025-06-20"), difficultyWeight: 3 }),
      makeCourse({ id: "moderate", examDate: new Date("2025-06-30"), difficultyWeight: 3 }),
    ];

    const plan = generateStudyPlan(courses, today, 6);
    const imminent = plan.find((a) => a.courseId === "imminent");
    const moderate = plan.find((a) => a.courseId === "moderate");

    // The imminent course (5 days out with 2x boost) should get substantially more.
    expect(imminent!.allocatedHours).toBeGreaterThan(moderate!.allocatedHours);

    // Urgency score should also reflect the boost.
    expect(imminent!.urgencyScore).toBeGreaterThan(moderate!.urgencyScore);
  });

  // ── Empty input ───────────────────────────────────────────────────────

  it("returns an empty plan for an empty course list", () => {
    const plan = generateStudyPlan([], today, 5);
    expect(plan).toHaveLength(0);
  });

  // ── Exam on the same day ──────────────────────────────────────────────

  it("excludes a course whose exam date is exactly today", () => {
    const courses = [
      makeCourse({ id: "today-exam", examDate: today }),
    ];

    // daysUntil = ceil(0) = 0 → excluded
    const plan = generateStudyPlan(courses, today, 5);
    expect(plan).toHaveLength(0);
  });

  // ── Urgency scores are positive ───────────────────────────────────────

  it("all urgency scores are positive for active courses", () => {
    const courses = [
      makeCourse({ id: "a", examDate: new Date("2025-06-20"), difficultyWeight: 1 }),
      makeCourse({ id: "b", examDate: new Date("2025-09-01"), difficultyWeight: 5 }),
    ];

    const plan = generateStudyPlan(courses, today, 4);
    for (const alloc of plan) {
      expect(alloc.urgencyScore).toBeGreaterThan(0);
    }
  });
});
