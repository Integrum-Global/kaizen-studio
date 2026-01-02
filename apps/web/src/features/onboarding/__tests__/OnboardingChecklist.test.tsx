import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingChecklist } from "../components/OnboardingChecklist";
import { useOnboardingStore } from "../store/onboarding";
import type { OnboardingChecklist as ChecklistType } from "../types/onboarding";

const mockChecklist: ChecklistType = {
  id: "getting-started",
  title: "Getting Started",
  description: "Complete these steps to get started with Kaizen Studio",
  steps: [
    {
      id: "create-agent",
      label: "Create your first agent",
      description: "Design an AI agent with custom signatures",
      completed: false,
      href: "/agents/new",
    },
    {
      id: "build-pipeline",
      label: "Build a pipeline",
      description: "Connect agents in a workflow",
      completed: false,
      href: "/pipelines/new",
    },
    {
      id: "test-pipeline",
      label: "Test your pipeline",
      description: "Run tests to verify agent behavior",
      completed: false,
    },
    {
      id: "deploy",
      label: "Deploy to environment",
      description: "Push your pipeline to production",
      completed: false,
      href: "/deployments",
    },
  ],
};

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    const { resetOnboarding } = useOnboardingStore.getState();
    resetOnboarding();
  });

  it("should render checklist with title and description", () => {
    render(<OnboardingChecklist checklist={mockChecklist} />);

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(
      screen.getByText("Complete these steps to get started with Kaizen Studio")
    ).toBeInTheDocument();
  });

  it("should render all checklist items", () => {
    render(<OnboardingChecklist checklist={mockChecklist} />);

    expect(screen.getByText("Create your first agent")).toBeInTheDocument();
    expect(screen.getByText("Build a pipeline")).toBeInTheDocument();
    expect(screen.getByText("Test your pipeline")).toBeInTheDocument();
    expect(screen.getByText("Deploy to environment")).toBeInTheDocument();
  });

  it("should show progress as 0% initially", () => {
    render(<OnboardingChecklist checklist={mockChecklist} />);

    expect(screen.getByText("0 of 4")).toBeInTheDocument();
  });

  it("should toggle checklist item when clicked", async () => {
    const user = userEvent.setup();
    render(<OnboardingChecklist checklist={mockChecklist} />);

    const checkbox = screen.getByRole("checkbox", {
      name: /create your first agent/i,
    });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
  });

  it("should update progress when multiple items are checked", async () => {
    const user = userEvent.setup();
    render(<OnboardingChecklist checklist={mockChecklist} />);

    const checkboxes = screen.getAllByRole("checkbox");

    const checkbox0 = checkboxes[0];
    const checkbox1 = checkboxes[1];
    const checkbox2 = checkboxes[2];
    const checkbox3 = checkboxes[3];

    if (!checkbox0 || !checkbox1 || !checkbox2 || !checkbox3) {
      throw new Error("Checkboxes not found");
    }

    await user.click(checkbox0);
    expect(screen.getByText("1 of 4")).toBeInTheDocument();

    await user.click(checkbox1);
    expect(screen.getByText("2 of 4")).toBeInTheDocument();

    await user.click(checkbox2);
    expect(screen.getByText("3 of 4")).toBeInTheDocument();

    await user.click(checkbox3);
    expect(screen.getByText("4 of 4")).toBeInTheDocument();
  });

  it("should apply line-through style to completed items", async () => {
    const user = userEvent.setup();
    render(<OnboardingChecklist checklist={mockChecklist} />);

    const label = screen.getByText("Create your first agent");
    expect(label).not.toHaveClass("line-through");

    const checkbox = screen.getByRole("checkbox", {
      name: /create your first agent/i,
    });
    await user.click(checkbox);

    expect(label).toHaveClass("line-through");
  });

  it("should show item descriptions", () => {
    render(<OnboardingChecklist checklist={mockChecklist} />);

    expect(
      screen.getByText("Design an AI agent with custom signatures")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Connect agents in a workflow")
    ).toBeInTheDocument();
  });

  it("should persist checklist state", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <OnboardingChecklist checklist={mockChecklist} />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /create your first agent/i,
    });
    await user.click(checkbox);

    expect(checkbox).toBeChecked();

    // Simulate unmount and remount
    rerender(<OnboardingChecklist checklist={mockChecklist} />);

    const checkboxAfterRemount = screen.getByRole("checkbox", {
      name: /create your first agent/i,
    });
    expect(checkboxAfterRemount).toBeChecked();
  });

  it("should calculate progress percentage correctly", async () => {
    const user = userEvent.setup();
    render(<OnboardingChecklist checklist={mockChecklist} />);

    const checkboxes = screen.getAllByRole("checkbox");

    const checkbox0 = checkboxes[0];
    const checkbox1 = checkboxes[1];

    if (!checkbox0 || !checkbox1) {
      throw new Error("Checkboxes not found");
    }

    // Check 2 out of 4 items (50%)
    await user.click(checkbox0);
    await user.click(checkbox1);

    // Verify progress is shown in UI
    expect(screen.getByText("2 of 4")).toBeInTheDocument();

    // Verify state directly
    const { checklistProgress } = useOnboardingStore.getState();
    const completedCount = mockChecklist.steps.filter(
      (s) => checklistProgress[s.id]
    ).length;

    expect(completedCount).toBe(2);
  });

  it("should handle checklist without description", () => {
    const checklistWithoutDescription: ChecklistType = {
      ...mockChecklist,
      description: undefined,
    };

    render(<OnboardingChecklist checklist={checklistWithoutDescription} />);

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Complete these steps to get started with Kaizen Studio"
      )
    ).not.toBeInTheDocument();
  });
});
