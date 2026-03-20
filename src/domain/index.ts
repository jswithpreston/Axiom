// =============================================================================
// Axiom Study Engine — Public API
// =============================================================================
// Barrel export for the domain layer. Consumers should import from this
// module rather than reaching into individual engine files.
// =============================================================================

// ── Domain types ──────────────────────────────────────────────────────────────
export type {
  Course,
  Flashcard,
  ReviewResult,
  RetentionMetrics,
  RiskLevel,
  StudyAllocation,
} from "./types.js";

// ── Spaced Repetition Engine ──────────────────────────────────────────────────
export { reviewFlashcard } from "./spacedRepetition.js";

// ── Study Scheduler Engine ────────────────────────────────────────────────────
export { generateStudyPlan } from "./scheduler.js";

// ── Retention & Risk Engine ───────────────────────────────────────────────────
export { calculateRetentionMetrics } from "./retention.js";

// ── Note Parser ───────────────────────────────────────────────────────────────
export { parseNotes } from "./noteParser.js";
export type { ParsedCard } from "./noteParser.js";
