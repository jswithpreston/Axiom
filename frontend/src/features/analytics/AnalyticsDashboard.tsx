"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Card from "@/components/ui/Card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCourses } from "@/hooks/useCourses";

// ---------------------------------------------------------------------------
// Chart theme constants
// ---------------------------------------------------------------------------

const AXIS_TICK_FILL = "#6b6b76";
const GRID_STROKE = "#1e1e22";
const RETENTION_COLOR = "#3b82f6"; // axiom-accent
const ACCURACY_COLOR = "#22c55e";
const BAR_COLOR = "#3b82f6";

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#0f0f12",
  border: "1px solid #1e1e22",
  borderRadius: "6px",
  fontSize: "12px",
  color: "#e0e0e6",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnalyticsDashboard() {
  const { data: courses = [] } = useCourses();
  const [filterCourseId, setFilterCourseId] = useState<string>("");

  const { data: analytics, isLoading } = useAnalytics(
    filterCourseId || undefined
  );

  // ---- Loading state ------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-axiom-muted">Loading analytics...</p>
      </div>
    );
  }

  // ---- Empty state --------------------------------------------------------
  if (!analytics) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm text-axiom-muted">
          No analytics data available yet. Complete some reviews to see trends.
        </p>
      </div>
    );
  }

  const { retentionTrend, accuracyTrend, studyHoursDistribution } = analytics;

  return (
    <div className="flex flex-col gap-6">
      {/* Course filter */}
      <div className="flex items-center">
        <select
          value={filterCourseId}
          onChange={(e) => setFilterCourseId(e.target.value)}
          className="rounded-md border border-axiom-border bg-axiom-surface px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Retention Score Trend */}
      <Card title="RETENTION SCORE TREND">
        {retentionTrend.length === 0 ? (
          <p className="py-8 text-center text-xs text-axiom-muted">
            No retention data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[...retentionTrend]}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: AXIS_TICK_FILL, fontSize: 11 }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fill: AXIS_TICK_FILL, fontSize: 11 }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [
                  `${(value * 100).toFixed(1)}%`,
                  "Retention",
                ]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={RETENTION_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: RETENTION_COLOR }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Review Accuracy Trend */}
      <Card title="REVIEW ACCURACY">
        {accuracyTrend.length === 0 ? (
          <p className="py-8 text-center text-xs text-axiom-muted">
            No accuracy data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[...accuracyTrend]}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: AXIS_TICK_FILL, fontSize: 11 }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fill: AXIS_TICK_FILL, fontSize: 11 }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [
                  `${(value * 100).toFixed(1)}%`,
                  "Accuracy",
                ]}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke={ACCURACY_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: ACCURACY_COLOR }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Study Hours Distribution */}
      <Card title="STUDY HOURS DISTRIBUTION">
        {studyHoursDistribution.length === 0 ? (
          <p className="py-8 text-center text-xs text-axiom-muted">
            No study hours data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[...studyHoursDistribution]}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
              <XAxis
                dataKey="courseName"
                tick={{ fill: AXIS_TICK_FILL, fontSize: 11 }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: AXIS_TICK_FILL, fontSize: 11 }}
                axisLine={{ stroke: GRID_STROKE }}
                tickLine={false}
                tickFormatter={(v: number) => `${v}h`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}h`, "Hours"]}
              />
              <Bar
                dataKey="hours"
                fill={BAR_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
