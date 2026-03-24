import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };
  const { email, password, name } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { message: "An account with that email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();

  await getDb().insert(users).values({
    id,
    email: normalizedEmail,
    name: name?.trim() || null,
    passwordHash,
  });

  return NextResponse.json({ id, email: normalizedEmail }, { status: 201 });
}
