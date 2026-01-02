import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingStore } from "../types/onboarding";

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // State
      hasCompletedOnboarding: false,
      hasSeenWelcome: false,
      currentTourId: null,
      currentStepIndex: 0,
      completedTours: [],
      completedSteps: [],
      dismissedHints: [],
      checklistProgress: {},

      // Welcome actions
      markWelcomeSeen: () => set({ hasSeenWelcome: true }),

      // Tour actions
      startTour: (tourId: string) =>
        set({
          currentTourId: tourId,
          currentStepIndex: 0,
        }),

      nextStep: () => {
        const { currentStepIndex } = get();
        set({ currentStepIndex: currentStepIndex + 1 });
      },

      previousStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },

      goToStep: (stepIndex: number) => set({ currentStepIndex: stepIndex }),

      completeTour: () => {
        const { currentTourId, completedTours } = get();
        if (currentTourId && !completedTours.includes(currentTourId)) {
          set({
            completedTours: [...completedTours, currentTourId],
            currentTourId: null,
            currentStepIndex: 0,
          });
        }
      },

      skipTour: () =>
        set({
          currentTourId: null,
          currentStepIndex: 0,
        }),

      // Step actions
      markStepCompleted: (stepId: string) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(stepId)) {
          set({
            completedSteps: [...completedSteps, stepId],
          });
        }
      },

      // Hint actions
      dismissHint: (hintId: string) => {
        const { dismissedHints } = get();
        if (!dismissedHints.includes(hintId)) {
          set({
            dismissedHints: [...dismissedHints, hintId],
          });
        }
      },

      // Checklist actions
      toggleChecklistItem: (itemId: string) => {
        const { checklistProgress } = get();
        set({
          checklistProgress: {
            ...checklistProgress,
            [itemId]: !checklistProgress[itemId],
          },
        });
      },

      markChecklistItemCompleted: (itemId: string) => {
        const { checklistProgress } = get();
        set({
          checklistProgress: {
            ...checklistProgress,
            [itemId]: true,
          },
        });
      },

      // Onboarding actions
      completeOnboarding: () =>
        set({
          hasCompletedOnboarding: true,
        }),

      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          hasSeenWelcome: false,
          currentTourId: null,
          currentStepIndex: 0,
          completedTours: [],
          completedSteps: [],
          dismissedHints: [],
          checklistProgress: {},
        }),
    }),
    {
      name: "kaizen-onboarding-storage",
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasSeenWelcome: state.hasSeenWelcome,
        completedTours: state.completedTours,
        completedSteps: state.completedSteps,
        dismissedHints: state.dismissedHints,
        checklistProgress: state.checklistProgress,
        // Don't persist current tour state - it should restart
      }),
    }
  )
);

export default useOnboardingStore;
