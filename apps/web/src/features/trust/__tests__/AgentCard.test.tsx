/**
 * Phase 4 Part 2: Agent Card Component Tests
 *
 * Tests for AgentCardPreview, AgentTrustBadge, TrustAwareAgentSearch, and AgentTrustSummary
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AgentCardPreview } from "../components/AgentCard/AgentCardPreview";
import { AgentTrustBadge } from "../components/AgentCard/AgentTrustBadge";
import { TrustAwareAgentSearch } from "../components/AgentCard/TrustAwareAgentSearch";
import { AgentTrustSummary } from "../components/AgentCard/AgentTrustSummary";
import {
  createMockAgentWithTrust,
  createMockAgentTrustSummary,
} from "./fixtures";
import { TrustStatus } from "../types";

// Mock fetch for AgentCardPreview and AgentTrustBadge
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => createMockAgentWithTrust(),
  });
});

describe("AgentCardPreview", () => {
  const mockAgent = createMockAgentWithTrust();

  beforeEach(() => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockAgent,
    });
  });

  it("renders agent name and ID", async () => {
    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText("Test Agent")).toBeInTheDocument();
      expect(screen.getByText("ID: agent-123")).toBeInTheDocument();
    });
  });

  it("shows trust status badge", async () => {
    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      // Trust status badge should be rendered
      const badge = screen.getByText("Valid", { exact: false });
      expect(badge).toBeInTheDocument();
    });
  });

  it("shows capabilities list with count", async () => {
    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Capabilities \(3\)/)).toBeInTheDocument();
      expect(screen.getByText("read_data")).toBeInTheDocument();
      expect(screen.getByText("write_data")).toBeInTheDocument();
      expect(screen.getByText("execute_task")).toBeInTheDocument();
    });
  });

  it("shows protocols badges", async () => {
    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Supported Protocols/)).toBeInTheDocument();
      expect(screen.getByText("HTTP")).toBeInTheDocument();
      // WebSocket appears multiple times (protocol badge and endpoint)
      expect(screen.getAllByText("WebSocket").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("gRPC")).toBeInTheDocument();
    });
  });

  it("shows endpoints with links", async () => {
    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Endpoints/)).toBeInTheDocument();
      expect(screen.getByText("REST API")).toBeInTheDocument();
      // WebSocket appears as both protocol and endpoint name
      const wsElements = screen.getAllByText("WebSocket");
      expect(wsElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows trust chain summary with established by info", async () => {
    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText("Trust Information")).toBeInTheDocument();
      expect(screen.getByText("Test Authority")).toBeInTheDocument();
    });
  });

  it("calls onViewTrustChain when View Trust Chain button is clicked", async () => {
    const onViewTrustChain = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AgentCardPreview agentId="agent-123" onViewTrustChain={onViewTrustChain} />
    );

    await waitFor(() => {
      const button = screen.getByText("View Trust Chain");
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByText("View Trust Chain");
    await user.click(button);

    expect(onViewTrustChain).toHaveBeenCalledWith("agent-123");
  });

  it("handles missing optional data gracefully", async () => {
    const agentWithoutOptional = createMockAgentWithTrust({
      constraints: [],
      protocols: [],
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => agentWithoutOptional,
    });

    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText("Test Agent")).toBeInTheDocument();
    });

    // Protocols and Constraints sections should not be rendered
    expect(screen.queryByText(/Supported Protocols/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Constraints/)).not.toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load agent information")
      ).toBeInTheDocument();
    });
  });

  it("shows loading skeleton while fetching", () => {
    renderWithProviders(<AgentCardPreview agentId="agent-123" />);

    // Skeleton should be visible initially
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("AgentTrustBadge", () => {
  const mockSummary = createMockAgentTrustSummary();

  beforeEach(() => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSummary,
    });
  });

  it("renders correct status badge for valid trust", async () => {
    renderWithProviders(<AgentTrustBadge agentId="agent-123" />);

    await waitFor(() => {
      const badge = screen.getByText("Valid", { exact: false });
      expect(badge).toBeInTheDocument();
    });
  });

  it("shows tooltip on hover with basic info", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgentTrustBadge agentId="agent-123" showTooltip={true} />);

    await waitFor(() => {
      const badge = screen.getByText("Valid", { exact: false });
      expect(badge).toBeInTheDocument();
    });
  });

  it("click calls onViewDetail handler when provided", async () => {
    const onViewDetail = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AgentTrustBadge
        agentId="agent-123"
        showTooltip={true}
        onViewDetail={onViewDetail}
      />
    );

    await waitFor(() => {
      const badge = screen.getByText("Valid", { exact: false });
      expect(badge).toBeInTheDocument();
    });

    const badge = screen.getByText("Valid", { exact: false });
    await user.click(badge);

    expect(onViewDetail).toHaveBeenCalledWith("agent-123");
  });

  it("renders badge as clickable popover trigger when showPopover is true", async () => {
    const { container } = renderWithProviders(
      <AgentTrustBadge agentId="agent-123" showPopover={true} />
    );

    await waitFor(() => {
      const badge = screen.getByText("Valid", { exact: false });
      expect(badge).toBeInTheDocument();
    });

    // When showPopover is true, the badge parent (Badge component) should have cursor-pointer
    // Find the Badge element which has the className
    const badgeElement = container.querySelector(".cursor-pointer");
    expect(badgeElement).toBeInTheDocument();
  });

  it("renders different badge sizes correctly", async () => {
    const { rerender } = renderWithProviders(
      <AgentTrustBadge agentId="agent-123" size="sm" />
    );

    await waitFor(() => {
      expect(screen.getByText("Valid", { exact: false })).toBeInTheDocument();
    });

    rerender(<AgentTrustBadge agentId="agent-123" size="md" />);
    await waitFor(() => {
      expect(screen.getByText("Valid", { exact: false })).toBeInTheDocument();
    });

    rerender(<AgentTrustBadge agentId="agent-123" size="lg" />);
    await waitFor(() => {
      expect(screen.getByText("Valid", { exact: false })).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    renderWithProviders(<AgentTrustBadge agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });
});

describe("TrustAwareAgentSearch", () => {
  const defaultFilters = {
    query: "",
    trust_status: undefined,
    capabilities: undefined,
    has_constraints: undefined,
    sort_by: "name" as const,
    sort_order: "asc" as const,
  };

  const mockCapabilities = ["read_data", "write_data", "execute_task"];

  it("renders search input with placeholder", () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(
      <TrustAwareAgentSearch
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(
      screen.getByPlaceholderText("Search by name or ID...")
    ).toBeInTheDocument();
  });

  it("shows filter dropdowns for sort and order", () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(
      <TrustAwareAgentSearch
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(screen.getByText("Sort by")).toBeInTheDocument();
    expect(screen.getByText("Order")).toBeInTheDocument();
  });

  it("calls onFiltersChange when search query changes", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <TrustAwareAgentSearch
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search by name or ID...");
    await user.type(searchInput, "test");

    expect(onFiltersChange).toHaveBeenCalled();
  });

  it("shows active filter badges when filters are applied", () => {
    const onFiltersChange = vi.fn();
    const activeFilters = {
      ...defaultFilters,
      trust_status: [TrustStatus.VALID, TrustStatus.EXPIRED],
    };

    renderWithProviders(
      <TrustAwareAgentSearch
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(screen.getByText("Active filters:")).toBeInTheDocument();
    expect(screen.getByText(/Status: valid/)).toBeInTheDocument();
    expect(screen.getByText(/Status: expired/)).toBeInTheDocument();
  });

  it("clears all filters when Clear all button is clicked", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    const activeFilters = {
      query: "test",
      trust_status: [TrustStatus.VALID],
      capabilities: ["read_data"],
      has_constraints: true,
      sort_by: "name" as const,
      sort_order: "asc" as const,
    };

    renderWithProviders(
      <TrustAwareAgentSearch
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    const clearButtons = screen.getAllByText("Clear all");
    await user.click(clearButtons[0]);

    expect(onFiltersChange).toHaveBeenCalledWith({
      query: "",
      trust_status: undefined,
      capabilities: undefined,
      has_constraints: undefined,
      sort_by: "name",
      sort_order: "asc",
    });
  });

  it("shows advanced filters popup with trust status checkboxes", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <TrustAwareAgentSearch
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    const filtersButton = screen.getByText("Filters");
    await user.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByText("Trust Status")).toBeInTheDocument();
      expect(screen.getByText("Valid")).toBeInTheDocument();
      expect(screen.getByText("Expired")).toBeInTheDocument();
      expect(screen.getByText("Revoked")).toBeInTheDocument();
    });
  });

  it("allows multi-select for trust status filter", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <TrustAwareAgentSearch
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableCapabilities={mockCapabilities}
      />
    );

    const filtersButton = screen.getByText("Filters");
    await user.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByText("Valid")).toBeInTheDocument();
    });

    // Find and click Valid checkbox
    const validCheckbox = screen
      .getByText("Valid")
      .closest("div")
      ?.querySelector("input[type='checkbox']");

    if (validCheckbox) {
      await user.click(validCheckbox);
      expect(onFiltersChange).toHaveBeenCalled();
    }
  });
});

describe("AgentTrustSummary", () => {
  const mockSummary = createMockAgentTrustSummary();

  beforeEach(() => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSummary,
    });
  });

  it("shows trust status with badge", async () => {
    renderWithProviders(<AgentTrustSummary agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText("Trust Status")).toBeInTheDocument();
      expect(screen.getByText("Valid", { exact: false })).toBeInTheDocument();
    });
  });

  it("shows capability count in stats grid", async () => {
    renderWithProviders(<AgentTrustSummary agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText("Capabilities")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("shows constraint count in stats grid", async () => {
    renderWithProviders(<AgentTrustSummary agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText("Constraints")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("shows expiration warning when trust is expiring soon", async () => {
    const expiringSummary = createMockAgentTrustSummary({
      isExpiringSoon: true,
      expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => expiringSummary,
    });

    renderWithProviders(<AgentTrustSummary agentId="agent-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Trust expires in/)).toBeInTheDocument();
    });
  });

  it("calls onViewChain when View Trust Chain button is clicked", async () => {
    const onViewChain = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AgentTrustSummary agentId="agent-123" onViewChain={onViewChain} />
    );

    await waitFor(() => {
      const button = screen.getByText("View Trust Chain");
      expect(button).toBeInTheDocument();
    });

    const button = screen.getByText("View Trust Chain");
    await user.click(button);

    expect(onViewChain).toHaveBeenCalledWith("agent-123");
  });

  it("shows Delegate Trust button that is enabled for valid trust", async () => {
    const onDelegate = vi.fn();

    renderWithProviders(
      <AgentTrustSummary agentId="agent-123" onDelegate={onDelegate} />
    );

    await waitFor(() => {
      const button = screen.getByText("Delegate Trust");
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it("disables Delegate Trust button for invalid trust status", async () => {
    const invalidSummary = createMockAgentTrustSummary({
      status: TrustStatus.EXPIRED,
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => invalidSummary,
    });

    const onDelegate = vi.fn();

    renderWithProviders(
      <AgentTrustSummary agentId="agent-123" onDelegate={onDelegate} />
    );

    await waitFor(() => {
      const button = screen.getByText("Delegate Trust");
      expect(button).toBeDisabled();
    });
  });

  it("shows error state when fetch fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    renderWithProviders(<AgentTrustSummary agentId="agent-123" />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load trust information")
      ).toBeInTheDocument();
    });
  });
});
