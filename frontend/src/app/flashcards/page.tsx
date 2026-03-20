"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { TopBar } from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FlashcardList from "@/components/flashcards/FlashcardList";
import FlashcardForm from "@/components/flashcards/FlashcardForm";
import ImportReviewModal, {
  type GeneratedCard,
} from "@/components/flashcards/ImportReviewModal";
import { useCourses } from "@/hooks/useCourses";
import {
  useFlashcards,
  useCreateFlashcard,
  useUpdateFlashcard,
  useDeleteFlashcard,
} from "@/hooks/useFlashcards";
import { useQueryClient } from "@tanstack/react-query";
import type { FlashcardWithMeta, CreateFlashcardInput } from "@/types/domain";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FlashcardsPage() {
  // ---- Data hooks ---------------------------------------------------------
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const [filterCourseId, setFilterCourseId] = useState<string>("");
  const { data: flashcards = [], isLoading: flashcardsLoading } = useFlashcards(
    filterCourseId || undefined
  );
  const queryClient = useQueryClient();

  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();

  // ---- Manual create/edit modal state ------------------------------------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFlashcard, setEditingFlashcard] = useState<
    FlashcardWithMeta | undefined
  >(undefined);

  // ---- Import state -------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // ---- Drag-and-drop state ------------------------------------------------
  const [isDragOver, setIsDragOver] = useState(false);

  const courseOptions = useMemo(
    () => courses.map((c) => ({ id: c.id, name: c.name })),
    [courses]
  );

  // ---- Manual flashcard handlers -----------------------------------------
  const handleOpenCreate = useCallback(() => {
    setEditingFlashcard(undefined);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((fc: FlashcardWithMeta) => {
    setEditingFlashcard(fc);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingFlashcard(undefined);
  }, []);

  const handleSubmit = useCallback(
    (data: CreateFlashcardInput) => {
      if (editingFlashcard) {
        updateFlashcard.mutate(
          { id: editingFlashcard.id, input: data },
          { onSuccess: () => handleCloseModal() }
        );
      } else {
        createFlashcard.mutate(data, {
          onSuccess: () => handleCloseModal(),
        });
      }
    },
    [editingFlashcard, createFlashcard, updateFlashcard, handleCloseModal]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteFlashcard.mutate(id);
    },
    [deleteFlashcard]
  );

  // ---- Import handlers ----------------------------------------------------
  const processFile = useCallback(async (file: File) => {
    setImportError(null);
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = (await res.json()) as { cards?: GeneratedCard[]; message?: string };
      if (!res.ok) {
        setImportError(data.message ?? "Import failed.");
        return;
      }
      if (!data.cards || data.cards.length === 0) {
        setImportError("No flashcards were generated from that file.");
        return;
      }
      setGeneratedCards(data.cards);
      setIsReviewOpen(true);
    } catch {
      setImportError("Network error. Please try again.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleConfirmImport = useCallback(
    async (courseId: string, cards: GeneratedCard[]) => {
      const res = await fetch("/api/flashcards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, cards }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? "Failed to save flashcards.");
      }
      setIsReviewOpen(false);
      setGeneratedCards([]);
      await queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
    [queryClient]
  );

  // ---- Render -------------------------------------------------------------
  const isLoading = coursesLoading || flashcardsLoading;
  const isMutating = createFlashcard.isPending || updateFlashcard.isPending;

  return (
    <>
      <TopBar title="Flashcards" subtitle="Manage study material" />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Filter + action bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="rounded-md border border-axiom-border bg-axiom-surface px-3 py-2 text-sm text-axiom-text outline-none transition-colors focus:border-axiom-accent"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              loading={importing}
              disabled={importing || courseOptions.length === 0}
            >
              {importing ? "Analysing…" : "Import from Notes"}
            </Button>
            <Button variant="primary" onClick={handleOpenCreate}>
              Add Flashcard
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Import error banner */}
        {importError && (
          <div className="flex items-center justify-between rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2.5">
            <p className="text-sm text-red-400">{importError}</p>
            <button
              type="button"
              onClick={() => setImportError(null)}
              className="ml-4 text-red-400/60 transition-colors hover:text-red-400"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-axiom-muted">Loading flashcards…</p>
          </div>
        ) : flashcards.length === 0 ? (
          /* Empty state — large drop zone */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-20 text-center transition-colors ${
              isDragOver
                ? "border-axiom-accent bg-axiom-accent/5"
                : "border-axiom-border"
            }`}
          >
            <svg
              className={`h-10 w-10 transition-colors ${
                isDragOver ? "text-axiom-accent" : "text-axiom-border"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <div>
              <p className="text-sm text-axiom-text">
                Drop your notes here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-axiom-accent underline-offset-2 hover:underline"
                >
                  browse to upload
                </button>
              </p>
              <p className="mt-1 text-xs text-axiom-muted">PDF, TXT, or Markdown</p>
            </div>
          </div>
        ) : (
          <>
            {/* Inline drop hint when cards already exist */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`rounded-md border border-dashed px-4 py-2 text-center text-xs transition-colors ${
                isDragOver
                  ? "border-axiom-accent bg-axiom-accent/5 text-axiom-accent"
                  : "border-axiom-border/40 text-axiom-muted"
              }`}
            >
              Drop a notes file here to generate flashcards
            </div>
            <FlashcardList
              flashcards={flashcards}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingFlashcard ? "Edit Flashcard" : "New Flashcard"}
        size="md"
      >
        <FlashcardForm
          flashcard={editingFlashcard}
          courses={courseOptions}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isMutating}
        />
      </Modal>

      {/* Import Review Modal */}
      <ImportReviewModal
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setGeneratedCards([]);
        }}
        cards={generatedCards}
        courses={courseOptions}
        onConfirm={handleConfirmImport}
      />
    </>
  );
}
