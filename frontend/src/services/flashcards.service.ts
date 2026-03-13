// =============================================================================
// Axiom Frontend — Flashcards Service
// =============================================================================

import type {
  Flashcard,
  FlashcardWithMeta,
  CreateFlashcardInput,
  UpdateFlashcardInput,
} from "@/types/domain";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";

export function getFlashcards(
  courseId?: string,
): Promise<FlashcardWithMeta[]> {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiGet<FlashcardWithMeta[]>(`/flashcards${query}`);
}

export function getFlashcard(id: string): Promise<Flashcard> {
  return apiGet<Flashcard>(`/flashcards/${id}`);
}

export function createFlashcard(
  input: CreateFlashcardInput,
): Promise<Flashcard> {
  return apiPost<Flashcard>("/flashcards", input);
}

export function updateFlashcard(
  id: string,
  input: UpdateFlashcardInput,
): Promise<Flashcard> {
  return apiPut<Flashcard>(`/flashcards/${id}`, input);
}

export function deleteFlashcard(id: string): Promise<void> {
  return apiDelete(`/flashcards/${id}`);
}

export function getDueFlashcards(
  courseId?: string,
): Promise<FlashcardWithMeta[]> {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return apiGet<FlashcardWithMeta[]>(`/flashcards/due${query}`);
}
