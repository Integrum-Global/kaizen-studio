import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OnboardingTooltip } from "../components/OnboardingTooltip";
import type { OnboardingHint } from "../types/onboarding";

// Mock the useOnboarding hook
const mockIsHintDismissed = vi.fn();
const mockDismissHint = vi.fn();

vi.mock("../hooks/useOnboarding", () => ({
  useOnboarding: () => ({
    isHintDismissed: mockIsHintDismissed,
    dismissHint: mockDismissHint,
  }),
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  X: ({ className }: { className?: string }) => (
    <span data-testid="x-icon" className={className}>
      X
    </span>
  ),
}));

describe("OnboardingTooltip", () => {
  const defaultHint: OnboardingHint = {
    id: "test-hint",
    target: "#test-element",
    title: "Test Hint Title",
    description: "This is a test hint description",
    position: "bottom",
    showOnce: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockIsHintDismissed.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render children", () => {
      render(
        <OnboardingTooltip hint={defaultHint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });

    it("should render children as trigger", () => {
      render(
        <OnboardingTooltip hint={defaultHint} autoShow={false}>
          <div data-testid="trigger">Click me</div>
        </OnboardingTooltip>
      );

      expect(screen.getByTestId("trigger")).toBeInTheDocument();
    });
  });

  describe("autoShow behavior", () => {
    it("should not auto show when autoShow is false", () => {
      render(
        <OnboardingTooltip hint={defaultHint} autoShow={false} delay={500}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Content should not be visible - checking that popover content is not shown
      expect(screen.queryByText("Test Hint Title")).not.toBeInTheDocument();
    });

    it("should respect delay parameter", () => {
      const { rerender } = render(
        <OnboardingTooltip hint={defaultHint} autoShow={true} delay={1000}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      // At 500ms, should not show
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.queryByText("Test Hint Title")).not.toBeInTheDocument();

      // Clean up
      rerender(
        <OnboardingTooltip
          hint={{ ...defaultHint, showOnce: false }}
          autoShow={false}
        >
          <button>Test Button</button>
        </OnboardingTooltip>
      );
    });
  });

  describe("dismissed hints", () => {
    it("should not show when hint is dismissed", () => {
      mockIsHintDismissed.mockReturnValue(true);

      render(
        <OnboardingTooltip hint={defaultHint} autoShow={true}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByText("Test Hint Title")).not.toBeInTheDocument();
    });

    it("should only render children when dismissed", () => {
      mockIsHintDismissed.mockReturnValue(true);

      render(
        <OnboardingTooltip hint={defaultHint} autoShow={true}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });

    it("should call isHintDismissed with hint id", () => {
      render(
        <OnboardingTooltip hint={defaultHint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(mockIsHintDismissed).toHaveBeenCalledWith("test-hint");
    });

    it("should check dismissed status on every render", () => {
      const { rerender } = render(
        <OnboardingTooltip hint={defaultHint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(mockIsHintDismissed).toHaveBeenCalledTimes(1);

      rerender(
        <OnboardingTooltip hint={defaultHint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(mockIsHintDismissed).toHaveBeenCalledTimes(2);
    });
  });

  describe("showOnce behavior", () => {
    it("should not show when showOnce is true and dismissed", () => {
      mockIsHintDismissed.mockReturnValue(true);

      const hint: OnboardingHint = {
        ...defaultHint,
        showOnce: true,
      };

      render(
        <OnboardingTooltip hint={hint} autoShow={true}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByText("Test Hint Title")).not.toBeInTheDocument();
    });

    it("should still show trigger when showOnce is false", () => {
      mockIsHintDismissed.mockReturnValue(true);

      const hint: OnboardingHint = {
        ...defaultHint,
        showOnce: false,
      };

      render(
        <OnboardingTooltip hint={hint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });
  });

  describe("position", () => {
    it("should handle top position", () => {
      const hint: OnboardingHint = {
        ...defaultHint,
        position: "top",
      };

      render(
        <OnboardingTooltip hint={hint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });

    it("should handle bottom position", () => {
      const hint: OnboardingHint = {
        ...defaultHint,
        position: "bottom",
      };

      render(
        <OnboardingTooltip hint={hint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });

    it("should handle left position", () => {
      const hint: OnboardingHint = {
        ...defaultHint,
        position: "left",
      };

      render(
        <OnboardingTooltip hint={hint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });

    it("should handle right position", () => {
      const hint: OnboardingHint = {
        ...defaultHint,
        position: "right",
      };

      render(
        <OnboardingTooltip hint={hint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });

    it("should handle undefined position", () => {
      const hint: OnboardingHint = {
        ...defaultHint,
        position: undefined,
      };

      render(
        <OnboardingTooltip hint={hint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });
  });

  describe("hint properties", () => {
    it("should accept required hint properties", () => {
      const minimalHint: OnboardingHint = {
        id: "minimal",
        target: "#element",
        title: "Title",
        description: "Description",
      };

      render(
        <OnboardingTooltip hint={minimalHint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });

    it("should accept optional priority property", () => {
      const hintWithPriority: OnboardingHint = {
        ...defaultHint,
        priority: 10,
      };

      render(
        <OnboardingTooltip hint={hintWithPriority} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      expect(
        screen.getByRole("button", { name: "Test Button" })
      ).toBeInTheDocument();
    });
  });

  describe("multiple hints", () => {
    it("should handle different hint ids", () => {
      const hint1: OnboardingHint = {
        ...defaultHint,
        id: "hint-1",
        title: "Hint 1",
      };

      const hint2: OnboardingHint = {
        ...defaultHint,
        id: "hint-2",
        title: "Hint 2",
      };

      render(
        <>
          <OnboardingTooltip hint={hint1} autoShow={false}>
            <button>Button 1</button>
          </OnboardingTooltip>
          <OnboardingTooltip hint={hint2} autoShow={false}>
            <button>Button 2</button>
          </OnboardingTooltip>
        </>
      );

      expect(mockIsHintDismissed).toHaveBeenCalledWith("hint-1");
      expect(mockIsHintDismissed).toHaveBeenCalledWith("hint-2");
    });

    it("should render multiple triggers", () => {
      const hint1: OnboardingHint = {
        ...defaultHint,
        id: "hint-1",
      };

      const hint2: OnboardingHint = {
        ...defaultHint,
        id: "hint-2",
      };

      render(
        <>
          <OnboardingTooltip hint={hint1} autoShow={false}>
            <button>Button 1</button>
          </OnboardingTooltip>
          <OnboardingTooltip hint={hint2} autoShow={false}>
            <button>Button 2</button>
          </OnboardingTooltip>
        </>
      );

      expect(
        screen.getByRole("button", { name: "Button 1" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Button 2" })
      ).toBeInTheDocument();
    });
  });

  describe("component structure", () => {
    it("should render as a popover wrapper", () => {
      const { container } = render(
        <OnboardingTooltip hint={defaultHint} autoShow={false}>
          <button>Test Button</button>
        </OnboardingTooltip>
      );

      // Should have children rendered
      expect(container.querySelector("button")).toBeInTheDocument();
    });
  });
});
