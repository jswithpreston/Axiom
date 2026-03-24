// =============================================================================
// GET  /api/flashcards  — List flashcards (optional ?courseId filter)
// POST /api/flashcards  — Create a flashcard with SM-2 defaults
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards } from "@/db";
import { eq, inArray, and } from "drizzle-orm";
import { getServerUserId } from "@/lib/getServerUserId";

export async function GET(request: Request) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  const cardRows = await getDb()
    .select()
    .from(flashcards)
    .where(
      courseId
        ? and(eq(flashcards.userId, userId), eq(flashcards.courseId, courseId))
        : eq(flashcards.userId, userId),
    );

  if (cardRows.length === 0) {
    return NextResponse.json([]);
  }

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

export async function POST(request: Request) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const body = await request.json();
  const { courseId, question, answer } = body as {
    courseId?: string;
    question?: string;
    answer?: string;
  };

  if (
    !courseId ||
    typeof courseId !== "string" ||
    !question ||
    typeof question !== "string" ||
    question.trim() === "" ||
    !answer ||
    typeof answer !== "string" ||
    answer.trim() === ""
  ) {
    return NextResponse.json(
      { message: "Missing required fields: courseId, question, answer" },
      { status: 400 },
    );
  }

  const [courseRow] = await getDb()
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
    .limit(1);

  if (!courseRow) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  const now = new Date();
  const newId = crypto.randomUUID();

  const [inserted] = await getDb()
    .insert(flashcards)
    .values({
      id: newId,
      userId,
      courseId: courseRow.id,
      question: question.trim(),
      answer: answer.trim(),
      easeFactor: 2.5,
      interval: 1,
      repetition: 0,
      nextReviewDate: now,
      createdAt: now,
    })
    .returning();

  if (!inserted) {
    return NextResponse.json(
      { message: "Failed to create flashcard" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: inserted.id,
      courseId: inserted.courseId,
      question: inserted.question,
      answer: inserted.answer,
      easeFactor: inserted.easeFactor,
      interval: inserted.interval,
      repetition: inserted.repetition,
      nextReviewDate: inserted.nextReviewDate.toISOString(),
      lastReviewedAt: inserted.lastReviewedAt?.toISOString() ?? null,
      createdAt: inserted.createdAt.toISOString(),
      courseName: courseRow.name,
    },
    { status: 201 },
  );
}
