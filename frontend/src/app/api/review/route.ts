// =============================================================================
// POST /api/review — Submit a review and update flashcard via SM-2 algorithm
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, flashcards, reviewHistory } from "@/db";
import { eq } from "drizzle-orm";

// SM-2 helpers
function computeNewEaseFactor(ef: number, quality: number): number {
  const delta = 5 - quality;
  return Math.max(1.3, ef + (0.1 - delta * (0.08 + delta * 0.02)));
}

function computeNewInterval(repetition: number, prevInterval: number, ef: number): number {
  if (repetition <= 1) return 1;
  if (repetition === 2) return 6;
  return Math.round(prevInterval * ef);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { flashcardId, quality } = body;

  if (!flashcardId || quality == null) {
    return NextResponse.json(
      { message: "Missing required fields: flashcardId, quality" },
      { status: 400 },
    );
  }

  if (
    typeof quality !== "number" ||
    !Number.isInteger(quality) ||
    quality < 0 ||
    quality > 5
  ) {
    return NextResponse.json(
      { message: "Quality must be an integer between 0 and 5" },
      { status: 400 },
    );
  }

  const [card] = await getDb()
    .select()
    .from(flashcards)
    .where(eq(flashcards.id, flashcardId))
    .limit(1);

  if (!card) {
    return NextResponse.json({ message: "Flashcard not found" }, { status: 404 });
  }

  const now = new Date();
  const q: number = quality;

  let { repetition, interval, easeFactor } = card;

  if (q < 3) {
    // Failed review: reset
    repetition = 0;
    interval = 1;
  } else {
    repetition += 1;
    interval = computeNewInterval(repetition, interval, easeFactor);
  }

  easeFactor = Math.round(computeNewEaseFactor(easeFactor, q) * 100) / 100;
  const nextReviewDate = addDays(now, interval);

  const [updated] = await getDb()
    .update(flashcards)
    .set({
      repetition,
      interval,
      easeFactor,
      nextReviewDate,
      lastReviewedAt: now,
    })
    .where(eq(flashcards.id, flashcardId))
    .returning();

  await getDb().insert(reviewHistory).values({
    id: crypto.randomUUID(),
    flashcardId,
    quality: q,
    reviewedAt: now,
  });

  return NextResponse.json({
    id: updated!.id,
    courseId: updated!.courseId,
    question: updated!.question,
    answer: updated!.answer,
    easeFactor: updated!.easeFactor,
    interval: updated!.interval,
    repetition: updated!.repetition,
    nextReviewDate: updated!.nextReviewDate.toISOString(),
    lastReviewedAt: updated!.lastReviewedAt?.toISOString() ?? null,
  });
}
