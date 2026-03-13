// =============================================================================
// GET /api/flashcards/due — Flashcards with nextReviewDate <= now
//                           Optional ?courseId filter
//                           Ordered by nextReviewDate asc
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards } from "@/db";
import { eq, lte, and, asc, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const now = new Date();

  // Build query: nextReviewDate <= now, optional courseId filter, ordered asc
  const cardRows = courseId
    ? await getDb()
        .select()
        .from(flashcards)
        .where(
          and(
            lte(flashcards.nextReviewDate, now),
            eq(flashcards.courseId, courseId),
          ),
        )
        .orderBy(asc(flashcards.nextReviewDate))
    : await getDb()
        .select()
        .from(flashcards)
        .where(lte(flashcards.nextReviewDate, now))
        .orderBy(asc(flashcards.nextReviewDate));

  if (cardRows.length === 0) {
    return NextResponse.json([]);
  }

  // Batch-fetch course names for all unique courseIds present
  const uniqueCourseIds = [...new Set(cardRows.map((f) => f.courseId))];

  const courseRows = await getDb()
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(inArray(courses.id, uniqueCourseIds));

  const courseNameById = new Map<string, string>();
  for (const c of courseRows) {
    courseNameById.set(c.id, c.name);
  }

  const result = cardRows.map((f) => ({
    id: f.id,
    courseId: f.courseId,
    question: f.question,
    answer: f.answer,
    easeFactor: f.easeFactor,
    interval: f.interval,
    repetition: f.repetition,
    nextReviewDate: f.nextReviewDate.toISOString(),
    lastReviewedAt: f.lastReviewedAt?.toISOString() ?? null,
    createdAt: f.createdAt.toISOString(),
    courseName: courseNameById.get(f.courseId) ?? "Unknown",
  }));

  return NextResponse.json(result);
}
