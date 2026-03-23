import type { RiskLevel } from "@/types/domain";

// ---------------------------------------------------------------------------
// Date / time formatting
// ---------------------------------------------------------------------------

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
} as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", DATE_FORMAT);

/**
 * Format a date value as "Mar 15, 2026".
 * Accepts both `Date` instances and ISO-8601 strings.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFormatter.format(d);
}

/**
 * Describe the number of days remaining until an exam.
 *
 * - Positive: "14 days"
 * - Zero:     "Today"
 * - Negative: "Overdue"
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------------------
// Numeric formatting
// ---------------------------------------------------------------------------

/**
 * Format a 0-1 ratio as a percentage string, e.g. 0.852 -> "85.2%".
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a decimal hour value, e.g. 2.5 -> "2.5h".
 */
export function formatHours(hours: number): string {
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

/**
 * Format an SM-2 ease factor to two decimal places, e.g. 2.5 -> "2.50".
 */
export function formatEaseFactor(ef: number): string {
  return ef.toFixed(2);
}

// ---------------------------------------------------------------------------
// Risk level formatting
// ---------------------------------------------------------------------------

interface RiskDisplay {
  readonly label: string;
  readonly colorClass: string;
}

const RISK_DISPLAY_MAP: Record<RiskLevel, RiskDisplay> = {
  LOW: { label: "Low Risk", colorClass: "text-emerald-400" },
  MEDIUM: { label: "Medium Risk", colorClass: "text-amber-400" },
  HIGH: { label: "High Risk", colorClass: "text-red-400" },
} as const;

/**
 * Map a `RiskLevel` to a human-readable label and a Tailwind color class.
 */
export function formatRiskLevel(risk: RiskLevel): RiskDisplay {
  return RISK_DISPLAY_MAP[risk];
}
