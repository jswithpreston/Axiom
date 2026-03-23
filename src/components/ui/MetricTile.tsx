import clsx from "clsx";

type Trend = "up" | "down" | "neutral";

interface MetricTileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: Trend;
  className?: string;
}

function TrendArrow({ trend }: { trend: Trend }) {
  const colors: Record<Trend, string> = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };

  return (
    <span className={clsx("ml-2 inline-flex items-center text-sm", colors[trend])}>
      {trend === "up" && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      )}
      {trend === "down" && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
        </svg>
      )}
      {trend === "neutral" && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      )}
    </span>
  );
}

export default function MetricTile({
  label,
  value,
  subtitle,
  trend,
  className,
}: MetricTileProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-axiom-border bg-axiom-surface p-5",
        className
      )}
    >
      <p className="text-xs uppercase tracking-wider text-axiom-muted">
        {label}
      </p>
      <div className="mt-2 flex items-baseline">
        <span className="font-mono text-2xl font-semibold text-axiom-text">
          {value}
        </span>
        {trend && <TrendArrow trend={trend} />}
      </div>
      {subtitle && (
        <p className="mt-1 text-sm text-axiom-muted">{subtitle}</p>
      )}
    </div>
  );
}
