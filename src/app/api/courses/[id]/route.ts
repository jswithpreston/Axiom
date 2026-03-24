// =============================================================================
// GET    /api/courses/[id] — Get a single course with metadata
// PUT    /api/courses/[id] — Partial update of a course
// DELETE /api/courses/[id] — Delete course (cascade handles flashcards+history)
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards, reviewHistory } from "@/db";
import { eq, inArray, and } from "drizzle-orm";
import { getServerUserId } from "@/lib/getServerUserId";

function computeRiskLevel(
  totalReviews: number,
  correctReviews: number,
  daysRemaining: number,
): "LOW" | "MEDIUM" | "HIGH" {
  const accuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;
  if (daysRemaining <= 7 && accuracy < 0.6) return "HIGH";
  if (daysRemaining <= 14 && accuracy < 0.5) return "HIGH";
  if (daysRemaining <= 7) return "MEDIUM";
  if (accuracy < 0.5) return "MEDIUM";
  if (daysRemaining <= 21 && accuracy < 0.7) return "MEDIUM";
  return "LOW";
}

async function enrichCourse(course: {
  id: string;
  name: string;
  examDate: Date;
  difficultyWeight: number;
  createdAt: Date;
}) {
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (course.examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const cardRows = await getDb()
    .select({ id: flashcards.id })
    .from(flashcards)
    .where(eq(flashcards.courseId, course.id));

  const cardIds = cardRows.map((r) => r.id);

  let totalReviews = 0;
  let correctReviews = 0;

  if (cardIds.length > 0) {
    const reviews = await getDb()
      .select({ quality: reviewHistory.quality })
      .from(reviewHistory)
      .where(inArray(reviewHistory.flashcardId, cardIds));

    totalReviews = reviews.length;
    correctReviews = reviews.filter((r) => r.quality >= 3).length;
  }

  return {
    id: course.id,
    name: course.name,
    examDate: course.examDate.toISOString(),
    difficultyWeight: course.difficultyWeight,
    createdAt: course.createdAt.toISOString(),
    daysRemaining,
    riskLevel: computeRiskLevel(totalReviews, correctReviews, daysRemaining),
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { id } = await context.params;

  const [course] = await getDb()
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .limit(1);

  if (!course) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  return NextResponse.json(await enrichCourse(course));
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { id } = await context.params;

  const [existing] = await getDb()
    .select()
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  const body = await request.json();

  const updates: Partial<{
    name: string;
    examDate: Date;
    difficultyWeight: number;
  }> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || (body.name as string).trim() === "") {
      return NextResponse.json(
        { message: "name must be a non-empty string" },
        { status: 400 },
      );
    }
    updates.name = (body.name as string).trim();
  }

  if (body.examDate !== undefined) {
    const parsed = new Date(body.examDate as string);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { message: "examDate must be a valid ISO date string" },
        { status: 400 },
      );
    }
    updates.examDate = parsed;
  }

  if (body.difficultyWeight !== undefined) {
    const dw = body.difficultyWeight as number;
    if (typeof dw !== "number" || dw < 1 || dw > 5) {
      return NextResponse.json(
        { message: "difficultyWeight must be a number between 1 and 5" },
        { status: 400 },
      );
    }
    updates.difficultyWeight = dw;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(await enrichCourse(existing));
  }

  const [updated] = await getDb()
    .update(courses)
    .set(updates)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { message: "Failed to update course" },
      { status: 500 },
    );
  }

  return NextResponse.json(await enrichCourse(updated));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { id } = await context.params;

  const [existing] = await getDb()
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  await getDb()
    .delete(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)));

  return new NextResponse(null, { status: 204 });
}
