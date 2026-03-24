// =============================================================================
// GET /api/dashboard — Aggregate dashboard data
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards, reviewHistory } from "@/db";
import { eq, inArray } from "drizzle-orm";
import type { Course, Flashcard, ReviewHistoryRow } from "@/db";
import { getServerUserId } from "@/lib/getServerUserId";

function buildStudyPlan(
  courseList: { id: string; name: string; examDate: Date; difficultyWeight: number }[],
  dailyHours: number,
) {
  const now = new Date();
  const active = courseList.filter((c) => c.examDate.getTime() > now.getTime());
  if (active.length === 0) {
    return { date: now.toISOString(), allocations: [], totalHours: 0 };
  }
  const urgencies = active.map((c) => {
    const daysLeft = Math.max(
      1,
      Math.ceil((c.examDate.getTime() - now.getTime()) / 86400000),
    );
    const urgency = (1 / daysLeft) * c.difficultyWeight * (daysLeft <= 7 ? 2 : 1);
    return { courseId: c.id, courseName: c.name, urgency };
  });
  const total = urgencies.reduce((s, u) => s + u.urgency, 0);
  return {
    date: now.toISOString(),
    allocations: urgencies.map((u) => ({
      courseId: u.courseId,
      courseName: u.courseName,
      allocatedHours: Math.round((u.urgency / total) * dailyHours * 100) / 100,
      urgencyScore: Math.round(u.urgency * 10000) / 10000,
    })),
    totalHours: dailyHours,
  };
}

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

export async function GET() {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const now = new Date();

  const courseList = await getDb()
    .select()
    .from(courses)
    .where(eq(courses.userId, userId));

  const courseIds = courseList.map((c) => c.id);

  const [cardList, historyList] = await Promise.all([
    courseIds.length > 0
      ? getDb().select().from(flashcards).where(inArray(flashcards.courseId, courseIds))
      : Promise.resolve([] as Flashcard[]),
    courseIds.length > 0
      ? (async () => {
          const cardIds = (
            await getDb()
              .select({ id: flashcards.id })
              .from(flashcards)
              .where(inArray(flashcards.courseId, courseIds))
          ).map((f) => f.id);
          return cardIds.length > 0
            ? getDb()
                .select()
                .from(reviewHistory)
                .where(inArray(reviewHistory.flashcardId, cardIds))
            : ([] as ReviewHistoryRow[]);
        })()
      : Promise.resolve([] as ReviewHistoryRow[]),
  ]);

  const cardsByCourse = new Map<string, Flashcard[]>();
  for (const card of cardList) {
    const arr = cardsByCourse.get(card.courseId) ?? [];
    arr.push(card);
    cardsByCourse.set(card.courseId, arr);
  }

  const historyByCard = new Map<string, ReviewHistoryRow[]>();
  for (const row of historyList) {
    const arr = historyByCard.get(row.flashcardId) ?? [];
    arr.push(row);
    historyByCard.set(row.flashcardId, arr);
  }

  const studyPlan = buildStudyPlan(courseList, 8);

  interface CourseMetrics {
    course: Course;
    daysRemaining: number;
    totalReviews: number;
    correctReviews: number;
    qualitySum: number;
    accuracy: number;
    retentionScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  }

  const courseMetrics: CourseMetrics[] = courseList.map((c) => {
    const daysRemaining = Math.max(
      0,
      Math.ceil((c.examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const cards = cardsByCourse.get(c.id) ?? [];
    let totalReviews = 0;
    let correctReviews = 0;
    let qualitySum = 0;

    for (const card of cards) {
      const history = historyByCard.get(card.id) ?? [];
      totalReviews += history.length;
      for (const row of history) {
        if (row.quality >= 3) correctReviews++;
        qualitySum += row.quality;
      }
    }

    const accuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;
    const avgQuality = totalReviews > 0 ? qualitySum / totalReviews : 0;
    const retentionScore =
      totalReviews > 0 ? accuracy * 0.6 + (avgQuality / 5) * 0.4 : 0;

    return {
      course: c,
      daysRemaining,
      totalReviews,
      correctReviews,
      qualitySum,
      accuracy: Math.round(accuracy * 1000) / 1000,
      retentionScore: Math.round(retentionScore * 1000) / 1000,
      riskLevel: computeRiskLevel(totalReviews, correctReviews, daysRemaining),
    };
  });

  const withData = courseMetrics.filter((m) => m.totalReviews > 0);
  const retentionOverview = {
    avgRetention:
      withData.length > 0
        ? Math.round(
            (withData.reduce((s, m) => s + m.retentionScore, 0) / withData.length) * 1000,
          ) / 1000
        : 0,
    avgAccuracy:
      withData.length > 0
        ? Math.round(
            (withData.reduce((s, m) => s + m.accuracy, 0) / withData.length) * 1000,
          ) / 1000
        : 0,
  };

  const examCountdowns = courseMetrics
    .map((m) => ({
      courseId: m.course.id,
      courseName: m.course.name,
      daysRemaining: m.daysRemaining,
      riskLevel: m.riskLevel,
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const courseNameById = new Map<string, string>(courseList.map((c) => [c.id, c.name]));
  const weakestTopics = [...cardList]
    .sort((a, b) => a.easeFactor - b.easeFactor)
    .slice(0, 5)
    .map((f) => ({
      flashcardId: f.id,
      question: f.question,
      easeFactor: f.easeFactor,
      courseName: courseNameById.get(f.courseId) ?? "Unknown",
    }));

  const riskSummary = courseMetrics.map((m) => ({
    courseId: m.course.id,
    courseName: m.course.name,
    riskLevel: m.riskLevel,
  }));

  return NextResponse.json({
    studyPlan,
    retentionOverview,
    examCountdowns,
    weakestTopics,
    riskSummary,
  });
}
