// =============================================================================
// Axiom Frontend — Courses Service
// =============================================================================

import type {
  Course,
  CourseWithMeta,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/types/domain";
import { apiGet, apiPost, apiPut, apiDelete } from "./api";

export function getCourses(): Promise<CourseWithMeta[]> {
  return apiGet<CourseWithMeta[]>("/courses");
}

export function getCourse(id: string): Promise<CourseWithMeta> {
  return apiGet<CourseWithMeta>(`/courses/${id}`);
}

export function createCourse(input: CreateCourseInput): Promise<Course> {
  return apiPost<Course>("/courses", input);
}

export function updateCourse(
  id: string,
  input: UpdateCourseInput,
): Promise<Course> {
  return apiPut<Course>(`/courses/${id}`, input);
}

export function deleteCourse(id: string): Promise<void> {
  return apiDelete(`/courses/${id}`);
}
