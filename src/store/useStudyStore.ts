import { create } from "zustand";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface DashboardFilters {
  readonly courseId?: string | undefined;
}

interface StudyStoreState {
  /** Currently selected course across the app (null = all courses). */
  selectedCourseId: string | null;
  /** Ordered list of flashcard IDs queued for the active review session. */
  reviewQueue: readonly string[];
  /** Index into `reviewQueue` pointing at the card under review. */
  currentReviewIndex: number;
  /** Filters applied to the dashboard view. */
  dashboardFilters: DashboardFilters;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface StudyStoreActions {
  setSelectedCourse: (courseId: string | null) => void;
  setReviewQueue: (flashcardIds: readonly string[]) => void;
  advanceReview: () => void;
  resetReview: () => void;
  setDashboardFilter: (filters: DashboardFilters) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type StudyStore = StudyStoreState & StudyStoreActions;

export const useStudyStore = create<StudyStore>((set) => ({
  // -- initial state --------------------------------------------------------
  selectedCourseId: null,
  reviewQueue: [],
  currentReviewIndex: 0,
  dashboardFilters: {},

  // -- actions --------------------------------------------------------------
  setSelectedCourse: (courseId) => {
    set({ selectedCourseId: courseId });
  },

  setReviewQueue: (flashcardIds) => {
    set({ reviewQueue: flashcardIds, currentReviewIndex: 0 });
  },

  advanceReview: () => {
    set((state) => {
      const nextIndex = state.currentReviewIndex + 1;
      if (nextIndex >= state.reviewQueue.length) {
        return state; // already at the end — no-op
      }
      return { currentReviewIndex: nextIndex };
    });
  },

  resetReview: () => {
    set({ reviewQueue: [], currentReviewIndex: 0 });
  },

  setDashboardFilter: (filters) => {
    set({ dashboardFilters: filters });
  },
}));
