import { useCallback, useMemo } from "react";
import { useOnboardingStore } from "../store/onboarding";
import type { OnboardingTour } from "../types/onboarding";

export interface UseOnboardingOptions {
  tour?: OnboardingTour;
  autoStart?: boolean;
}

export function useOnboarding(options?: UseOnboardingOptions) {
  const {
    hasCompletedOnboarding,
    hasSeenWelcome,
    currentTourId,
    currentStepIndex,
    completedTours,
    completedSteps,
    dismissedHints,
    checklistProgress,
    markWelcomeSeen,
    startTour,
    nextStep,
    previousStep,
    goToStep,
    completeTour,
    skipTour,
    markStepCompleted,
    dismissHint,
    toggleChecklistItem,
    markChecklistItemCompleted,
    completeOnboarding,
    resetOnboarding,
  } = useOnboardingStore();

  const tour = options?.tour;

  // Current step from tour
  const currentStep = useMemo(() => {
    if (!tour || currentTourId !== tour.id) return null;
    return tour.steps[currentStepIndex] || null;
  }, [tour, currentTourId, currentStepIndex]);

  // Is tour active
  const isTourActive = useMemo(
    () => currentTourId === tour?.id,
    [currentTourId, tour?.id]
  );

  // Is tour completed
  const isTourCompleted = useMemo(
    () => tour && completedTours.includes(tour.id),
    [tour, completedTours]
  );

  // Has more steps
  const hasNextStep = useMemo(
    () => tour && currentStepIndex < tour.steps.length - 1,
    [tour, currentStepIndex]
  );

  const hasPreviousStep = useMemo(
    () => currentStepIndex > 0,
    [currentStepIndex]
  );

  // Progress
  const progress = useMemo(() => {
    if (!tour) return 0;
    return ((currentStepIndex + 1) / tour.steps.length) * 100;
  }, [tour, currentStepIndex]);

  // Start current tour
  const start = useCallback(() => {
    if (tour) {
      startTour(tour.id);
    }
  }, [tour, startTour]);

  // Complete current tour
  const complete = useCallback(() => {
    completeTour();
  }, [completeTour]);

  // Skip current tour
  const skip = useCallback(() => {
    skipTour();
  }, [skipTour]);

  // Next step with auto-complete
  const next = useCallback(() => {
    if (hasNextStep) {
      nextStep();
    } else {
      complete();
    }
  }, [hasNextStep, nextStep, complete]);

  // Previous step
  const previous = useCallback(() => {
    if (hasPreviousStep) {
      previousStep();
    }
  }, [hasPreviousStep, previousStep]);

  // Is hint dismissed
  const isHintDismissed = useCallback(
    (hintId: string) => dismissedHints.includes(hintId),
    [dismissedHints]
  );

  // Is step completed
  const isStepCompleted = useCallback(
    (stepId: string) => completedSteps.includes(stepId),
    [completedSteps]
  );

  // Is checklist item completed
  const isChecklistItemCompleted = useCallback(
    (itemId: string) => checklistProgress[itemId] === true,
    [checklistProgress]
  );

  // Calculate checklist progress
  const getChecklistProgress = useCallback(
    (itemIds: string[]) => {
      const completed = itemIds.filter((id) => checklistProgress[id]).length;
      return {
        completed,
        total: itemIds.length,
        percentage: itemIds.length > 0 ? (completed / itemIds.length) * 100 : 0,
      };
    },
    [checklistProgress]
  );

  return {
    // State
    hasCompletedOnboarding,
    hasSeenWelcome,
    currentStep,
    currentStepIndex,
    isTourActive,
    isTourCompleted,
    hasNextStep,
    hasPreviousStep,
    progress,

    // Tour actions
    start,
    next,
    previous,
    complete,
    skip,
    goToStep,

    // Welcome actions
    markWelcomeSeen,

    // Step actions
    markStepCompleted,
    isStepCompleted,

    // Hint actions
    dismissHint,
    isHintDismissed,

    // Checklist actions
    toggleChecklistItem,
    markChecklistItemCompleted,
    isChecklistItemCompleted,
    getChecklistProgress,

    // Onboarding actions
    completeOnboarding,
    resetOnboarding,
  };
}
