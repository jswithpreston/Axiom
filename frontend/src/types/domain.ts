// =============================================================================
// Axiom Frontend — Domain Types
// =============================================================================
// Frontend mirror of the engine's domain types plus UI-specific composites.
// Dates arrive as ISO strings from the API and are represented as such;
// the engine's `Date` objects are serialized during transport.
// =============================================================================

// ---------------------------------------------------------------------------
// Core domain types (mirrors of engine types)
// ---------------------------------------------------------------------------

export interface Course {
  readonly id: string;
  readonly name: string;
  readonly examDate: Date;
  /** Subjective difficulty on a 1-5 scale. Affects time allocation. */
  readonly difficultyWeight: number;
  readonly createdAt: Date;
}

export interface Flashcard {
  readonly id: string;
  readonly courseId: string;
  readonly question: string;
  readonly answer: string;
  /** SM-2 ease factor (>= 1.3). */
  readonly easeFactor: number;
  /** Days until next scheduled review. */
  readonly interval: number;
  /** Consecutive correct-review streak counter. */
  readonly repetition: number;
  readonly nextReviewDate: Date;
  readonly lastReviewedAt?: Date | undefined;
}

export interface ReviewResult {
  /** SM-2 quality grade, integer in [0, 5]. */
  readonly quality: number;
  readonly reviewedAt: Date;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RetentionMetrics {
  readonly totalReviews: number;
  readonly correctReviews: number;
  /** Ratio of correct reviews to total reviews, in [0, 1]. */
  readonly accuracy: number;
  /** Composite retention health score, in [0, 1]. */
  readonly retentionScore: number;
  readonly riskLevel: RiskLevel;
}

export interface StudyAllocation {
  readonly courseId: string;
  readonly allocatedHours: number;
  /** Raw urgency score before normalization. Higher = more pressing. */
  readonly urgencyScore: number;
}

// ---------------------------------------------------------------------------
// Frontend composite types
// ---------------------------------------------------------------------------

/** Course enriched with computed metadata for display. */
export interface CourseWithMeta extends Course {
  readonly daysRemaining: number;
  readonly riskLevel: RiskLevel;
  readonly retentionMetrics?: RetentionMetrics | undefined;
}

/** Flashcard enriched with the parent course name for display. */
export interface FlashcardWithMeta extends Flashcard {
  readonly courseName: string;
}

/** A single day's study plan produced by the scheduler. */
export interface StudyPlan {
  readonly date: Date;
  readonly allocations: readonly StudyAllocation[];
  readonly totalHours: number;
}

/** Aggregate data powering the main dashboard view. */
export interface DashboardData {
  readonly studyPlan: StudyPlan;
  readonly retentionOverview: {
    readonly avgRetention: number;
    readonly avgAccuracy: number;
  };
  readonly examCountdowns: readonly {
    readonly courseId: string;
    readonly courseName: string;
    readonly daysRemaining: number;
    readonly riskLevel: RiskLevel;
  }[];
  readonly weakestTopics: readonly {
    readonly flashcardId: string;
    readonly question: string;
    readonly easeFactor: number;
    readonly courseName: string;
  }[];
  readonly riskSummary: readonly {
    readonly courseId: string;
    readonly courseName: string;
    readonly riskLevel: RiskLevel;
  }[];
}

/** Time-series and distribution data for the analytics view. */
export interface AnalyticsData {
  readonly retentionTrend: readonly {
    readonly date: string;
    readonly score: number;
  }[];
  readonly accuracyTrend: readonly {
    readonly date: string;
    readonly accuracy: number;
  }[];
  readonly studyHoursDistribution: readonly {
    readonly courseName: string;
    readonly hours: number;
  }[];
}

// ---------------------------------------------------------------------------
// API input types
// ---------------------------------------------------------------------------

export interface CreateCourseInput {
  readonly name: string;
  /** ISO-8601 date string, e.g. "2026-06-15T00:00:00.000Z". */
  readonly examDate: string;
  readonly difficultyWeight: number;
}

export type UpdateCourseInput = Partial<CreateCourseInput>;

export interface CreateFlashcardInput {
  readonly courseId: string;
  readonly question: string;
  readonly answer: string;
}

export type UpdateFlashcardInput = Partial<CreateFlashcardInput>;

export interface ReviewSubmission {
  readonly flashcardId: string;
  /** SM-2 quality grade, integer in [0, 5]. */
  readonly quality: 0 | 1 | 2 | 3 | 4 | 5;
}
