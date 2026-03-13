"use client";

import Card from "@/components/ui/Card";
import type { StudyPlan, StudyAllocation } from "@/types/domain";
import { formatDate, formatHours } from "@/utils/formatters";

type EnrichedAllocation = StudyAllocation & {
  readonly courseName?: string;
};

type EnrichedStudyPlan = Omit<StudyPlan, "allocations"> & {
  readonly allocations: readonly EnrichedAllocation[];
};

interface DailyPlanProps {
  readonly studyPlan: EnrichedStudyPlan;
}

function UrgencyBar({ score }: { readonly score: number }) {
  const maxScore = 10;
  const clamped = Math.min(score, maxScore);
  const widthPercent = (clamped / maxScore) * 100;

  const barColor =
    score >= 7
      ? "bg-red-400"
      : score >= 4
        ? "bg-amber-400"
        : "bg-emerald-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-axiom-border">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span className="font-mono text-xs text-axiom-muted">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default function DailyPlan({ studyPlan }: DailyPlanProps) {
  const { date, allocations, totalHours } = studyPlan;

  return (
    <Card title="DAILY EXECUTION PLAN">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <span className="font-mono text-3xl font-bold text-axiom-text">
            {formatHours(totalHours)}
          </span>
          <p className="mt-0.5 text-xs text-axiom-muted">Total study time</p>
        </div>
        <span className="text-xs text-axiom-muted">
          {formatDate(date)}
        </span>
      </div>

      {allocations.length === 0 ? (
        <p className="py-4 text-center text-sm text-axiom-muted">
          No courses scheduled
        </p>
      ) : (
        <ul className="space-y-3">
          {allocations.map((alloc) => (
            <li
              key={alloc.courseId}
              className="flex items-center justify-between rounded-md border border-axiom-border bg-axiom-bg/50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-axiom-text">
                  {alloc.courseName ?? alloc.courseId}
                </p>
                <UrgencyBar score={alloc.urgencyScore} />
              </div>
              <span className="ml-4 shrink-0 font-mono text-sm font-semibold text-axiom-accent">
                {formatHours(alloc.allocatedHours)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
