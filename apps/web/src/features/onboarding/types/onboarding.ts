/**
 * Onboarding system type definitions
 */

export type OnboardingPosition = "top" | "bottom" | "left" | "right";

export type OnboardingActionType =
  | "navigate"
  | "click"
  | "focus"
  | "highlight"
  | "custom";

export interface OnboardingAction {
  type: OnboardingActionType;
  target?: string;
  payload?: unknown;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlight
  position?: OnboardingPosition;
  action?: OnboardingAction;
  order?: number; // For ordering steps in a tour
}

export interface OnboardingTour {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  autoStart?: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  href?: string;
  action?: () => void;
}

export interface OnboardingChecklist {
  id: string;
  title: string;
  description?: string;
  steps: ChecklistItem[];
}

export interface OnboardingHint {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position?: OnboardingPosition;
  showOnce?: boolean;
  priority?: number; // Higher priority hints shown first
}

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasSeenWelcome: boolean;
  currentTourId: string | null;
  currentStepIndex: number;
  completedTours: string[];
  completedSteps: string[];
  dismissedHints: string[];
  checklistProgress: Record<string, boolean>; // checklistItemId -> completed
}

export interface OnboardingActions {
  // Welcome
  markWelcomeSeen: () => void;

  // Tours
  startTour: (tourId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  completeTour: () => void;
  skipTour: () => void;

  // Steps
  markStepCompleted: (stepId: string) => void;

  // Hints
  dismissHint: (hintId: string) => void;

  // Checklist
  toggleChecklistItem: (itemId: string) => void;
  markChecklistItemCompleted: (itemId: string) => void;

  // Onboarding
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;
