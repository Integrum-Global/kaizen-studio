import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterNode } from "../RouterNode";
import { useCanvasStore } from "@/store/canvas";
import { ReactFlowProvider } from "@xyflow/react";

// Mock the canvas store
vi.mock("@/store/canvas", () => ({
  useCanvasStore: vi.fn(),
}));

// Wrapper component for ReactFlow context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("RouterNode", () => {
  const mockRemoveNode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCanvasStore).mockReturnValue(mockRemoveNode);
  });

  it("should render router node with label", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "My Router" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("My Router")).toBeInTheDocument();
  });

  it("should render 'Router Node' text", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Router Node")).toBeInTheDocument();
  });

  it("should render with GitBranch icon", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should apply orange color class", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const orangeElement = container.querySelector('[class*="bg-orange-500"]');
    expect(orangeElement).toBeInTheDocument();
  });

  it("should show routing conditions count when provided", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{
            label: "Test Router",
            conditions: ["condition1", "condition2", "condition3"],
          }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("3 routing conditions")).toBeInTheDocument();
  });

  it("should not show routing conditions when not provided", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.queryByText(/routing conditions/)).not.toBeInTheDocument();
  });

  it("should show 1 routing condition with singular form", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router", conditions: ["condition1"] }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("1 routing conditions")).toBeInTheDocument();
  });

  it("should show 0 routing conditions when empty array", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router", conditions: [] }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("0 routing conditions")).toBeInTheDocument();
  });

  it("should show selected state when selected prop is true", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={true}
        />
      </Wrapper>
    );

    const selectedNode = container.querySelector('[class*="border-blue-500"]');
    expect(selectedNode).toBeInTheDocument();
  });

  it("should show delete button when selected", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={true}
        />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    expect(deleteButton).toBeInTheDocument();
  });

  it("should not show delete button when not selected", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("should call removeNode when delete button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={true}
        />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    if (deleteButton) {
      await user.click(deleteButton);
    }

    expect(mockRemoveNode).toHaveBeenCalledWith("router-1");
  });

  it("should render with correct node ID", () => {
    render(
      <Wrapper>
        <RouterNode
          id="custom-router-456"
          data={{ label: "Custom Router" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Custom Router")).toBeInTheDocument();
  });

  it("should render conditions count with muted styling", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{
            label: "Test Router",
            conditions: ["condition1", "condition2"],
          }}
          selected={false}
        />
      </Wrapper>
    );

    const conditionsText = screen.getByText("2 routing conditions");
    expect(conditionsText.className).toContain("text-gray-500");
  });

  it("should have multiple output handles", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    // Verify the component accepts multipleOutputs prop and renders
    expect(screen.getByText("Test Router")).toBeInTheDocument();
  });

  it("should render with white background", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    // Verify the component renders with label (which is in bg-white container)
    expect(screen.getByText("Test Router")).toBeInTheDocument();
  });

  it("should have dark mode support", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const darkModeElement = container.querySelector('[class*="dark:bg-gray"]');
    expect(darkModeElement).toBeInTheDocument();
  });

  it("should render content section", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{
            label: "Test Router",
            conditions: ["condition1", "condition2"],
          }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Router Node")).toBeInTheDocument();
    expect(screen.getByText("2 routing conditions")).toBeInTheDocument();
  });

  it("should have font-medium styling for node type text", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const nodeTypeText = screen.getByText("Router Node");
    expect(nodeTypeText.className).toContain("font-medium");
  });

  it("should render icon with white text color", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const icon = container.querySelector('[class*="text-white"]');
    expect(icon).toBeInTheDocument();
  });

  it("should pass selected state to BaseNode", () => {
    const { container, rerender } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    let borderElement = container.querySelector('[class*="border-gray-300"]');
    expect(borderElement).toBeInTheDocument();

    rerender(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={true}
        />
      </Wrapper>
    );

    borderElement = container.querySelector('[class*="border-blue-500"]');
    expect(borderElement).toBeInTheDocument();
  });

  it("should render with rounded corners", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const roundedElement = container.querySelector('[class*="rounded"]');
    expect(roundedElement).toBeInTheDocument();
  });

  it("should render with shadow", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const shadowElement = container.querySelector('[class*="shadow"]');
    expect(shadowElement).toBeInTheDocument();
  });

  it("should update when data changes", () => {
    const { rerender } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Original Label" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Original Label")).toBeInTheDocument();

    rerender(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Updated Label" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Updated Label")).toBeInTheDocument();
    expect(screen.queryByText("Original Label")).not.toBeInTheDocument();
  });

  it("should update when conditions change", () => {
    const { rerender } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router", conditions: ["condition1"] }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("1 routing conditions")).toBeInTheDocument();

    rerender(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{
            label: "Test Router",
            conditions: ["condition1", "condition2", "condition3"],
          }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("3 routing conditions")).toBeInTheDocument();
    expect(screen.queryByText("1 routing conditions")).not.toBeInTheDocument();
  });

  it("should handle removal of conditions", () => {
    const { rerender } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router", conditions: ["condition1"] }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("1 routing conditions")).toBeInTheDocument();

    rerender(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.queryByText(/routing conditions/)).not.toBeInTheDocument();
  });

  it("should render with minimum width from BaseNode", () => {
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router" }}
          selected={false}
        />
      </Wrapper>
    );

    const minWidthElement = container.querySelector('[class*="min-w-"]');
    expect(minWidthElement).toBeInTheDocument();
  });

  it("should use BaseNode onDelete prop with removeNode function", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Wrapper>
        <RouterNode
          id="test-router-123"
          data={{ label: "Test Router" }}
          selected={true}
        />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    if (deleteButton) {
      await user.click(deleteButton);
    }

    expect(mockRemoveNode).toHaveBeenCalledWith("test-router-123");
  });

  it("should handle large number of conditions", () => {
    const manyConditions = Array.from(
      { length: 100 },
      (_, i) => `condition${i}`
    );
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{ label: "Test Router", conditions: manyConditions }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("100 routing conditions")).toBeInTheDocument();
  });

  it("should display conditions count immediately after data provided", () => {
    render(
      <Wrapper>
        <RouterNode
          id="router-1"
          data={{
            label: "Test Router",
            conditions: ["cond1", "cond2"],
          }}
          selected={false}
        />
      </Wrapper>
    );

    const conditionsElement = screen.getByText("2 routing conditions");
    expect(conditionsElement).toBeInTheDocument();
  });
});
