import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { formatDaysRemaining } from "@/utils/formatters";
import type { RiskLevel } from "@/types/domain";

interface ExamCountdownEntry {
  readonly courseId: string;
  readonly courseName: string;
  readonly daysRemaining: number;
  readonly riskLevel: RiskLevel;
}

interface ExamCountdownProps {
  readonly countdowns: readonly ExamCountdownEntry[];
}

function riskToBadgeVariant(risk: RiskLevel): "low" | "medium" | "high" {
  const map: Record<RiskLevel, "low" | "medium" | "high"> = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
  };
  return map[risk];
}

export default function ExamCountdown({ countdowns }: ExamCountdownProps) {
  const sorted = [...countdowns].sort(
    (a, b) => a.daysRemaining - b.daysRemaining,
  );

  return (
    <Card title="EXAM COUNTDOWN">
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-axiom-muted">
          No upcoming exams
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((exam) => (
            <li
              key={exam.courseId}
              className="flex items-center justify-between rounded-md border border-axiom-border bg-axiom-bg/50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-axiom-text">
                  {exam.courseName}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                <span className="font-mono text-sm font-semibold text-axiom-text">
                  {formatDaysRemaining(exam.daysRemaining)}
                </span>
                <Badge variant={riskToBadgeVariant(exam.riskLevel)}>
                  {exam.riskLevel}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
