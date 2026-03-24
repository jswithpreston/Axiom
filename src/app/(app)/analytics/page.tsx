"use client";

import { TopBar } from "@/components/layout/TopBar";
import AnalyticsDashboard from "@/features/analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
  return (
    <>
      <TopBar title="Analytics" subtitle="Performance metrics and trends" />

      <div className="p-4 md:p-6">
        <AnalyticsDashboard />
      </div>
    </>
  );
}
