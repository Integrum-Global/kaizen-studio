/**
 * Onboarding feature exports
 *
 * Provides a comprehensive help and onboarding system with:
 * - Welcome dialog for first-time users
 * - Interactive guided tours with step-by-step overlays
 * - Contextual tooltips for UI guidance
 * - Progress checklist for onboarding tasks
 * - Help panel with resources and support links
 */

// Types
export type {
  OnboardingStep,
  OnboardingTour,
  OnboardingHint,
  OnboardingChecklist as ChecklistType,
  OnboardingAction,
  OnboardingPosition,
  ChecklistItem,
  OnboardingState,
  OnboardingActions,
  OnboardingStore,
} from "./types/onboarding";

// Store
export { useOnboardingStore } from "./store/onboarding";

// Hooks
export { useOnboarding } from "./hooks/useOnboarding";
export type { UseOnboardingOptions } from "./hooks/useOnboarding";

// Components
export { WelcomeDialog } from "./components/WelcomeDialog";
export { OnboardingTooltip } from "./components/OnboardingTooltip";
export { OnboardingChecklist } from "./components/OnboardingChecklist";
export { HelpButton } from "./components/HelpButton";
export { TourOverlay } from "./components/TourOverlay";
