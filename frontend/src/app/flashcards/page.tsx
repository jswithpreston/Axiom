"use client";

import { useState, useMemo, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import FlashcardList from "@/components/flashcards/FlashcardList";
import FlashcardForm from "@/components/flashcards/FlashcardForm";
import { useCourses } from "@/hooks/useCourses";
import {
  useFlashcards,
  useCreateFlashcard,
  useUpdateFlashcard,
  useDeleteFlashcard,
} from "@/hooks/useFlashcards";
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

  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();

  // ---- Modal state --------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFlashcard, setEditingFlashcard] = useState<
    FlashcardWithMeta | undefined
  >(undefined);

  const courseOptions = useMemo(
    () => courses.map((c) => ({ id: c.id, name: c.name })),
    [courses]
  );

  // ---- Handlers -----------------------------------------------------------
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

  // ---- Loading state ------------------------------------------------------
  const isLoading = coursesLoading || flashcardsLoading;
  const isMutating = createFlashcard.isPending || updateFlashcard.isPending;

  return (
    <>
      <TopBar title="Flashcards" subtitle="Manage study material" />

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Filter bar */}
        <div className="flex items-center justify-between">
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

          <Button variant="primary" onClick={handleOpenCreate}>
            Add Flashcard
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-axiom-muted">Loading flashcards...</p>
          </div>
        ) : (
          <FlashcardList
            flashcards={flashcards}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
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
    </>
  );
}
