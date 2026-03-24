import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

type Result =
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: NextResponse };

export async function getServerUserId(): Promise<Result> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}
