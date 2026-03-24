// =============================================================================
// POST /api/flashcards/bulk — Batch-create flashcards with SM-2 defaults
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards } from "@/db";
import { eq, and } from "drizzle-orm";
import { getServerUserId } from "@/lib/getServerUserId";

interface CardInput {
  question: string;
  answer: string;
}

export async function POST(request: Request) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const body = (await request.json()) as { courseId?: string; cards?: CardInput[] };
  const { courseId, cards } = body;

  if (
    !courseId ||
    typeof courseId !== "string" ||
    !Array.isArray(cards) ||
    cards.length === 0
  ) {
    return NextResponse.json(
      { message: "Missing required fields: courseId and a non-empty cards array" },
      { status: 400 },
    );
  }

  const [courseRow] = await getDb()
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.userId, userId)))
    .limit(1);

  if (!courseRow) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  const now = new Date();

  const values = cards
    .filter(
      (c) =>
        c &&
        typeof c.question === "string" &&
        c.question.trim().length > 0 &&
        typeof c.answer === "string" &&
        c.answer.trim().length > 0,
    )
    .map((c) => ({
      id: crypto.randomUUID(),
      userId,
      courseId: courseRow.id,
      question: c.question.trim(),
      answer: c.answer.trim(),
      easeFactor: 2.5,
      interval: 1,
      repetition: 0,
      nextReviewDate: now,
      createdAt: now,
    }));

  if (values.length === 0) {
    return NextResponse.json(
      { message: "All submitted cards had empty question or answer fields." },
      { status: 400 },
    );
  }

  const inserted = await getDb()
    .insert(flashcards)
    .values(values)
    .returning({ id: flashcards.id });

  return NextResponse.json({ created: inserted.length }, { status: 201 });
}
