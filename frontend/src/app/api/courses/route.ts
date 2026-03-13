// =============================================================================
// GET /api/courses  — List all courses with computed metadata
// POST /api/courses — Create a new course
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards, reviewHistory } from "@/db";
import { eq, inArray } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Risk level helper
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// GET /api/courses
// ---------------------------------------------------------------------------

export async function GET() {
  const now = new Date();

  // 1. Fetch all courses
  const allCourses = await getDb().select().from(courses);

  if (allCourses.length === 0) {
    return NextResponse.json([]);
  }

  const courseIds = allCourses.map((c) => c.id);

  // 2. Batch-fetch all flashcards for these courses
  const allFlashcards = await getDb()
    .select()
    .from(flashcards)
    .where(inArray(flashcards.courseId, courseIds));

  // 3. Batch-fetch all review history for those flashcards
  const flashcardIds = allFlashcards.map((f) => f.id);

  const allReviews =
    flashcardIds.length > 0
      ? await getDb()
          .select()
          .from(reviewHistory)
          .where(inArray(reviewHistory.flashcardId, flashcardIds))
      : [];

  // 4. Group flashcard IDs by courseId in memory
  const flashcardsByCourse = new Map<string, string[]>();
  for (const f of allFlashcards) {
    const existing = flashcardsByCourse.get(f.courseId) ?? [];
    existing.push(f.id);
    flashcardsByCourse.set(f.courseId, existing);
  }

  // 5. Group reviews by flashcardId in memory
  const reviewsByFlashcard = new Map<
    string,
    { quality: number; reviewedAt: Date }[]
  >();
  for (const r of allReviews) {
    const existing = reviewsByFlashcard.get(r.flashcardId) ?? [];
    existing.push({ quality: r.quality, reviewedAt: r.reviewedAt });
    reviewsByFlashcard.set(r.flashcardId, existing);
  }

  // 6. Build enriched response for each course
  const result = allCourses.map((c) => {
    const daysRemaining = Math.max(
      0,
      Math.ceil((c.examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const cardIds = flashcardsByCourse.get(c.id) ?? [];

    let totalReviews = 0;
    let correctReviews = 0;
    let qualitySum = 0;

    for (const fid of cardIds) {
      const history = reviewsByFlashcard.get(fid) ?? [];
      totalReviews += history.length;
      for (const r of history) {
        if (r.quality >= 3) correctReviews++;
        qualitySum += r.quality;
      }
    }

    const accuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;
    const avgQuality = totalReviews > 0 ? qualitySum / totalReviews : 0;
    const retentionScore =
      totalReviews > 0 ? accuracy * 0.6 + (avgQuality / 5) * 0.4 : 0;

    return {
      id: c.id,
      name: c.name,
      examDate: c.examDate.toISOString(),
      difficultyWeight: c.difficultyWeight,
      createdAt: c.createdAt.toISOString(),
      daysRemaining,
      riskLevel: computeRiskLevel(totalReviews, correctReviews, daysRemaining),
      retentionMetrics: {
        totalReviews,
        correctReviews,
        accuracy: Math.round(accuracy * 1000) / 1000,
        retentionScore: Math.round(retentionScore * 1000) / 1000,
      },
    };
  });

  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// POST /api/courses
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const body = await request.json();
  const { name, examDate, difficultyWeight } = body as {
    name?: string;
    examDate?: string;
    difficultyWeight?: number;
  };

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json(
      { message: "name is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  if (!examDate || typeof examDate !== "string") {
    return NextResponse.json(
      { message: "examDate is required as an ISO date string" },
      { status: 400 },
    );
  }

  const parsedExamDate = new Date(examDate);
  if (isNaN(parsedExamDate.getTime())) {
    return NextResponse.json(
      { message: "examDate must be a valid ISO date string" },
      { status: 400 },
    );
  }

  if (parsedExamDate.getTime() <= Date.now()) {
    return NextResponse.json(
      { message: "examDate must be a future date" },
      { status: 400 },
    );
  }

  if (
    difficultyWeight == null ||
    typeof difficultyWeight !== "number" ||
    difficultyWeight < 1 ||
    difficultyWeight > 5
  ) {
    return NextResponse.json(
      { message: "difficultyWeight must be a number between 1 and 5" },
      { status: 400 },
    );
  }

  const newId = crypto.randomUUID();
  const now = new Date();

  const [inserted] = await getDb()
    .insert(courses)
    .values({
      id: newId,
      name: name.trim(),
      examDate: parsedExamDate,
      difficultyWeight,
      createdAt: now,
    })
    .returning();

  if (!inserted) {
    return NextResponse.json(
      { message: "Failed to create course" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: inserted.id,
      name: inserted.name,
      examDate: inserted.examDate.toISOString(),
      difficultyWeight: inserted.difficultyWeight,
      createdAt: inserted.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
