"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate, formatEaseFactor } from "@/utils/formatters";
import type { FlashcardWithMeta } from "@/types/domain";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FlashcardListProps {
  readonly flashcards: readonly FlashcardWithMeta[];
  readonly onEdit: (flashcard: FlashcardWithMeta) => void;
  readonly onDelete: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FlashcardList({
  flashcards,
  onEdit,
  onDelete,
}: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-axiom-muted">No flashcards found.</p>
        <p className="mt-1 text-xs text-axiom-muted">
          Create your first flashcard to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {flashcards.map((fc) => (
        <Card key={fc.id} className="group flex flex-col justify-between">
          {/* Question */}
          <div>
            <h4 className="text-sm font-medium text-axiom-text">
              {truncate(fc.question, 80)}
            </h4>
            <p className="mt-2 text-sm text-axiom-muted">
              {truncate(fc.answer, 120)}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-axiom-border pt-4">
            <div className="flex items-center gap-2">
              <Badge>{fc.courseName}</Badge>
              <span className="text-xs text-axiom-muted">
                EF {formatEaseFactor(fc.easeFactor)}
              </span>
            </div>
            <span className="text-xs text-axiom-muted">
              {formatDate(fc.nextReviewDate)}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(fc)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(fc.id)}
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
