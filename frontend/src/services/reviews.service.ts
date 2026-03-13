// =============================================================================
// Axiom Frontend — Reviews Service
// =============================================================================

import type {
  Flashcard,
  ReviewSubmission,
  DashboardData,
  StudyPlan,
} from "@/types/domain";
import { apiGet, apiPost } from "./api";

export function submitReview(
  submission: ReviewSubmission,
): Promise<Flashcard> {
  return apiPost<Flashcard>("/reviews", submission);
}

export function getDashboard(): Promise<DashboardData> {
  return apiGet<DashboardData>("/dashboard");
}

export function getStudyPlan(): Promise<StudyPlan> {
  return apiGet<StudyPlan>("/study-plan");
}
