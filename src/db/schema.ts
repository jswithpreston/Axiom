// =============================================================================
// Axiom — Drizzle ORM Schema
// PostgreSQL (Neon serverless)
// =============================================================================

import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  examDate: timestamp("exam_date", { mode: "date", withTimezone: true }).notNull(),
  difficultyWeight: integer("difficulty_weight").notNull(),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1),
  repetition: integer("repetition").notNull().default(0),
  nextReviewDate: timestamp("next_review_date", { mode: "date", withTimezone: true }).notNull(),
  lastReviewedAt: timestamp("last_reviewed_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reviewHistory = pgTable("review_history", {
  id: text("id").primaryKey(),
  flashcardId: text("flashcard_id")
    .notNull()
    .references(() => flashcards.id, { onDelete: "cascade" }),
  quality: integer("quality").notNull(),
  reviewedAt: timestamp("reviewed_at", { mode: "date", withTimezone: true }).notNull(),
});

// Inferred types for use across the app
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;
export type ReviewHistoryRow = typeof reviewHistory.$inferSelect;
export type NewReviewHistory = typeof reviewHistory.$inferInsert;
