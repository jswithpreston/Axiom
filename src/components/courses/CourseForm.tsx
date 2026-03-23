"use client";

import { useState, type FormEvent } from "react";
import type { CourseWithMeta, CreateCourseInput } from "@/types/domain";
import Button from "@/components/ui/Button";

interface CourseFormProps {
  readonly course?: CourseWithMeta;
  readonly onSubmit: (data: CreateCourseInput) => void;
  readonly onCancel: () => void;
  readonly isLoading?: boolean;
}

function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = d.toISOString().split("T");
  return parts[0] ?? "";
}

const inputClasses =
  "w-full bg-axiom-bg border border-axiom-border rounded-md px-3 py-2 text-axiom-text text-sm focus:border-axiom-accent focus:outline-none";

const labelClasses = "block text-xs uppercase tracking-wider text-axiom-muted mb-1.5";

export default function CourseForm({
  course,
  onSubmit,
  onCancel,
  isLoading = false,
}: CourseFormProps) {
  const [name, setName] = useState<string>(course?.name ?? "");
  const [examDate, setExamDate] = useState<string>(
    course ? toDateInputValue(course.examDate) : ""
  );
  const [difficultyWeight, setDifficultyWeight] = useState<number>(
    course?.difficultyWeight ?? 3
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = Boolean(course);

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!name.trim()) {
      next.name = "Course name is required.";
    }

    if (!examDate) {
      next.examDate = "Exam date is required.";
    }

    if (difficultyWeight < 1 || difficultyWeight > 5) {
      next.difficultyWeight = "Difficulty must be between 1 and 5.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();

    if (!validate()) return;

    const data: CreateCourseInput = {
      name: name.trim(),
      examDate: new Date(examDate).toISOString(),
      difficultyWeight,
    };

    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Course Name */}
      <div>
        <label htmlFor="course-name" className={labelClasses}>
          Course Name
        </label>
        <input
          id="course-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Linear Algebra"
          className={inputClasses}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Exam Date */}
      <div>
        <label htmlFor="exam-date" className={labelClasses}>
          Exam Date
        </label>
        <input
          id="exam-date"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className={inputClasses}
          disabled={isLoading}
        />
        {errors.examDate && (
          <p className="mt-1 text-xs text-red-400">{errors.examDate}</p>
        )}
      </div>

      {/* Difficulty Weight */}
      <div>
        <label htmlFor="difficulty-weight" className={labelClasses}>
          Difficulty Weight
        </label>
        <select
          id="difficulty-weight"
          value={difficultyWeight}
          onChange={(e) => setDifficultyWeight(Number(e.target.value))}
          className={inputClasses}
          disabled={isLoading}
        >
          {[1, 2, 3, 4, 5].map((v) => (
            <option key={v} value={v}>
              {v} / 5
            </option>
          ))}
        </select>
        {errors.difficultyWeight && (
          <p className="mt-1 text-xs text-red-400">{errors.difficultyWeight}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
        >
          {isEditMode ? "Update Course" : "Create Course"}
        </Button>
      </div>
    </form>
  );
}
