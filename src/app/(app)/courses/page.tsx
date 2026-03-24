"use client";

import { useState, useCallback } from "react";
import type { CourseWithMeta, CreateCourseInput } from "@/types/domain";
import { TopBar } from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import CourseTable from "@/components/courses/CourseTable";
import CourseForm from "@/components/courses/CourseForm";
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "@/hooks/useCourses";

export default function CoursesPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithMeta | null>(
    null
  );

  const { data: courses, isLoading, error } = useCourses();
  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();

  const openCreateModal = useCallback(() => {
    setEditingCourse(null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((course: CourseWithMeta) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCourse(null);
  }, []);

  const handleSubmit = useCallback(
    async (data: CreateCourseInput) => {
      try {
        if (editingCourse) {
          await updateMutation.mutateAsync({ id: editingCourse.id, input: data });
        } else {
          await createMutation.mutateAsync(data);
        }
        closeModal();
      } catch {
        // error displayed via mutation.error below
      }
    },
    [editingCourse, updateMutation, createMutation, closeModal]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this course? This action cannot be undone."
      );
      if (!confirmed) return;

      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const isMutating =
    createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <TopBar title="Courses" subtitle="Manage academic courses" />

      <div className="p-4 md:p-6">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-end">
          <Button variant="primary" onClick={openCreateModal}>
            Add Course
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-axiom-muted">Loading courses...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">
              Failed to load courses. Please try again later.
            </p>
          </div>
        )}

        {/* Course table */}
        {!isLoading && !error && courses && (
          <CourseTable
            courses={courses}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCourse ? "Edit Course" : "Create Course"}
      >
        {(createMutation.error ?? updateMutation.error) && (
          <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {(createMutation.error ?? updateMutation.error)?.message ?? "Something went wrong."}
          </p>
        )}
        <CourseForm
          key={editingCourse?.id ?? "create"}
          course={editingCourse ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={isMutating}
        />
      </Modal>
    </>
  );
}
