"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import ReviewSession from "@/features/reviews/ReviewSession";
import { useCourses } from "@/hooks/useCourses";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReviewsPage() {
  const { data: courses = [] } = useCourses();
  const [filterCourseId, setFilterCourseId] = useState<string>("");

  return (
    <>
      <TopBar title="Review Session" subtitle="Spaced repetition review" />

      <div className="flex flex-1 flex-col p-6">
        {/* Optional course filter */}
        <div className="mb-6 flex items-center">
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

        {/* Review session — centered */}
        <div className="flex flex-1 justify-center">
          <div className="w-full max-w-2xl">
            <ReviewSession
              courseId={filterCourseId || undefined}
            />
          </div>
        </div>
      </div>
    </>
  );
}
