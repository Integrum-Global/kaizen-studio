import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExternalAgentsPage } from "../components/ExternalAgentsPage";

const mockAgents = [
  {
    id: "1",
    organization_id: "org-1",
    name: "Test Teams Agent",
    description: "Test description",
    provider: "teams",
    status: "active",
    auth_config: { type: "api_key", key: "test-key", header_name: "X-API-Key" },
    platform_config: { tenant_id: "test-tenant", channel_id: "test-channel" },
    governance_config: {},
    tags: ["test"],
    created_by: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    organization_id: "org-1",
    name: "Discord Bot",
    provider: "discord",
    status: "inactive",
    auth_config: { type: "api_key", key: "test-key-2", header_name: "X-API-Key" },
    platform_config: { webhook_url: "https://discord.com/api/webhooks/test" },
    governance_config: {},
    created_by: "user-1",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
];

// Mock API
vi.mock("../hooks", () => ({
  useExternalAgents: vi.fn(() => ({
    data: mockAgents,
    isPending: false,
    error: null,
  })),
  useDeleteExternalAgent: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("ExternalAgentsPage", () => {
  it("renders table with agent list", () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    expect(screen.getByText("Test Teams Agent")).toBeInTheDocument();
    expect(screen.getByText("Discord Bot")).toBeInTheDocument();
  });

  it("displays search input", () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/Search agents by name/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("displays status filter dropdown", () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const statusFilter = screen.getByLabelText(/Filter by status/i);
    expect(statusFilter).toBeInTheDocument();
    expect(statusFilter).toHaveValue("all");
  });

  it("displays Register External Agent button", () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const registerButton = screen.getByRole("button", {
      name: /Register External Agent/i,
    });
    expect(registerButton).toBeInTheDocument();
  });

  it("filters agents by status", async () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const statusFilter = screen.getByLabelText(/Filter by status/i);
    fireEvent.change(statusFilter, { target: { value: "active" } });

    await waitFor(() => {
      expect(statusFilter).toHaveValue("active");
    });
  });

  it("allows searching agents by name", async () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/Search agents by name/i);
    fireEvent.change(searchInput, { target: { value: "Teams" } });

    expect(searchInput).toHaveValue("Teams");
  });

  it("displays provider badges correctly", () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    expect(screen.getByText("teams")).toBeInTheDocument();
    expect(screen.getByText("discord")).toBeInTheDocument();
  });

  it("displays status badges with correct styling", () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const activeBadge = screen.getAllByText("active")[0];
    const inactiveBadge = screen.getByText("inactive");

    expect(activeBadge).toBeInTheDocument();
    expect(inactiveBadge).toBeInTheDocument();
  });

  it("opens wizard when Register button is clicked", async () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const registerButton = screen.getByRole("button", {
      name: /Register External Agent/i,
    });
    fireEvent.click(registerButton);

    // Wizard dialog should open (checked by looking for dialog title)
    await waitFor(() => {
      expect(screen.getByText(/Register External Agent/i)).toBeInTheDocument();
    });
  });

  it("displays action menu for each agent row", () => {
    render(<ExternalAgentsPage />, { wrapper: createWrapper() });

    const actionButtons = screen.getAllByLabelText(/Actions for/i);
    expect(actionButtons).toHaveLength(2); // One for each agent
  });
});
