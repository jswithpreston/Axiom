"use client";

import { TopBar } from "@/components/layout/TopBar";
import MetricTile from "@/components/ui/MetricTile";
import DailyPlan from "@/components/dashboard/DailyPlan";
import RetentionOverview from "@/components/dashboard/RetentionOverview";
import ExamCountdown from "@/components/dashboard/ExamCountdown";
import RiskMonitor from "@/components/dashboard/RiskMonitor";
import WeakestTopics from "@/components/dashboard/WeakestTopics";
import { useDashboard } from "@/hooks/useStudyPlan";
import { formatPercentage, formatHours } from "@/utils/formatters";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="grid grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg border border-axiom-border bg-axiom-surface"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="h-64 rounded-lg border border-axiom-border bg-axiom-surface" />
          <div className="h-48 rounded-lg border border-axiom-border bg-axiom-surface" />
        </div>
        <div className="space-y-6">
          <div className="h-40 rounded-lg border border-axiom-border bg-axiom-surface" />
          <div className="h-48 rounded-lg border border-axiom-border bg-axiom-surface" />
          <div className="h-40 rounded-lg border border-axiom-border bg-axiom-surface" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { readonly message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-6 py-4 text-center">
        <p className="text-sm font-medium text-red-400">
          Failed to load dashboard
        </p>
        <p className="mt-1 text-xs text-red-400/70">{message}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Academic preparation status" />
        <LoadingSkeleton />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Academic preparation status" />
        <ErrorState
          message={
            error instanceof Error ? error.message : "An unknown error occurred"
          }
        />
      </>
    );
  }

  const highRiskCount = data.riskSummary.filter(
    (r) => r.riskLevel === "HIGH",
  ).length;

  return (
    <>
      <TopBar title="Dashboard" subtitle="Academic preparation status" />

      <div className="space-y-6 p-6">
        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-6">
          <MetricTile
            label="Total Study Hours"
            value={formatHours(data.studyPlan.totalHours)}
            subtitle="Today's allocation"
          />
          <MetricTile
            label="Retention Score"
            value={formatPercentage(data.retentionOverview.avgRetention)}
            subtitle="Cross-course average"
          />
          <MetricTile
            label="Accuracy"
            value={formatPercentage(data.retentionOverview.avgAccuracy)}
            subtitle="Review accuracy"
          />
          <MetricTile
            label="Courses At Risk"
            value={highRiskCount}
            subtitle={
              highRiskCount === 0 ? "No high-risk courses" : "Requires attention"
            }
          />
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <DailyPlan studyPlan={data.studyPlan} />
            <WeakestTopics topics={data.weakestTopics} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <RetentionOverview
              avgRetention={data.retentionOverview.avgRetention}
              avgAccuracy={data.retentionOverview.avgAccuracy}
            />
            <ExamCountdown countdowns={data.examCountdowns} />
            <RiskMonitor risks={data.riskSummary} />
          </div>
        </div>
      </div>
    </>
  );
}
