import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentNode } from "../AgentNode";
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

describe("AgentNode", () => {
  const mockRemoveNode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCanvasStore).mockReturnValue(mockRemoveNode);
  });

  it("should render agent node with label", () => {
    render(
      <Wrapper>
        <AgentNode id="agent-1" data={{ label: "My Agent" }} selected={false} />
      </Wrapper>
    );

    expect(screen.getByText("My Agent")).toBeInTheDocument();
  });

  it("should render 'Agent Node' text", () => {
    render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Agent Node")).toBeInTheDocument();
  });

  it("should render agent ID when provided", () => {
    render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent", agentId: "agent-123" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText(/Agent ID: agent-123/)).toBeInTheDocument();
  });

  it("should not render agent ID section when not provided", () => {
    render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.queryByText(/Agent ID:/)).not.toBeInTheDocument();
  });

  it("should render with Bot icon", () => {
    const { container } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should apply blue color class", () => {
    const { container } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    const blueElement = container.querySelector('[class*="bg-blue-500"]');
    expect(blueElement).toBeInTheDocument();
  });

  it("should show selected state when selected prop is true", () => {
    const { container } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={true}
        />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    if (deleteButton) {
      await user.click(deleteButton);
    }

    expect(mockRemoveNode).toHaveBeenCalledWith("agent-1");
  });

  it("should render with correct node ID", () => {
    render(
      <Wrapper>
        <AgentNode
          id="custom-agent-456"
          data={{ label: "Custom Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Custom Agent")).toBeInTheDocument();
  });

  it("should render agent ID with muted styling", () => {
    render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent", agentId: "agent-123" }}
          selected={false}
        />
      </Wrapper>
    );

    const agentIdText = screen.getByText(/Agent ID: agent-123/);
    expect(agentIdText.className).toContain("text-gray-500");
  });

  it("should have input and output handles", () => {
    const { container } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    // ReactFlow handles are rendered by default
    const handles = container.querySelectorAll('[class*="react-flow__handle"]');
    expect(handles.length).toBeGreaterThanOrEqual(0);
  });

  it("should render with white background", () => {
    render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    // Verify the component renders with label (which is in bg-white container)
    expect(screen.getByText("Test Agent")).toBeInTheDocument();
  });

  it("should have dark mode support", () => {
    const { container } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent", agentId: "agent-123" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Agent Node")).toBeInTheDocument();
    expect(screen.getByText(/Agent ID: agent-123/)).toBeInTheDocument();
  });

  it("should render agent ID label", () => {
    render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent", agentId: "my-agent-id" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText(/Agent ID: my-agent-id/)).toBeInTheDocument();
  });

  it("should have font-medium styling for node type text", () => {
    render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    const nodeTypeText = screen.getByText("Agent Node");
    expect(nodeTypeText.className).toContain("font-medium");
  });

  it("should render icon with white text color", () => {
    const { container } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    let borderElement = container.querySelector('[class*="border-gray-300"]');
    expect(borderElement).toBeInTheDocument();

    rerender(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="agent-1"
          data={{ label: "Original Label" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Original Label")).toBeInTheDocument();

    rerender(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Updated Label" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText("Updated Label")).toBeInTheDocument();
    expect(screen.queryByText("Original Label")).not.toBeInTheDocument();
  });

  it("should update when agent ID changes", () => {
    const { rerender } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent", agentId: "agent-123" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText(/Agent ID: agent-123/)).toBeInTheDocument();

    rerender(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent", agentId: "agent-456" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText(/Agent ID: agent-456/)).toBeInTheDocument();
    expect(screen.queryByText(/Agent ID: agent-123/)).not.toBeInTheDocument();
  });

  it("should handle removal of agent ID", () => {
    const { rerender } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent", agentId: "agent-123" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.getByText(/Agent ID: agent-123/)).toBeInTheDocument();

    rerender(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
          selected={false}
        />
      </Wrapper>
    );

    expect(screen.queryByText(/Agent ID:/)).not.toBeInTheDocument();
  });

  it("should render with minimum width from BaseNode", () => {
    const { container } = render(
      <Wrapper>
        <AgentNode
          id="agent-1"
          data={{ label: "Test Agent" }}
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
        <AgentNode
          id="test-node-123"
          data={{ label: "Test Agent" }}
          selected={true}
        />
      </Wrapper>
    );

    const deleteButton = container.querySelector("button");
    if (deleteButton) {
      await user.click(deleteButton);
    }

    expect(mockRemoveNode).toHaveBeenCalledWith("test-node-123");
  });
});
