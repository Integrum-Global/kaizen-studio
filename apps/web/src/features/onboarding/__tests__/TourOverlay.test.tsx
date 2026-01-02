import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TourOverlay } from "../components/TourOverlay";
import type { OnboardingTour } from "../types/onboarding";

// Mock the useOnboarding hook
const mockNext = vi.fn();
const mockPrevious = vi.fn();
const mockSkip = vi.fn();
const mockUseOnboarding = vi.fn();

vi.mock("../hooks/useOnboarding", () => ({
  useOnboarding: (options: unknown) => mockUseOnboarding(options),
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  X: ({ className }: { className?: string }) => (
    <span data-testid="x-icon" className={className}>
      X
    </span>
  ),
  ChevronLeft: ({ className }: { className?: string }) => (
    <span data-testid="chevron-left-icon" className={className}>
      ChevronLeft
    </span>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <span data-testid="chevron-right-icon" className={className}>
      ChevronRight
    </span>
  ),
}));

describe("TourOverlay", () => {
  const defaultTour: OnboardingTour = {
    id: "test-tour",
    title: "Test Tour",
    description: "A test tour",
    steps: [
      {
        id: "step-1",
        title: "Step 1 Title",
        description: "Step 1 description",
        target: "#step-1-target",
        position: "bottom",
      },
      {
        id: "step-2",
        title: "Step 2 Title",
        description: "Step 2 description",
        target: "#step-2-target",
        position: "top",
      },
      {
        id: "step-3",
        title: "Step 3 Title",
        description: "Step 3 description",
        target: "#step-3-target",
        position: "right",
      },
    ],
  };

  const defaultHookReturn = {
    currentStep: defaultTour.steps[0],
    currentStepIndex: 0,
    isTourActive: true,
    hasNextStep: true,
    hasPreviousStep: false,
    progress: 33.33,
    next: mockNext,
    previous: mockPrevious,
    skip: mockSkip,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnboarding.mockReturnValue(defaultHookReturn);

    // Mock document.querySelector for highlight position
    vi.spyOn(document, "querySelector").mockReturnValue(null);

    // Mock window.scrollY and window.scrollX
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    Object.defineProperty(window, "scrollX", { value: 0, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render nothing when tour is not active", () => {
      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        isTourActive: false,
        currentStep: null,
      });

      const { container } = render(<TourOverlay tour={defaultTour} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when there is no current step", () => {
      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStep: null,
      });

      const { container } = render(<TourOverlay tour={defaultTour} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render overlay when tour is active", () => {
      const { container } = render(<TourOverlay tour={defaultTour} />);

      // Should have backdrop - check for fixed inset-0 element
      const backdrop = container.querySelector(".fixed.inset-0");
      expect(backdrop).toBeInTheDocument();
    });

    it("should render step title", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByText("Step 1 Title")).toBeInTheDocument();
    });

    it("should render step description", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByText("Step 1 description")).toBeInTheDocument();
    });

    it("should render step counter", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });

    it("should render progress bar", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("navigation buttons", () => {
    it("should render Next button", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("should render Skip tour button", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(
        screen.getByRole("button", { name: /skip tour/i })
      ).toBeInTheDocument();
    });

    it("should not render Previous button on first step", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(
        screen.queryByRole("button", { name: /previous/i })
      ).not.toBeInTheDocument();
    });

    it("should render Previous button when not on first step", () => {
      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStepIndex: 1,
        currentStep: defaultTour.steps[1],
        hasPreviousStep: true,
      });

      render(<TourOverlay tour={defaultTour} />);

      expect(
        screen.getByRole("button", { name: /previous/i })
      ).toBeInTheDocument();
    });

    it("should render Finish button on last step", () => {
      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStepIndex: 2,
        currentStep: defaultTour.steps[2],
        hasNextStep: false,
        hasPreviousStep: true,
        progress: 100,
      });

      render(<TourOverlay tour={defaultTour} />);

      expect(
        screen.getByRole("button", { name: /finish/i })
      ).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(
        screen.getByRole("button", { name: /close tour/i })
      ).toBeInTheDocument();
    });
  });

  describe("navigation actions", () => {
    it("should call next when Next is clicked", () => {
      render(<TourOverlay tour={defaultTour} />);

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      expect(mockNext).toHaveBeenCalled();
    });

    it("should call previous when Previous is clicked", () => {
      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStepIndex: 1,
        currentStep: defaultTour.steps[1],
        hasPreviousStep: true,
      });

      render(<TourOverlay tour={defaultTour} />);

      fireEvent.click(screen.getByRole("button", { name: /previous/i }));

      expect(mockPrevious).toHaveBeenCalled();
    });

    it("should call skip when Skip tour is clicked", () => {
      const onSkip = vi.fn();

      render(<TourOverlay tour={defaultTour} onSkip={onSkip} />);

      fireEvent.click(screen.getByRole("button", { name: /skip tour/i }));

      expect(mockSkip).toHaveBeenCalled();
      expect(onSkip).toHaveBeenCalled();
    });

    it("should call skip when close button is clicked", () => {
      const onSkip = vi.fn();

      render(<TourOverlay tour={defaultTour} onSkip={onSkip} />);

      fireEvent.click(screen.getByRole("button", { name: /close tour/i }));

      expect(mockSkip).toHaveBeenCalled();
      expect(onSkip).toHaveBeenCalled();
    });

    it("should call onComplete when Finish is clicked on last step", () => {
      const onComplete = vi.fn();

      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStepIndex: 2,
        currentStep: defaultTour.steps[2],
        hasNextStep: false,
        hasPreviousStep: true,
        progress: 100,
      });

      render(<TourOverlay tour={defaultTour} onComplete={onComplete} />);

      fireEvent.click(screen.getByRole("button", { name: /finish/i }));

      expect(mockNext).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe("tour prop", () => {
    it("should pass tour to useOnboarding", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(mockUseOnboarding).toHaveBeenCalledWith({ tour: defaultTour });
    });
  });

  describe("highlight element", () => {
    it("should try to find target element", () => {
      const querySelectorSpy = vi.spyOn(document, "querySelector");

      render(<TourOverlay tour={defaultTour} />);

      expect(querySelectorSpy).toHaveBeenCalledWith("#step-1-target");
    });

    it("should render highlight when element is found", () => {
      const mockElement = document.createElement("div");
      mockElement.getBoundingClientRect = () => ({
        top: 100,
        left: 200,
        width: 150,
        height: 50,
        bottom: 150,
        right: 350,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      });
      mockElement.scrollIntoView = vi.fn();

      vi.spyOn(document, "querySelector").mockReturnValue(mockElement);

      const { container } = render(<TourOverlay tour={defaultTour} />);

      // Should have highlight ring element
      const highlight = container.querySelector(".ring-4");
      expect(highlight).toBeInTheDocument();
    });

    it("should call scrollIntoView on target element", () => {
      const scrollIntoViewMock = vi.fn();
      const mockElement = document.createElement("div");
      mockElement.getBoundingClientRect = () => ({
        top: 100,
        left: 200,
        width: 150,
        height: 50,
        bottom: 150,
        right: 350,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      });
      mockElement.scrollIntoView = scrollIntoViewMock;

      vi.spyOn(document, "querySelector").mockReturnValue(mockElement);

      render(<TourOverlay tour={defaultTour} />);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
    });
  });

  describe("step without target", () => {
    it("should handle step without target element", () => {
      const tourWithoutTarget: OnboardingTour = {
        ...defaultTour,
        steps: [
          {
            id: "step-1",
            title: "No Target Step",
            description: "This step has no target",
          },
        ],
      };

      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStep: tourWithoutTarget.steps[0],
        hasNextStep: false,
      });

      render(<TourOverlay tour={tourWithoutTarget} />);

      expect(screen.getByText("No Target Step")).toBeInTheDocument();
    });

    it("should center tooltip when no target", () => {
      const tourWithoutTarget: OnboardingTour = {
        ...defaultTour,
        steps: [
          {
            id: "step-1",
            title: "No Target Step",
            description: "This step has no target",
          },
        ],
      };

      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStep: tourWithoutTarget.steps[0],
        hasNextStep: false,
      });

      render(<TourOverlay tour={tourWithoutTarget} />);

      // Tooltip should still be rendered
      expect(screen.getByText("No Target Step")).toBeInTheDocument();
    });
  });

  describe("window resize", () => {
    it("should update highlight position on resize", () => {
      const mockElement = document.createElement("div");
      const getBoundingClientRectMock = vi.fn().mockReturnValue({
        top: 100,
        left: 200,
        width: 150,
        height: 50,
        bottom: 150,
        right: 350,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      });
      mockElement.getBoundingClientRect = getBoundingClientRectMock;
      mockElement.scrollIntoView = vi.fn();

      vi.spyOn(document, "querySelector").mockReturnValue(mockElement);

      render(<TourOverlay tour={defaultTour} />);

      // Initial call
      const initialCalls = getBoundingClientRectMock.mock.calls.length;
      expect(initialCalls).toBeGreaterThan(0);

      // Simulate resize
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });

      // Should be called again on resize
      expect(getBoundingClientRectMock.mock.calls.length).toBeGreaterThan(
        initialCalls
      );
    });
  });

  describe("step positions", () => {
    const positions = ["top", "bottom", "left", "right"] as const;

    positions.forEach((position) => {
      it(`should handle ${position} position`, () => {
        const tourWithPosition: OnboardingTour = {
          ...defaultTour,
          steps: [
            {
              id: "step-1",
              title: "Position Step",
              description: "Testing position",
              target: "#target",
              position,
            },
          ],
        };

        mockUseOnboarding.mockReturnValue({
          ...defaultHookReturn,
          currentStep: tourWithPosition.steps[0],
          hasNextStep: false,
        });

        render(<TourOverlay tour={tourWithPosition} />);

        expect(screen.getByText("Position Step")).toBeInTheDocument();
      });
    });
  });

  describe("icons", () => {
    it("should render X icon in close button", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByTestId("x-icon")).toBeInTheDocument();
    });

    it("should render ChevronRight icon in Next button", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
    });

    it("should render ChevronLeft icon in Previous button", () => {
      mockUseOnboarding.mockReturnValue({
        ...defaultHookReturn,
        currentStepIndex: 1,
        currentStep: defaultTour.steps[1],
        hasPreviousStep: true,
      });

      render(<TourOverlay tour={defaultTour} />);

      expect(screen.getByTestId("chevron-left-icon")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have accessible close button", () => {
      render(<TourOverlay tour={defaultTour} />);

      expect(
        screen.getByRole("button", { name: /close tour/i })
      ).toBeInTheDocument();
    });

    it("should have progress bar with value", () => {
      render(<TourOverlay tour={defaultTour} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should have backdrop overlay", () => {
      const { container } = render(<TourOverlay tour={defaultTour} />);

      const backdrop = container.querySelector(".fixed.inset-0");
      expect(backdrop).toBeInTheDocument();
    });

    it("should have tooltip card with shadow", () => {
      const { container } = render(<TourOverlay tour={defaultTour} />);

      const card = container.querySelector(".shadow-xl");
      expect(card).toBeInTheDocument();
    });
  });
});
