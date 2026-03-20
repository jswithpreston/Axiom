"use client";

import { useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneratedCard {
  question: string;
  answer: string;
}

interface ReviewCard extends GeneratedCard {
  included: boolean;
}

interface ImportReviewModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly cards: GeneratedCard[];
  readonly courses: readonly { readonly id: string; readonly name: string }[];
  readonly onConfirm: (courseId: string, cards: GeneratedCard[]) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportReviewModal({
  isOpen,
  onClose,
  cards: initialCards,
  courses,
  onConfirm,
}: ImportReviewModalProps) {
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>(() =>
    initialCards.map((c) => ({ ...c, included: true }))
  );
  const [courseId, setCourseId] = useState<string>(courses[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-initialise when cards prop changes (new import)
  useState(() => {
    setReviewCards(initialCards.map((c) => ({ ...c, included: true })));
    setCourseId(courses[0]?.id ?? "");
    setError(null);
  });

  const includedCount = reviewCards.filter((c) => c.included).length;

  const toggleCard = useCallback((index: number) => {
    setReviewCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, included: !c.included } : c))
    );
  }, []);

  const updateField = useCallback(
    (index: number, field: "question" | "answer", value: string) => {
      setReviewCards((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!courseId) return;
    const selected = reviewCards
      .filter((c) => c.included && c.question.trim() && c.answer.trim())
      .map(({ question, answer }) => ({ question, answer }));
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(courseId, selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save flashcards.");
      setSaving(false);
    }
  }, [courseId, reviewCards, onConfirm]);

  const handleSelectAll = useCallback(() => {
    setReviewCards((prev) => prev.map((c) => ({ ...c, included: true })));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setReviewCards((prev) => prev.map((c) => ({ ...c, included: false })));
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Generated Flashcards" size="lg">
      <div className="flex flex-col gap-5">
        {/* Course selector + count summary */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="import-course"
              className="text-xs uppercase tracking-wider text-axiom-muted"
            >
              Save to course
            </label>
            <select
              id="import-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="rounded-md border border-axiom-border bg-axiom-bg px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-axiom-muted">
              {includedCount} / {reviewCards.length} selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-axiom-accent transition-colors hover:text-axiom-accent/70"
            >
              All
            </button>
            <span className="text-axiom-border">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs text-axiom-muted transition-colors hover:text-axiom-text"
            >
              None
            </button>
          </div>
        </div>

        {/* Card list */}
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
          {reviewCards.map((card, i) => (
            <div
              key={i}
              className={`rounded-md border p-4 transition-colors ${
                card.included
                  ? "border-axiom-border bg-axiom-bg"
                  : "border-axiom-border/40 bg-axiom-bg/40 opacity-50"
              }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleCard(i)}
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    card.included
                      ? "border-axiom-accent bg-axiom-accent"
                      : "border-axiom-border bg-transparent"
                  }`}
                  aria-label={card.included ? "Exclude card" : "Include card"}
                >
                  {card.included && (
                    <svg
                      className="h-2.5 w-2.5 text-white"
                      viewBox="0 0 10 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 4l3 3 5-6" />
                    </svg>
                  )}
                </button>
                <span className="text-xs tabular-nums text-axiom-muted">#{i + 1}</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-axiom-muted">
                    Question
                  </span>
                  <textarea
                    rows={2}
                    value={card.question}
                    onChange={(e) => updateField(i, "question", e.target.value)}
                    disabled={!card.included}
                    className="w-full resize-none rounded border border-axiom-border bg-axiom-surface px-2.5 py-1.5 text-sm text-axiom-text placeholder:text-axiom-muted/50 outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-axiom-muted">
                    Answer
                  </span>
                  <textarea
                    rows={2}
                    value={card.answer}
                    onChange={(e) => updateField(i, "answer", e.target.value)}
                    disabled={!card.included}
                    className="w-full resize-none rounded border border-axiom-border bg-axiom-surface px-2.5 py-1.5 text-sm text-axiom-text placeholder:text-axiom-muted/50 outline-none transition-colors focus:border-axiom-accent focus:ring-1 focus:ring-axiom-accent disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-axiom-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={includedCount === 0 || !courseId}
            loading={saving}
          >
            Save {includedCount} Flashcard{includedCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
