import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { RiskLevel } from "@/types/domain";

interface RiskEntry {
  readonly courseId: string;
  readonly courseName: string;
  readonly riskLevel: RiskLevel;
}

interface RiskMonitorProps {
  readonly risks: readonly RiskEntry[];
}

function riskToBadgeVariant(risk: RiskLevel): "low" | "medium" | "high" {
  const map: Record<RiskLevel, "low" | "medium" | "high"> = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
  };
  return map[risk];
}

export default function RiskMonitor({ risks }: RiskMonitorProps) {
  const allLow = risks.length > 0 && risks.every((r) => r.riskLevel === "LOW");

  return (
    <Card title="RISK MONITOR">
      {risks.length === 0 ? (
        <p className="py-4 text-center text-sm text-axiom-muted">
          No courses to monitor
        </p>
      ) : (
        <>
          {allLow && (
            <p className="mb-3 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              All systems nominal
            </p>
          )}
          <ul className="space-y-2">
            {risks.map((entry) => (
              <li
                key={entry.courseId}
                className="flex items-center justify-between rounded-md border border-axiom-border bg-axiom-bg/50 px-4 py-3"
              >
                <p className="truncate text-sm font-medium text-axiom-text">
                  {entry.courseName}
                </p>
                <Badge variant={riskToBadgeVariant(entry.riskLevel)}>
                  {entry.riskLevel}
                </Badge>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
