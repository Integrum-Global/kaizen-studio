import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "../hooks/useOnboarding";
import { useOnboardingStore } from "../store/onboarding";
import type { OnboardingTour } from "../types/onboarding";

const mockTour: OnboardingTour = {
  id: "test-tour",
  title: "Test Tour",
  description: "A test tour",
  steps: [
    {
      id: "step-1",
      title: "Step 1",
      description: "First step",
      target: "#element-1",
      position: "bottom",
    },
    {
      id: "step-2",
      title: "Step 2",
      description: "Second step",
      target: "#element-2",
      position: "top",
    },
    {
      id: "step-3",
      title: "Step 3",
      description: "Third step",
    },
  ],
};

describe("useOnboarding", () => {
  beforeEach(() => {
    // Reset store before each test
    const { resetOnboarding } = useOnboardingStore.getState();
    resetOnboarding();
  });

  describe("Tour Management", () => {
    it("should start a tour", () => {
      const { result } = renderHook(() => useOnboarding({ tour: mockTour }));

      expect(result.current.isTourActive).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isTourActive).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
    });

    it("should navigate to next step", () => {
      const { result } = renderHook(() => useOnboarding({ tour: mockTour }));

      act(() => {
        result.current.start();
      });

      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.hasNextStep).toBe(true);

      act(() => {
        result.current.next();
      });

      expect(result.current.currentStepIndex).toBe(1);
    });

    it("should navigate to previous step", () => {
      const { result } = renderHook(() => useOnboarding({ tour: mockTour }));

      act(() => {
        result.current.start();
        result.current.next();
      });

      expect(result.current.currentStepIndex).toBe(1);
      expect(result.current.hasPreviousStep).toBe(true);

      act(() => {
        result.current.previous();
      });

      expect(result.current.currentStepIndex).toBe(0);
    });

    it("should complete tour on last step", () => {
      const { result } = renderHook(() => useOnboarding({ tour: mockTour }));

      act(() => {
        result.current.start();
      });

      // Navigate to last step
      act(() => {
        result.current.next();
        result.current.next();
      });

      expect(result.current.hasNextStep).toBe(false);

      act(() => {
        result.current.next();
      });

      expect(result.current.isTourActive).toBe(false);
      expect(result.current.isTourCompleted).toBe(true);
    });

    it("should skip tour", () => {
      const { result } = renderHook(() => useOnboarding({ tour: mockTour }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isTourActive).toBe(true);

      act(() => {
        result.current.skip();
      });

      expect(result.current.isTourActive).toBe(false);
      expect(result.current.isTourCompleted).toBe(false);
    });

    it("should calculate progress correctly", () => {
      const { result } = renderHook(() => useOnboarding({ tour: mockTour }));

      act(() => {
        result.current.start();
      });

      expect(result.current.progress).toBeCloseTo(33.33, 1);

      act(() => {
        result.current.next();
      });

      expect(result.current.progress).toBeCloseTo(66.66, 1);

      act(() => {
        result.current.next();
      });

      expect(result.current.progress).toBe(100);
    });
  });

  describe("Step Management", () => {
    it("should track completed steps", () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.isStepCompleted("step-1")).toBe(false);

      act(() => {
        result.current.markStepCompleted("step-1");
      });

      expect(result.current.isStepCompleted("step-1")).toBe(true);
    });
  });

  describe("Hint Management", () => {
    it("should dismiss hints", () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.isHintDismissed("hint-1")).toBe(false);

      act(() => {
        result.current.dismissHint("hint-1");
      });

      expect(result.current.isHintDismissed("hint-1")).toBe(true);
    });
  });

  describe("Checklist Management", () => {
    it("should toggle checklist items", () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.isChecklistItemCompleted("item-1")).toBe(false);

      act(() => {
        result.current.toggleChecklistItem("item-1");
      });

      expect(result.current.isChecklistItemCompleted("item-1")).toBe(true);

      act(() => {
        result.current.toggleChecklistItem("item-1");
      });

      expect(result.current.isChecklistItemCompleted("item-1")).toBe(false);
    });

    it("should mark checklist items as completed", () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.isChecklistItemCompleted("item-1")).toBe(false);

      act(() => {
        result.current.markChecklistItemCompleted("item-1");
      });

      expect(result.current.isChecklistItemCompleted("item-1")).toBe(true);
    });

    it("should calculate checklist progress", () => {
      const { result } = renderHook(() => useOnboarding());

      const itemIds = ["item-1", "item-2", "item-3"];

      let progress = result.current.getChecklistProgress(itemIds);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(0);

      act(() => {
        result.current.markChecklistItemCompleted("item-1");
      });

      progress = result.current.getChecklistProgress(itemIds);
      expect(progress.completed).toBe(1);
      expect(progress.percentage).toBeCloseTo(33.33, 1);

      act(() => {
        result.current.markChecklistItemCompleted("item-2");
        result.current.markChecklistItemCompleted("item-3");
      });

      progress = result.current.getChecklistProgress(itemIds);
      expect(progress.completed).toBe(3);
      expect(progress.percentage).toBe(100);
    });
  });

  describe("Welcome Management", () => {
    it("should track welcome seen", () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasSeenWelcome).toBe(false);

      act(() => {
        result.current.markWelcomeSeen();
      });

      expect(result.current.hasSeenWelcome).toBe(true);
    });
  });

  describe("Onboarding Completion", () => {
    it("should complete onboarding", () => {
      const { result } = renderHook(() => useOnboarding());

      expect(result.current.hasCompletedOnboarding).toBe(false);

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
    });

    it("should reset onboarding", () => {
      const { result } = renderHook(() => useOnboarding({ tour: mockTour }));

      // Set up some state
      act(() => {
        result.current.start();
        result.current.markWelcomeSeen();
        result.current.markStepCompleted("step-1");
        result.current.dismissHint("hint-1");
        result.current.markChecklistItemCompleted("item-1");
        result.current.completeOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.hasSeenWelcome).toBe(true);

      act(() => {
        result.current.resetOnboarding();
      });

      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.hasSeenWelcome).toBe(false);
      expect(result.current.isTourActive).toBe(false);
      expect(result.current.isStepCompleted("step-1")).toBe(false);
      expect(result.current.isHintDismissed("hint-1")).toBe(false);
      expect(result.current.isChecklistItemCompleted("item-1")).toBe(false);
    });
  });
});
