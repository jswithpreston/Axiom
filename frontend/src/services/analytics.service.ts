// =============================================================================
// Axiom Frontend — Analytics Service
// =============================================================================

import type { AnalyticsData } from "@/types/domain";
import { apiGet } from "./api";

export function getAnalytics(courseId?: string): Promise<AnalyticsData> {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiGet<AnalyticsData>(`/analytics${query}`);
}
