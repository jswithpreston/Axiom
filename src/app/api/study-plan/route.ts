// =============================================================================
// GET /api/study-plan — Compute today's study plan with urgency-based allocation
// =============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb, courses } from "@/db";
import { eq } from "drizzle-orm";
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

export async function GET() {
  const auth = await getServerUserId();
  if (auth.error) return auth.error;
  const { userId } = auth;

  const courseList = await getDb()
    .select()
    .from(courses)
    .where(eq(courses.userId, userId));

  const plan = buildStudyPlan(courseList, 8);
  return NextResponse.json(plan);
}
