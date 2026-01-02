/**
 * Centralized store exports
 * Import stores from here for cleaner imports
 *
 * Usage:
 * import { useAuthStore, useUIStore } from '@/store';
 */

export { useAuthStore } from "./auth";
export { useUIStore } from "./ui";
export { useCanvasStore } from "./canvas";
export { useHistoryStore } from "./history";
export type { Notification } from "./ui";

// Re-export onboarding store for convenience
export { useOnboardingStore } from "@/features/onboarding";
