import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { AgentList } from "../AgentList";
import type { Agent } from "../../types";

// Mock hooks
vi.mock("../../hooks", () => ({
  useAgents: vi.fn(),
  useAgent: vi.fn(),
  useCreateAgent: vi.fn(),
  useUpdateAgent: vi.fn(),
  useDeleteAgent: vi.fn(),
  useDuplicateAgent: vi.fn(),
}));

// Mock AgentFormDialog since it requires additional hooks
vi.mock("../AgentFormDialog", () => ({
  AgentFormDialog: ({ agent, open, onOpenChange }: any) => {
    if (!open) return null;
    return (
      <div data-testid="agent-form-dialog">
        <div>Edit Agent: {agent?.name}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    );
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

import {
  useAgents,
  useDeleteAgent,
  useDuplicateAgent,
  useCreateAgent,
  useUpdateAgent,
} from "../../hooks";

describe("AgentList", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    // Default mock implementations
    vi.mocked(useDeleteAgent).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      reset: vi.fn(),
    } as any);

    vi.mocked(useDuplicateAgent).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      reset: vi.fn(),
    } as any);

    vi.mocked(useCreateAgent).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      reset: vi.fn(),
    } as any);

    vi.mocked(useUpdateAgent).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      reset: vi.fn(),
    } as any);
  });

  it("should render loading skeletons", () => {
    vi.mocked(useAgents).mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no agents", async () => {
    const mockResponse = {
      items: [],
      total: 0,
      page: 1,
      page_size: 12,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No agents found")).toBeInTheDocument();
    });
  });

  it("should render agent cards when data exists", async () => {
    const agents = [
      createMockAgent({ name: "Agent Alpha" }),
      createMockAgent({ name: "Agent Beta" }),
      createMockAgent({ name: "Agent Gamma" }),
    ];
    const mockResponse = {
      items: agents,
      total: 3,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Agent Alpha")).toBeInTheDocument();
      expect(screen.getByText("Agent Beta")).toBeInTheDocument();
      expect(screen.getByText("Agent Gamma")).toBeInTheDocument();
    });
  });

  it("should filter by search query", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      items: [createMockAgent({ name: "Filtered Agent" })],
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    const searchInput = screen.getByPlaceholderText("Search agents...");
    await user.type(searchInput, "test query");

    await waitFor(() => {
      expect(searchInput).toHaveValue("test query");
    });
  });

  it("should filter by type", async () => {
    const user = userEvent.setup();
    const agents = [createMockAgent({ name: "Chat Agent", type: "chat" })];
    const mockResponse = {
      items: agents,
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Chat Agent")).toBeInTheDocument();
    });

    // Find the type select button (find button with role combobox containing "All Types")
    const typeSelectButton = screen
      .getAllByRole("combobox")
      .find((btn) => btn.textContent?.includes("All Types"));
    expect(typeSelectButton).toBeDefined();
    await user.click(typeSelectButton!);

    // Select chat option from dropdown
    const chatOptions = screen.getAllByText("Chat");
    await user.click(chatOptions[chatOptions.length - 1]!); // Click the one in dropdown

    await waitFor(() => {
      expect(screen.getByText("Chat Agent")).toBeInTheDocument();
    });
  });

  it("should filter by provider", async () => {
    const user = userEvent.setup();
    const agents = [
      createMockAgent({ name: "OpenAI Agent", provider: "openai" }),
    ];
    const mockResponse = {
      items: agents,
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("OpenAI Agent")).toBeInTheDocument();
    });

    // Find the provider select button (find button with role combobox containing "All Providers")
    const providerSelectButton = screen
      .getAllByRole("combobox")
      .find((btn) => btn.textContent?.includes("All Providers"));
    expect(providerSelectButton).toBeDefined();
    await user.click(providerSelectButton!);

    // Select OpenAI option from dropdown
    const openaiOptions = screen.getAllByText("OpenAI");
    await user.click(openaiOptions[openaiOptions.length - 1]!); // Last one is in dropdown

    await waitFor(() => {
      expect(screen.getByText("OpenAI Agent")).toBeInTheDocument();
    });
  });

  it("should filter by status", async () => {
    const user = userEvent.setup();
    const agents = [
      createMockAgent({ name: "Active Agent", status: "active" }),
    ];
    const mockResponse = {
      items: agents,
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Active Agent")).toBeInTheDocument();
    });

    // Find the status select button (find button with role combobox containing "All Status")
    const statusSelectButton = screen
      .getAllByRole("combobox")
      .find((btn) => btn.textContent?.includes("All Status"));
    expect(statusSelectButton).toBeDefined();
    await user.click(statusSelectButton!);

    // Select Active option from dropdown
    const activeOptions = screen.getAllByText("Active");
    await user.click(activeOptions[activeOptions.length - 1]!); // Last one is in dropdown

    await waitFor(() => {
      expect(screen.getByText("Active Agent")).toBeInTheDocument();
    });
  });

  it("should handle pagination - next page", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      items: [createMockAgent()],
      total: 24,
      page: 1,
      page_size: 12,
      total_pages: 2,
      has_next: true,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByText("Next");
    expect(nextButton).not.toBeDisabled();

    await user.click(nextButton);

    // The component should update with new page
    await waitFor(() => {
      expect(nextButton).toBeInTheDocument();
    });
  });

  it("should handle pagination - previous page", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      items: [createMockAgent()],
      total: 24,
      page: 2,
      page_size: 12,
      total_pages: 2,
      has_next: false,
      has_prev: true,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    });

    const prevButton = screen.getByText("Previous");
    expect(prevButton).not.toBeDisabled();

    await user.click(prevButton);

    await waitFor(() => {
      expect(prevButton).toBeInTheDocument();
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(useAgents).mockReturnValue({
      data: undefined,
      isPending: false,
      error: new Error("Network error"),
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load agents")).toBeInTheDocument();
    });
  });

  it("should open edit dialog on edit click", async () => {
    const user = userEvent.setup();
    const agent = createMockAgent({ name: "Edit Test Agent" });
    const mockResponse = {
      items: [agent],
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Edit Test Agent")).toBeInTheDocument();
    });

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Edit
    const editButton = screen.getByText("Edit");
    await user.click(editButton);

    // The edit dialog should open
    await waitFor(() => {
      expect(screen.getByTestId("agent-form-dialog")).toBeInTheDocument();
      expect(
        screen.getByText("Edit Agent: Edit Test Agent")
      ).toBeInTheDocument();
    });
  });

  it("should call duplicate mutation on duplicate click", async () => {
    const user = userEvent.setup();
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    const agent = createMockAgent({
      id: "agent-duplicate-123",
      name: "Duplicate Test Agent",
    });
    const mockResponse = {
      items: [agent],
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useDuplicateAgent).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Duplicate Test Agent")).toBeInTheDocument();
    });

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Duplicate
    const duplicateButton = screen.getByText("Duplicate");
    await user.click(duplicateButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith("agent-duplicate-123");
    });
  });

  it("should call delete mutation on delete click with confirmation", async () => {
    const user = userEvent.setup();
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    const agent = createMockAgent({
      id: "agent-delete-123",
      name: "Delete Test Agent",
    });
    const mockResponse = {
      items: [agent],
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useDeleteAgent).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as any);

    mockConfirm.mockReturnValue(true);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Delete Test Agent")).toBeInTheDocument();
    });

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Delete
    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockMutateAsync).toHaveBeenCalledWith("agent-delete-123");
    });
  });

  it("should not call delete mutation when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    const agent = createMockAgent({
      id: "agent-cancel-123",
      name: "Cancel Test Agent",
    });
    const mockResponse = {
      items: [agent],
      total: 1,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useDeleteAgent).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as any);

    mockConfirm.mockReturnValue(false);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Cancel Test Agent")).toBeInTheDocument();
    });

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Delete
    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  it("should render grid layout for agents", async () => {
    const agents = Array.from({ length: 3 }, (_, i) =>
      createMockAgent({ name: `Agent ${i + 1}` })
    );
    const mockResponse = {
      items: agents,
      total: 3,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    const { container } = renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  it("should show skeleton cards during loading", () => {
    vi.mocked(useAgents).mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should display different agent types with correct labels", async () => {
    const agents = [
      createMockAgent({ name: "Chat Agent", type: "chat" }),
      createMockAgent({ name: "Completion Agent", type: "completion" }),
      createMockAgent({ name: "Embedding Agent", type: "embedding" }),
      createMockAgent({ name: "Custom Agent", type: "custom" }),
    ];
    const mockResponse = {
      items: agents,
      total: 4,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Chat Agent")).toBeInTheDocument();
      expect(screen.getByText("Completion Agent")).toBeInTheDocument();
      expect(screen.getByText("Embedding Agent")).toBeInTheDocument();
      expect(screen.getByText("Custom Agent")).toBeInTheDocument();
    });
  });

  it("should display different agent statuses", async () => {
    const agents = [
      createMockAgent({ name: "Active Agent", status: "active" }),
      createMockAgent({ name: "Inactive Agent", status: "inactive" }),
      createMockAgent({ name: "Error Agent", status: "error" }),
    ];
    const mockResponse = {
      items: agents,
      total: 3,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Active Agent")).toBeInTheDocument();
      expect(screen.getByText("Inactive Agent")).toBeInTheDocument();
      expect(screen.getByText("Error Agent")).toBeInTheDocument();
      expect(screen.getAllByText("active").length).toBeGreaterThan(0);
      expect(screen.getAllByText("inactive").length).toBeGreaterThan(0);
      expect(screen.getAllByText("error").length).toBeGreaterThan(0);
    });
  });

  it("should show empty state message with search suggestion when filtered", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      items: [],
      total: 0,
      page: 1,
      page_size: 12,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No agents found")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search agents...");
    await user.type(searchInput, "nonexistent");

    await waitFor(() => {
      expect(
        screen.getByText("Try adjusting your search filters")
      ).toBeInTheDocument();
    });
  });

  it("should disable pagination buttons appropriately", async () => {
    const mockResponse = {
      items: [createMockAgent()],
      total: 12,
      page: 1,
      page_size: 12,
      total_pages: 1,
      has_next: false,
      has_prev: false,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    // With only one page, pagination should not be shown
    await waitFor(() => {
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });
  });

  it("should display pagination info correctly", async () => {
    const mockResponse = {
      items: [createMockAgent()],
      total: 36,
      page: 2,
      page_size: 12,
      total_pages: 3,
      has_next: true,
      has_prev: true,
    };

    vi.mocked(useAgents).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<AgentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    });
  });
});
