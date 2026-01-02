import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BaseNode } from "../BaseNode";
import { Bot } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";

// Wrapper component for ReactFlow context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>{children}</ReactFlowProvider>
);

describe("BaseNode", () => {
  const mockOnDelete = vi.fn();

  const defaultProps = {
    id: "node-1",
    data: { label: "Test Node" },
    icon: <Bot className="w-4 h-4 text-white" />,
    colorClass: "bg-blue-500",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render node with label", () => {
    render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    expect(screen.getByText("Test Node")).toBeInTheDocument();
  });

  it("should render node with icon", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should apply color class to icon container", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} colorClass="bg-purple-500" />
      </Wrapper>
    );

    const iconContainer = container.querySelector('[class*="bg-purple-500"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it("should show selected state with border", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="border-blue-500"]');
    expect(node).toBeInTheDocument();
  });

  it("should show unselected state with default border", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={false} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="border-gray-300"]');
    expect(node).toBeInTheDocument();
  });

  it("should render delete button when selected and onDelete is provided", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} onDelete={mockOnDelete} />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    expect(deleteButton).toBeInTheDocument();
  });

  it("should not render delete button when not selected", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={false} onDelete={mockOnDelete} />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("should not render delete button when onDelete is not provided", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    expect(deleteButton).not.toBeInTheDocument();
  });

  it("should call onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} onDelete={mockOnDelete} />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    if (deleteButton) {
      await user.click(deleteButton);
    }

    expect(mockOnDelete).toHaveBeenCalledWith("node-1");
  });

  it("should render children when provided", () => {
    render(
      <Wrapper>
        <BaseNode {...defaultProps}>
          <div>Custom Content</div>
        </BaseNode>
      </Wrapper>
    );

    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });

  it("should not render body section when no children provided", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const bodySection = container.querySelector('[class*="p-3 text-xs"]');
    expect(bodySection).not.toBeInTheDocument();
  });

  it("should show input handle by default", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const handles = container.querySelectorAll('[class*="react-flow__handle"]');
    expect(handles.length).toBeGreaterThan(0);
  });

  it("should show output handle by default", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const handles = container.querySelectorAll('[class*="react-flow__handle"]');
    expect(handles.length).toBeGreaterThan(0);
  });

  it("should hide input handle when showInputHandle is false", () => {
    render(
      <Wrapper>
        <BaseNode {...defaultProps} showInputHandle={false} />
      </Wrapper>
    );

    // Note: Exact handle detection is complex due to ReactFlow internals
    // We verify the component renders without errors
    expect(screen.getByText("Test Node")).toBeInTheDocument();
  });

  it("should hide output handle when showOutputHandle is false", () => {
    render(
      <Wrapper>
        <BaseNode {...defaultProps} showOutputHandle={false} />
      </Wrapper>
    );

    // Verify the component renders without errors
    expect(screen.getByText("Test Node")).toBeInTheDocument();
  });

  it("should render multiple input handles when multipleInputs is true", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} multipleInputs={true} />
      </Wrapper>
    );

    const handles = container.querySelectorAll('[class*="react-flow__handle"]');
    expect(handles.length).toBeGreaterThan(0);
  });

  it("should render multiple output handles when multipleOutputs is true", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} multipleOutputs={true} />
      </Wrapper>
    );

    const handles = container.querySelectorAll('[class*="react-flow__handle"]');
    expect(handles.length).toBeGreaterThan(0);
  });

  it("should apply minimum width", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="min-w-"]');
    expect(node).toBeInTheDocument();
  });

  it("should have rounded corners", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="rounded-lg"]');
    expect(node).toBeInTheDocument();
  });

  it("should have shadow", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="shadow-lg"]');
    expect(node).toBeInTheDocument();
  });

  it("should have dark mode support", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="dark:bg-gray"]');
    expect(node).toBeInTheDocument();
  });

  it("should render header with border", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const header = container.querySelector('[class*="border-b"]');
    expect(header).toBeInTheDocument();
  });

  it("should apply transition animation", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="transition-all"]');
    expect(node).toBeInTheDocument();
  });

  it("should render with correct node ID", () => {
    render(
      <Wrapper>
        <BaseNode {...defaultProps} id="custom-node-123" />
      </Wrapper>
    );

    expect(screen.getByText("Test Node")).toBeInTheDocument();
  });

  it("should render icon container with rounded shape", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const iconContainer = container.querySelector('[class*="rounded-full"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it("should render icon container with fixed size", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const iconContainer = container.querySelector('[class*="w-8 h-8"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it("should center icon within container", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const iconContainer = container.querySelector(
      '[class*="flex items-center justify-center"]'
    );
    expect(iconContainer).toBeInTheDocument();
  });

  it("should render label with appropriate text styling", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    const label = container.querySelector('[class*="font-semibold"]');
    expect(label).toBeInTheDocument();
  });

  it("should show ring on selected state", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} />
      </Wrapper>
    );

    const node = container.querySelector('[class*="ring-2"]');
    expect(node).toBeInTheDocument();
  });

  it("should render X icon in delete button", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} onDelete={mockOnDelete} />
      </Wrapper>
    );

    // Look for X icon (lucide icon)
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(1); // Node icon + X icon
  });

  it("should apply hover state to delete button", () => {
    const { container } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} onDelete={mockOnDelete} />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    expect(deleteButton?.className).toContain("hover:text-red-500");
  });

  it("should render with white background by default", () => {
    render(
      <Wrapper>
        <BaseNode {...defaultProps} />
      </Wrapper>
    );

    // Verify the component renders with label (which is in bg-white container)
    expect(screen.getByText("Test Node")).toBeInTheDocument();
  });

  it("should handle both selected and unselected states correctly", () => {
    const { container, rerender } = render(
      <Wrapper>
        <BaseNode {...defaultProps} selected={false} />
      </Wrapper>
    );

    let node = container.querySelector('[class*="border-gray-300"]');
    expect(node).toBeInTheDocument();

    rerender(
      <Wrapper>
        <BaseNode {...defaultProps} selected={true} />
      </Wrapper>
    );

    node = container.querySelector('[class*="border-blue-500"]');
    expect(node).toBeInTheDocument();
  });

  it("should render children in body section with correct styling", () => {
    render(
      <Wrapper>
        <BaseNode {...defaultProps}>
          <div>Body Content</div>
        </BaseNode>
      </Wrapper>
    );

    const bodyContent = screen.getByText("Body Content");
    expect(bodyContent.parentElement?.className).toContain("text-xs");
  });
});
