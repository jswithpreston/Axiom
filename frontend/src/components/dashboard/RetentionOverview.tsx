import Card from "@/components/ui/Card";
import MetricTile from "@/components/ui/MetricTile";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatPercentage } from "@/utils/formatters";

interface RetentionOverviewProps {
  readonly avgRetention: number;
  readonly avgAccuracy: number;
}

export default function RetentionOverview({
  avgRetention,
  avgAccuracy,
}: RetentionOverviewProps) {
  return (
    <Card title="RETENTION OVERVIEW">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <MetricTile
            label="Retention Score"
            value={formatPercentage(avgRetention)}
            className="border-0 bg-transparent p-0"
          />
          <ProgressBar value={avgRetention} color="bg-axiom-accent" />
        </div>
        <div className="space-y-2">
          <MetricTile
            label="Accuracy"
            value={formatPercentage(avgAccuracy)}
            className="border-0 bg-transparent p-0"
          />
          <ProgressBar value={avgAccuracy} color="bg-emerald-400" />
        </div>
      </div>
    </Card>
  );
}
