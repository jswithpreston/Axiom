// =============================================================================
// Axiom — Database Seed Script
// Run once after db:push to populate initial data.
// Usage: npm run db:seed
// NOTE: Creates a seed user — change the password before using in production.
// =============================================================================

import bcrypt from "bcryptjs";
import { getDb, users, courses, flashcards, reviewHistory } from "./index";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function seed() {
  console.log("Seeding database...");

  const now = new Date();

  // Clear in correct order (FK constraints)
  await getDb().delete(reviewHistory);
  await getDb().delete(flashcards);
  await getDb().delete(courses);
  await getDb().delete(users);

  // ── Seed User ─────────────────────────────────────────────────────────
  const seedUserId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash("axiom-seed-2024", 12);

  const [seedUser] = await getDb()
    .insert(users)
    .values({
      id: seedUserId,
      email: "seed@axiom.app",
      name: "Seed User",
      passwordHash,
    })
    .returning();

  if (!seedUser) throw new Error("User insert failed");

  const userId = seedUser.id;

  // ── Courses ──────────────────────────────────────────────────────────
  const [c1, c2, c3] = await getDb()
    .insert(courses)
    .values([
      {
        id: crypto.randomUUID(),
        userId,
        name: "Linear Algebra",
        examDate: addDays(now, 30),
        difficultyWeight: 4,
        createdAt: addDays(now, -14),
      },
      {
        id: crypto.randomUUID(),
        userId,
        name: "Organic Chemistry",
        examDate: addDays(now, 12),
        difficultyWeight: 5,
        createdAt: addDays(now, -21),
      },
      {
        id: crypto.randomUUID(),
        userId,
        name: "Data Structures",
        examDate: addDays(now, 45),
        difficultyWeight: 3,
        createdAt: addDays(now, -10),
      },
    ])
    .returning();

  if (!c1 || !c2 || !c3) throw new Error("Course insert failed");

  // ── Flashcards ────────────────────────────────────────────────────────
  const cardValues = [
    // Linear Algebra
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c1.id,
      question: "What is the determinant of a 2x2 matrix [[a,b],[c,d]]?",
      answer: "ad − bc",
      easeFactor: 2.5,
      interval: 6,
      repetition: 2,
      nextReviewDate: addDays(now, 1),
      lastReviewedAt: addDays(now, -5),
    },
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c1.id,
      question: "Define eigenvalue.",
      answer: "A scalar λ such that Av = λv for some nonzero vector v.",
      easeFactor: 2.2,
      interval: 3,
      repetition: 1,
      nextReviewDate: addDays(now, -1),
      lastReviewedAt: addDays(now, -4),
    },
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c1.id,
      question: "What does it mean for vectors to be linearly independent?",
      answer: "No vector can be written as a linear combination of the others.",
      easeFactor: 1.8,
      interval: 1,
      repetition: 0,
      nextReviewDate: now,
      lastReviewedAt: addDays(now, -2),
    },
    // Organic Chemistry
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c2.id,
      question: "What is Markovnikov's rule?",
      answer: "In HX addition to an alkene, H adds to the carbon with more H atoms.",
      easeFactor: 1.5,
      interval: 1,
      repetition: 0,
      nextReviewDate: addDays(now, -2),
      lastReviewedAt: addDays(now, -3),
    },
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c2.id,
      question: "What is an SN2 reaction?",
      answer: "One-step nucleophilic substitution with backside attack and inversion of configuration.",
      easeFactor: 2.0,
      interval: 4,
      repetition: 2,
      nextReviewDate: addDays(now, 2),
      lastReviewedAt: addDays(now, -2),
    },
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c2.id,
      question: "What functional group does an aldehyde contain?",
      answer: "A terminal carbonyl group (−CHO).",
      easeFactor: 2.8,
      interval: 10,
      repetition: 3,
      nextReviewDate: addDays(now, 5),
      lastReviewedAt: addDays(now, -5),
    },
    // Data Structures
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c3.id,
      question: "What is the time complexity of searching in a balanced BST?",
      answer: "O(log n)",
      easeFactor: 2.6,
      interval: 8,
      repetition: 3,
      nextReviewDate: addDays(now, 3),
      lastReviewedAt: addDays(now, -5),
    },
    {
      id: crypto.randomUUID(),
      userId,
      courseId: c3.id,
      question: "What is the difference between a stack and a queue?",
      answer: "Stack is LIFO (last in, first out); queue is FIFO (first in, first out).",
      easeFactor: 1.4,
      interval: 1,
      repetition: 0,
      nextReviewDate: addDays(now, -1),
      lastReviewedAt: addDays(now, -3),
    },
  ];

  const insertedCards = await getDb().insert(flashcards).values(cardValues).returning();

  // ── Review History ────────────────────────────────────────────────────
  const qualitySets: number[][] = [
    [4, 3, 5],
    [3, 2, 4],
    [2, 1, 2],
    [1, 2, 1],
    [3, 4, 5],
    [5, 4, 4],
    [4, 5, 4, 3],
    [2, 1, 3, 2],
  ];

  const historyValues = insertedCards.flatMap((card, i) => {
    const qualities = qualitySets[i] ?? [3, 4];
    return qualities.map((quality, j) => ({
      id: crypto.randomUUID(),
      flashcardId: card.id,
      quality,
      reviewedAt: addDays(now, -(qualities.length - j) * 3),
    }));
  });

  await getDb().insert(reviewHistory).values(historyValues);

  console.log(
    `Seeded: user (${seedUser.email}), ${insertedCards.length} flashcards, ${historyValues.length} review records across 3 courses.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
