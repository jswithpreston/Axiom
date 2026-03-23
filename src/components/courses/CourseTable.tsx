"use client";

import type React from "react";
import type { CourseWithMeta } from "@/types/domain";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate, formatDaysRemaining } from "@/utils/formatters";

interface CourseTableProps {
  readonly courses: CourseWithMeta[];
  readonly onEdit: (course: CourseWithMeta) => void;
  readonly onDelete: (id: string) => void;
}

type BadgeVariant = "low" | "medium" | "high" | "default";

function riskToBadgeVariant(risk: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
  };
  return map[risk] ?? "default";
}

type CourseRow = Record<string, unknown> & CourseWithMeta;

export default function CourseTable({
  courses,
  onEdit,
  onDelete,
}: CourseTableProps) {
  const columns = [
    {
      key: "name" as const,
      header: "Course Name",
      render: (_value: unknown, row: CourseRow) => (
        <span className="font-semibold text-axiom-text">{row.name}</span>
      ),
    },
    {
      key: "examDate" as const,
      header: "Exam Date",
      render: (_value: unknown, row: CourseRow) => (
        <span className="text-axiom-text">{formatDate(row.examDate)}</span>
      ),
    },
    {
      key: "daysRemaining" as const,
      header: "Days Remaining",
      render: (_value: unknown, row: CourseRow) => (
        <span
          className={`font-mono ${
            row.daysRemaining < 7 ? "text-red-400" : "text-axiom-text"
          }`}
        >
          {formatDaysRemaining(row.daysRemaining)}
        </span>
      ),
    },
    {
      key: "difficultyWeight" as const,
      header: "Difficulty",
      render: (_value: unknown, row: CourseRow) => (
        <span className="text-axiom-text">{row.difficultyWeight}/5</span>
      ),
    },
    {
      key: "riskLevel" as const,
      header: "Risk Level",
      render: (_value: unknown, row: CourseRow) => (
        <Badge variant={riskToBadgeVariant(row.riskLevel)}>
          {row.riskLevel}
        </Badge>
      ),
    },
    {
      key: "id" as const,
      header: "",
      width: "60px",
      render: (_value: unknown, row: CourseRow) => {
        const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
        return (
          <div role="presentation" onClick={stopPropagation}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(row.id)}
              aria-label={`Delete ${row.name}`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Table<CourseRow>
      columns={columns}
      data={courses as CourseRow[]}
      onRowClick={(row) => onEdit(row as CourseWithMeta)}
      emptyMessage="No courses yet. Add your first course to get started."
    />
  );
}
