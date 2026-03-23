"use client";

import { useState, useEffect, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import type { FlashcardWithMeta, CreateFlashcardInput } from "@/types/domain";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FlashcardFormProps {
  readonly flashcard?: FlashcardWithMeta | undefined;
  readonly courses: readonly { readonly id: string; readonly name: string }[];
  readonly onSubmit: (data: CreateFlashcardInput) => void;
  readonly onCancel: () => void;
  readonly isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FlashcardForm({
  flashcard,
  courses,
  onSubmit,
  onCancel,
  isLoading = false,
}: FlashcardFormProps) {
  const [courseId, setCourseId] = useState<string>(
    flashcard?.courseId ?? (courses[0]?.id ?? "")
  );
  const [question, setQuestion] = useState<string>(flashcard?.question ?? "");
  const [answer, setAnswer] = useState<string>(flashcard?.answer ?? "");

  // Sync when editing flashcard changes
  useEffect(() => {
    if (flashcard) {
      setCourseId(flashcard.courseId);
      setQuestion(flashcard.question);
      setAnswer(flashcard.answer);
    } else {
      setCourseId(courses[0]?.id ?? "");
      setQuestion("");
      setAnswer("");
    }
  }, [flashcard, courses]);

  const isValid = courseId.length > 0 && question.trim().length > 0 && answer.trim().length > 0;

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({ courseId, question: question.trim(), answer: answer.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Course selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="fc-course"
          className="text-xs uppercase tracking-wider text-axiom-muted"
        >
          Course
        </label>
        <select
          id="fc-course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Question */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="fc-question"
          className="text-xs uppercase tracking-wider text-axiom-muted"
        >
          Question
        </label>
        <textarea
          id="fc-question"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter the question..."
          className="w-full resize-none rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text placeholder:text-axiom-muted/50 outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
        />
      </div>

      {/* Answer */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="fc-answer"
          className="text-xs uppercase tracking-wider text-axiom-muted"
        >
          Answer
        </label>
        <textarea
          id="fc-answer"
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter the answer..."
          className="w-full resize-none rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text placeholder:text-axiom-muted/50 outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid}
          loading={isLoading}
        >
          {flashcard ? "Update Flashcard" : "Create Flashcard"}
        </Button>
      </div>
    </form>
  );
}
