// =============================================================================
// Axiom Frontend — Analytics Hooks
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@/types/domain";
import { getAnalytics } from "@/services/analytics.service";

export function useAnalytics(courseId?: string) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", courseId],
    queryFn: () => getAnalytics(courseId),
  });
}
