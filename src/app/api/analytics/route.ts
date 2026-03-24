// =============================================================================
// GET /api/analytics — Retention trends, accuracy trends, study distribution
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses, flashcards, reviewHistory } from "@/db";
import { eq, inArray } from "drizzle-orm";
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

export async function GET(request: Request) {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const now = new Date();

  const courseList = courseId
    ? await getDb()
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
    : await getDb().select().from(courses).where(eq(courses.userId, userId));

  const courseIds = courseList.map((c) => c.id);
  const cardList =
    courseIds.length > 0
      ? await getDb()
          .select()
          .from(flashcards)
          .where(inArray(flashcards.courseId, courseIds))
      : [];

  const cardIds = cardList.map((f) => f.id);
  const historyList =
    cardIds.length > 0
      ? await getDb()
          .select()
          .from(reviewHistory)
          .where(inArray(reviewHistory.flashcardId, cardIds))
      : [];

  const dayBuckets = new Map<string, { total: number; correct: number; qualitySum: number }>();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0] as string;
    dayBuckets.set(key, { total: 0, correct: 0, qualitySum: 0 });
  }

  for (const row of historyList) {
    const dateStr = row.reviewedAt.toISOString().split("T")[0] as string;
    const bucket = dayBuckets.get(dateStr);
    if (bucket) {
      bucket.total++;
      bucket.qualitySum += row.quality;
      if (row.quality >= 3) bucket.correct++;
    }
  }

  const retentionTrend = Array.from(dayBuckets.entries()).map(([date, bucket]) => {
    let score: number | null = null;
    if (bucket.total > 0) {
      const accuracy = bucket.correct / bucket.total;
      const avgQuality = bucket.qualitySum / bucket.total;
      score = Math.round((accuracy * 0.6 + (avgQuality / 5) * 0.4) * 1000) / 1000;
    }
    return { date, score };
  });

  const accuracyTrend = Array.from(dayBuckets.entries()).map(([date, bucket]) => {
    const accuracy =
      bucket.total > 0
        ? Math.round((bucket.correct / bucket.total) * 1000) / 1000
        : null;
    return { date, accuracy };
  });

  const plan = buildStudyPlan(courseList, 8);
  const studyHoursDistribution = plan.allocations.map((a) => ({
    courseId: a.courseId,
    courseName: a.courseName,
    hours: a.allocatedHours,
  }));

  return NextResponse.json({
    retentionTrend,
    accuracyTrend,
    studyHoursDistribution,
  });
}
