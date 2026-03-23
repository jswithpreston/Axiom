// =============================================================================
// Axiom Frontend — Course Hooks
// =============================================================================

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Course, CourseWithMeta, CreateCourseInput, UpdateCourseInput } from "@/types/domain";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from "@/services/courses.service";

export function useCourses() {
  return useQuery<CourseWithMeta[]>({
    queryKey: ["courses"],
    queryFn: getCourses,
  });
}

export function useCourse(id: string) {
  return useQuery<CourseWithMeta>({
    queryKey: ["course", id],
    queryFn: () => getCourse(id),
    enabled: Boolean(id),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation<Course, Error, CreateCourseInput>({
    mutationFn: createCourse,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["courses"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation<Course, Error, { id: string; input: UpdateCourseInput }>({
    mutationFn: ({ id, input }) => updateCourse(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["courses"] }),
        queryClient.invalidateQueries({ queryKey: ["course"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteCourse,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["courses"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
