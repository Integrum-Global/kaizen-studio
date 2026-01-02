import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AgentCard } from "../AgentCard";
import type { Agent, AgentType, AgentProvider, AgentStatus } from "../../types";

// Mock navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AgentCard", () => {
  const createMockAgent = (overrides?: Partial<Agent>): Agent => ({
    id: `agent-${Math.random()}`,
    organization_id: "org-123",
    name: "Test Agent",
    description: "A test agent for testing purposes",
    type: "chat",
    provider: "openai",
    model: "gpt-4",
    system_prompt: "You are a helpful assistant",
    temperature: 0.7,
    max_tokens: 1000,
    tools: [],
    status: "active",
    created_by: "user-123",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  const mockOnEdit = vi.fn();
  const mockOnDuplicate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAgentCard = (agent: Agent) => {
    return render(
      <BrowserRouter>
        <AgentCard
          agent={agent}
          onEdit={mockOnEdit}
          onDuplicate={mockOnDuplicate}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );
  };

  it("should render agent name", () => {
    const agent = createMockAgent({
      name: "My Custom Agent",
    });

    renderAgentCard(agent);

    expect(screen.getByText("My Custom Agent")).toBeInTheDocument();
  });

  it("should render agent description", () => {
    const agent = createMockAgent({
      description: "This is a custom agent description",
    });

    renderAgentCard(agent);

    expect(
      screen.getByText("This is a custom agent description")
    ).toBeInTheDocument();
  });

  it("should render agent type", () => {
    const agent = createMockAgent({
      type: "completion",
    });

    renderAgentCard(agent);

    expect(screen.getByText("Completion")).toBeInTheDocument();
  });

  it("should render agent provider", () => {
    const agent = createMockAgent({
      provider: "anthropic",
    });

    renderAgentCard(agent);

    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  it("should render agent model", () => {
    const agent = createMockAgent({
      model: "claude-3-opus",
    });

    renderAgentCard(agent);

    expect(screen.getByText("claude-3-opus")).toBeInTheDocument();
  });

  it("should show active status badge with correct color", () => {
    const agent = createMockAgent({
      status: "active",
    });

    renderAgentCard(agent);

    const badge = screen.getByText("active");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-green-500");
  });

  it("should show inactive status badge with correct color", () => {
    const agent = createMockAgent({
      status: "inactive",
    });

    renderAgentCard(agent);

    const badge = screen.getByText("inactive");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-gray-500");
  });

  it("should show error status badge with correct color", () => {
    const agent = createMockAgent({
      status: "error",
    });

    renderAgentCard(agent);

    const badge = screen.getByText("error");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-red-500");
  });

  it("should show enabled tools count", () => {
    const agent = createMockAgent({
      tools: [
        { id: "1", name: "Tool 1", description: "First tool", enabled: true },
        { id: "2", name: "Tool 2", description: "Second tool", enabled: true },
        { id: "3", name: "Tool 3", description: "Third tool", enabled: false },
      ],
    });

    renderAgentCard(agent);

    expect(screen.getByText("2 enabled")).toBeInTheDocument();
  });

  it("should show zero enabled tools when no tools are enabled", () => {
    const agent = createMockAgent({
      tools: [
        { id: "1", name: "Tool 1", description: "First tool", enabled: false },
        { id: "2", name: "Tool 2", description: "Second tool", enabled: false },
      ],
    });

    renderAgentCard(agent);

    expect(screen.getByText("0 enabled")).toBeInTheDocument();
  });

  it("should call onEdit when Edit menu item clicked", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent();

    renderAgentCard(agent);

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Edit
    const editButton = screen.getByText("Edit");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(agent);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it("should call onDuplicate when Duplicate menu item clicked", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent({ id: "agent-123" });

    renderAgentCard(agent);

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Duplicate
    const duplicateButton = screen.getByText("Duplicate");
    await user.click(duplicateButton);

    expect(mockOnDuplicate).toHaveBeenCalledWith("agent-123");
    expect(mockOnDuplicate).toHaveBeenCalledTimes(1);
  });

  it("should call onDelete when Delete menu item clicked", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent({ id: "agent-456" });

    renderAgentCard(agent);

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Delete
    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith("agent-456");
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("should navigate to agent detail on card click", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent({ id: "agent-789" });

    const { container } = renderAgentCard(agent);

    // Click on the card (not the menu)
    const card = container.querySelector('[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();

    if (card) {
      await user.click(card);
      expect(mockNavigate).toHaveBeenCalledWith("/agents/agent-789");
    }
  });

  it("should not navigate when clicking dropdown menu", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent();

    renderAgentCard(agent);

    // Click the dropdown menu button
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Should not navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should render chat type correctly", () => {
    const agent = createMockAgent({ type: "chat" });
    const { unmount } = renderAgentCard(agent);
    expect(screen.getByText("Chat")).toBeInTheDocument();
    unmount();
  });

  it("should render completion type correctly", () => {
    const agent = createMockAgent({ type: "completion" });
    const { unmount } = renderAgentCard(agent);
    expect(screen.getByText("Completion")).toBeInTheDocument();
    unmount();
  });

  it("should render embedding type correctly", () => {
    const agent = createMockAgent({ type: "embedding" });
    const { unmount } = renderAgentCard(agent);
    expect(screen.getByText("Embedding")).toBeInTheDocument();
    unmount();
  });

  it("should render custom type correctly", () => {
    const agent = createMockAgent({ type: "custom" });
    const { unmount } = renderAgentCard(agent);
    expect(screen.getByText("Custom")).toBeInTheDocument();
    unmount();
  });

  it("should render all agent types correctly", () => {
    const types: AgentType[] = ["chat", "completion", "embedding", "custom"];
    const labels = ["Chat", "Completion", "Embedding", "Custom"];

    types.forEach((type, index) => {
      const agent = createMockAgent({ type });
      const { unmount } = renderAgentCard(agent);
      expect(screen.getByText(labels[index]!)).toBeInTheDocument();
      unmount();
    });
  });

  it("should render all provider types correctly", () => {
    const providers: AgentProvider[] = [
      "openai",
      "anthropic",
      "google",
      "azure",
      "custom",
    ];
    const labels = ["OpenAI", "Anthropic", "Google", "Azure", "Custom"];

    providers.forEach((provider, index) => {
      const agent = createMockAgent({ provider });
      const { unmount } = renderAgentCard(agent);
      expect(screen.getByText(labels[index]!)).toBeInTheDocument();
      unmount();
    });
  });

  it("should render all status types correctly", () => {
    const statuses: AgentStatus[] = ["active", "inactive", "error"];

    statuses.forEach((status) => {
      const agent = createMockAgent({ status });
      const { unmount } = renderAgentCard(agent);
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });

  it("should display agent information in correct sections", () => {
    const agent = createMockAgent({
      name: "Production Agent",
      description: "Agent for production use",
      type: "chat",
      provider: "openai",
      model: "gpt-4-turbo",
      status: "active",
    });

    renderAgentCard(agent);

    // Name and description should be in header
    expect(screen.getByText("Production Agent")).toBeInTheDocument();
    expect(screen.getByText("Agent for production use")).toBeInTheDocument();

    // Type, provider, model should be visible in content
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("gpt-4-turbo")).toBeInTheDocument();

    // Status badge should be visible
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("should apply hover styles to card", () => {
    const agent = createMockAgent();

    const { container } = renderAgentCard(agent);

    const card = container.querySelector('[class*="hover:shadow-lg"]');
    expect(card).toBeInTheDocument();
  });

  it("should truncate long description with line-clamp", () => {
    const agent = createMockAgent({
      description:
        "This is a very long description that should be truncated when it exceeds the maximum number of lines allowed by the line-clamp-2 CSS class",
    });

    const { container } = renderAgentCard(agent);

    const description = container.querySelector(".line-clamp-2");
    expect(description).toBeInTheDocument();
  });

  it("should show dropdown menu with all options", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent();

    renderAgentCard(agent);

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Check all menu items are present
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should stop propagation when clicking menu items", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent({ id: "agent-test" });

    renderAgentCard(agent);

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Edit - should not navigate
    const editButton = screen.getByText("Edit");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
