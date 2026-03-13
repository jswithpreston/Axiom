// =============================================================================
// Axiom Frontend — Study Plan & Dashboard Hooks
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import type { StudyPlan, DashboardData } from "@/types/domain";
import { getStudyPlan, getDashboard } from "@/services/reviews.service";

export function useStudyPlan() {
  return useQuery<StudyPlan>({
    queryKey: ["study-plan"],
    queryFn: getStudyPlan,
  });
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });
}
