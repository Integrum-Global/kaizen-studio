import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WelcomeDialog } from "../components/WelcomeDialog";
import { useOnboardingStore } from "../store/onboarding";
import type { OnboardingTour } from "../types/onboarding";

const mockTour: OnboardingTour = {
  id: "welcome-tour",
  title: "Welcome Tour",
  description: "Get started with Kaizen Studio",
  steps: [
    {
      id: "step-1",
      title: "Step 1",
      description: "First step",
    },
  ],
};

describe("WelcomeDialog", () => {
  beforeEach(() => {
    const { resetOnboarding } = useOnboardingStore.getState();
    resetOnboarding();
  });

  it("should render welcome dialog on first visit", async () => {
    render(<WelcomeDialog />);

    await waitFor(() => {
      expect(screen.getByText("Welcome to Kaizen Studio")).toBeInTheDocument();
    });
  });

  it("should not render if welcome was already seen", () => {
    const { markWelcomeSeen } = useOnboardingStore.getState();
    markWelcomeSeen();

    render(<WelcomeDialog />);

    expect(
      screen.queryByText("Welcome to Kaizen Studio")
    ).not.toBeInTheDocument();
  });

  it("should render custom title and description", async () => {
    render(
      <WelcomeDialog
        title="Custom Title"
        description="Custom description text"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Custom Title")).toBeInTheDocument();
      expect(screen.getByText("Custom description text")).toBeInTheDocument();
    });
  });

  it("should show tour button when tour is provided", async () => {
    render(<WelcomeDialog tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText("Take the tour")).toBeInTheDocument();
    });
  });

  it("should show get started button when no tour is provided", async () => {
    render(<WelcomeDialog />);

    await waitFor(() => {
      expect(screen.getByText("Get started")).toBeInTheDocument();
    });
  });

  it("should mark welcome as seen when skipping", async () => {
    const user = userEvent.setup();
    render(<WelcomeDialog />);

    await waitFor(() => {
      expect(screen.getByText("Welcome to Kaizen Studio")).toBeInTheDocument();
    });

    const skipButton = screen.getByText("Skip for now");
    await user.click(skipButton);

    const { hasSeenWelcome } = useOnboardingStore.getState();
    expect(hasSeenWelcome).toBe(true);
  });

  it("should start tour when clicking take the tour", async () => {
    const user = userEvent.setup();
    render(<WelcomeDialog tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText("Take the tour")).toBeInTheDocument();
    });

    const tourButton = screen.getByText("Take the tour");
    await user.click(tourButton);

    const { hasSeenWelcome, currentTourId } = useOnboardingStore.getState();
    expect(hasSeenWelcome).toBe(true);
    expect(currentTourId).toBe(mockTour.id);
  });

  it("should not show on first visit if showOnFirstVisit is false", () => {
    render(<WelcomeDialog showOnFirstVisit={false} />);

    expect(
      screen.queryByText("Welcome to Kaizen Studio")
    ).not.toBeInTheDocument();
  });

  it("should display feature list", async () => {
    render(<WelcomeDialog />);

    await waitFor(() => {
      expect(
        screen.getByText(/Design AI agents with signature-based programming/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Build multi-agent pipelines with visual canvas/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Test and debug agent interactions in real-time/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Deploy to production environments with one click/)
      ).toBeInTheDocument();
    });
  });
});
