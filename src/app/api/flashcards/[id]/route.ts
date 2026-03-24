// =============================================================================
// GET    /api/flashcards/[id] — Get a single flashcard
// PUT    /api/flashcards/[id] — Partial update of a flashcard
// DELETE /api/flashcards/[id] — Delete a flashcard (cascade handles history)
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards } from "@/db";
import { eq, and } from "drizzle-orm";
import { getServerUserId } from "@/lib/getServerUserId";

type RouteContext = { params: Promise<{ id: string }> };

function serializeCard(
  f: {
    id: string;
    courseId: string;
    question: string;
    answer: string;
    easeFactor: number;
    interval: number;
    repetition: number;
    nextReviewDate: Date;
    lastReviewedAt: Date | null;
    createdAt: Date;
  },
  courseName: string,
) {
  return {
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
    courseName,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { id } = await context.params;

  const [card] = await getDb()
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))
    .limit(1);

  if (!card) {
    return NextResponse.json({ message: "Flashcard not found" }, { status: 404 });
  }

  const [courseRow] = await getDb()
    .select({ name: courses.name })
    .from(courses)
    .where(eq(courses.id, card.courseId))
    .limit(1);

  return NextResponse.json(serializeCard(card, courseRow?.name ?? "Unknown"));
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { id } = await context.params;

  const [existing] = await getDb()
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ message: "Flashcard not found" }, { status: 404 });
  }

  const body = await request.json();

  const updates: Partial<{
    question: string;
    answer: string;
    easeFactor: number;
    interval: number;
    repetition: number;
    nextReviewDate: Date;
  }> = {};

  if (body.question !== undefined) {
    if (typeof body.question !== "string" || (body.question as string).trim() === "") {
      return NextResponse.json(
        { message: "question must be a non-empty string" },
        { status: 400 },
      );
    }
    updates.question = (body.question as string).trim();
  }

  if (body.answer !== undefined) {
    if (typeof body.answer !== "string" || (body.answer as string).trim() === "") {
      return NextResponse.json(
        { message: "answer must be a non-empty string" },
        { status: 400 },
      );
    }
    updates.answer = (body.answer as string).trim();
  }

  if (body.easeFactor !== undefined) updates.easeFactor = body.easeFactor as number;
  if (body.interval !== undefined) updates.interval = body.interval as number;
  if (body.repetition !== undefined) updates.repetition = body.repetition as number;

  if (body.nextReviewDate !== undefined) {
    const parsed = new Date(body.nextReviewDate as string);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { message: "nextReviewDate must be a valid ISO date string" },
        { status: 400 },
      );
    }
    updates.nextReviewDate = parsed;
  }

  const [courseRow] = await getDb()
    .select({ name: courses.name })
    .from(courses)
    .where(eq(courses.id, existing.courseId))
    .limit(1);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(serializeCard(existing, courseRow?.name ?? "Unknown"));
  }

  const [updated] = await getDb()
    .update(flashcards)
    .set(updates)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ message: "Failed to update flashcard" }, { status: 500 });
  }

  return NextResponse.json(serializeCard(updated, courseRow?.name ?? "Unknown"));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { id } = await context.params;

  const [existing] = await getDb()
    .select({ id: flashcards.id })
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ message: "Flashcard not found" }, { status: 404 });
  }

  await getDb()
    .delete(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)));

  return new NextResponse(null, { status: 204 });
}
