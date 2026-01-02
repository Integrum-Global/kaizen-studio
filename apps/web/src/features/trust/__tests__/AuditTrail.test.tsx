/**
 * Phase 3: Audit Trail Component Tests
 *
 * Tests for AuditEventCard, AuditFilters, AuditExport, and DelegationTimeline
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AuditEventCard } from "../components/AuditTrail/AuditEventCard";
import { AuditFilters } from "../components/AuditTrail/AuditFilters";
import { AuditExport } from "../components/AuditTrail/AuditExport";
import { DelegationTimeline } from "../components/AuditTrail/DelegationTimeline";
import { createMockAuditAnchor, createMockDelegationRecord } from "./fixtures";
import { ActionResult } from "../types";

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(navigator, "clipboard", {
  value: mockClipboard,
  writable: true,
});

describe("AuditEventCard", () => {
  const mockEvent = createMockAuditAnchor();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders audit event information correctly", () => {
    renderWithProviders(<AuditEventCard event={mockEvent} />);

    expect(screen.getByText(mockEvent.action)).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("shows resource when provided", () => {
    const eventWithResource = createMockAuditAnchor({
      resource: "database://test-resource",
    });
    renderWithProviders(<AuditEventCard event={eventWithResource} />);

    expect(screen.getByText(/database:\/\/test-resource/)).toBeInTheDocument();
  });

  it("handles event without resource", () => {
    const eventWithoutResource = createMockAuditAnchor({ resource: null });
    renderWithProviders(<AuditEventCard event={eventWithoutResource} />);

    // Resource text should not be shown
    expect(screen.queryByText(/^on /)).not.toBeInTheDocument();
  });

  it("displays correct badge for different results", () => {
    const successEvent = createMockAuditAnchor({
      result: ActionResult.SUCCESS,
    });
    const { rerender } = renderWithProviders(
      <AuditEventCard event={successEvent} />
    );
    expect(screen.getByText("Success")).toBeInTheDocument();

    const failureEvent = createMockAuditAnchor({
      result: ActionResult.FAILURE,
    });
    rerender(<AuditEventCard event={failureEvent} />);
    expect(screen.getByText("Failure")).toBeInTheDocument();

    const deniedEvent = createMockAuditAnchor({ result: ActionResult.DENIED });
    rerender(<AuditEventCard event={deniedEvent} />);
    expect(screen.getByText("Denied")).toBeInTheDocument();

    const partialEvent = createMockAuditAnchor({
      result: ActionResult.PARTIAL,
    });
    rerender(<AuditEventCard event={partialEvent} />);
    expect(screen.getByText("Partial")).toBeInTheDocument();
  });

  it("calls onAgentClick when agent link is clicked", async () => {
    const onAgentClick = vi.fn();
    renderWithProviders(
      <AuditEventCard event={mockEvent} onAgentClick={onAgentClick} />
    );

    // Find the agent span (it shows "Agent: {first 8 chars}...")
    const agentLink = screen.getByText(/^Agent:/);
    await userEvent.click(agentLink);

    expect(onAgentClick).toHaveBeenCalledWith(mockEvent.agent_id);
  });

  it("expands to show additional details when clicked", async () => {
    renderWithProviders(<AuditEventCard event={mockEvent} />);

    // Find and click the collapsible trigger (the main content area)
    const trigger = screen.getByText(mockEvent.action).closest("[data-state]");
    if (trigger) {
      await userEvent.click(trigger);
    }

    // After expansion, Event ID should be visible
    await waitFor(() => {
      expect(screen.getByText("Event ID")).toBeInTheDocument();
      expect(screen.getByText("Trust Chain Hash")).toBeInTheDocument();
    });
  });

  it("shows timestamp in relative format", () => {
    renderWithProviders(<AuditEventCard event={mockEvent} />);

    // The timestamp should be shown in relative format like "X days ago"
    // Look for a time-related text
    expect(screen.getByText(/ago$/)).toBeInTheDocument();
  });
});

describe("AuditFilters", () => {
  const defaultFilters = {
    searchQuery: "",
    agentId: "",
    action: "",
    result: "" as const,
    startTime: null,
    endTime: null,
  };

  const mockAgents = [
    { id: "agent-123", name: "Test Agent 1" },
    { id: "agent-456", name: "Test Agent 2" },
  ];

  const mockActions = ["read_database", "write_database", "delete_resource"];

  it("renders filter controls", () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(
      <AuditFilters
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableAgents={mockAgents}
        availableActions={mockActions}
      />
    );

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("calls onFiltersChange when search query changes", async () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(
      <AuditFilters
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableAgents={mockAgents}
        availableActions={mockActions}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, "test");

    // Each character typed should trigger onChange
    expect(onFiltersChange).toHaveBeenCalled();
  });

  it("shows time preset buttons", () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(
      <AuditFilters
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableAgents={mockAgents}
        availableActions={mockActions}
      />
    );

    expect(screen.getByText("Last hour")).toBeInTheDocument();
    expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
  });

  it("applies time preset when clicked", async () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(
      <AuditFilters
        filters={defaultFilters}
        onFiltersChange={onFiltersChange}
        availableAgents={mockAgents}
        availableActions={mockActions}
      />
    );

    const lastHourButton = screen.getByText("Last hour");
    await userEvent.click(lastHourButton);

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: expect.any(Date),
        endTime: expect.any(Date),
      })
    );
  });

  it("shows active filter badges when filters are applied", () => {
    const onFiltersChange = vi.fn();
    const activeFilters = {
      ...defaultFilters,
      searchQuery: "test query",
    };

    renderWithProviders(
      <AuditFilters
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
        availableAgents={mockAgents}
        availableActions={mockActions}
      />
    );

    expect(screen.getByText(/Search: test query/)).toBeInTheDocument();
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("clears all filters when Clear all button is clicked", async () => {
    const onFiltersChange = vi.fn();
    const activeFilters = {
      searchQuery: "test",
      agentId: "agent-123",
      action: "",
      result: "" as const,
      startTime: null,
      endTime: null,
    };

    renderWithProviders(
      <AuditFilters
        filters={activeFilters}
        onFiltersChange={onFiltersChange}
        availableAgents={mockAgents}
        availableActions={mockActions}
      />
    );

    const clearButton = screen.getByText("Clear all");
    await userEvent.click(clearButton);

    expect(onFiltersChange).toHaveBeenCalledWith({
      searchQuery: "",
      agentId: "",
      action: "",
      result: "",
      startTime: null,
      endTime: null,
    });
  });
});

describe("AuditExport", () => {
  const mockEvents = [
    createMockAuditAnchor({ id: "audit-1" }),
    createMockAuditAnchor({ id: "audit-2" }),
    createMockAuditAnchor({ id: "audit-3" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock link click
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it("renders export button with event count", () => {
    renderWithProviders(<AuditExport events={mockEvents} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).toBeInTheDocument();
    expect(screen.getByText(`(${mockEvents.length})`)).toBeInTheDocument();
  });

  it("disables export when there are no events", () => {
    renderWithProviders(<AuditExport events={[]} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).toBeDisabled();
  });

  it("disables export when loading", () => {
    renderWithProviders(<AuditExport events={mockEvents} isLoading={true} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).toBeDisabled();
  });

  it("shows dropdown with CSV and JSON options when clicked", async () => {
    renderWithProviders(<AuditExport events={mockEvents} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    await userEvent.click(exportButton);

    expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
    expect(screen.getByText(/export as json/i)).toBeInTheDocument();
  });

  it("triggers file download when CSV option is clicked", async () => {
    renderWithProviders(
      <AuditExport events={mockEvents} filename="test-export" />
    );

    const exportButton = screen.getByRole("button", { name: /export/i });
    await userEvent.click(exportButton);

    const csvOption = screen.getByText(/export as csv/i);
    await userEvent.click(csvOption);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  it("triggers file download when JSON option is clicked", async () => {
    renderWithProviders(
      <AuditExport events={mockEvents} filename="test-export" />
    );

    const exportButton = screen.getByRole("button", { name: /export/i });
    await userEvent.click(exportButton);

    const jsonOption = screen.getByText(/export as json/i);
    await userEvent.click(jsonOption);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });
});

describe("DelegationTimeline", () => {
  const mockDelegations = [
    createMockDelegationRecord({ id: "del-1" }),
    createMockDelegationRecord({
      id: "del-2",
      delegator_id: "agent-456",
      delegatee_id: "agent-789",
    }),
  ];

  const mockAuditEvents = [
    createMockAuditAnchor({ id: "audit-1", result: ActionResult.SUCCESS }),
    createMockAuditAnchor({ id: "audit-2", result: ActionResult.FAILURE }),
    createMockAuditAnchor({ id: "audit-3", result: ActionResult.DENIED }),
  ];

  it("renders timeline with delegation and audit events", () => {
    renderWithProviders(
      <DelegationTimeline
        delegations={mockDelegations}
        auditEvents={mockAuditEvents}
      />
    );

    // Should show delegation events with "Trust Delegated" title
    expect(screen.getAllByText(/trust delegated/i).length).toBeGreaterThan(0);
  });

  it("shows empty state when no events", () => {
    renderWithProviders(
      <DelegationTimeline delegations={[]} auditEvents={[]} />
    );

    expect(screen.getByText(/no timeline events/i)).toBeInTheDocument();
  });

  it("displays event count in header", () => {
    renderWithProviders(
      <DelegationTimeline
        delegations={mockDelegations}
        auditEvents={mockAuditEvents}
      />
    );

    // Total events = delegations + audits = 2 + 3 = 5
    expect(screen.getByText(/5 events/i)).toBeInTheDocument();
  });

  it("shows filter dropdowns", () => {
    renderWithProviders(
      <DelegationTimeline
        delegations={mockDelegations}
        auditEvents={mockAuditEvents}
      />
    );

    // Should have event type and result filter dropdowns
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBe(2);
  });

  it("shows action titles from audit events", () => {
    renderWithProviders(
      <DelegationTimeline delegations={[]} auditEvents={mockAuditEvents} />
    );

    // The action from mock audit anchor is "read_database"
    expect(screen.getAllByText("read_database").length).toBeGreaterThan(0);
  });

  it("calls onAgentClick when agent link is clicked", async () => {
    const onAgentClick = vi.fn();
    renderWithProviders(
      <DelegationTimeline
        delegations={mockDelegations}
        auditEvents={mockAuditEvents}
        onAgentClick={onAgentClick}
      />
    );

    // Find an agent link and click it
    const agentLinks = screen.getAllByText(/^Agent:/);
    await userEvent.click(agentLinks[0]);

    expect(onAgentClick).toHaveBeenCalled();
  });

  it("shows relative timestamps for events", () => {
    renderWithProviders(
      <DelegationTimeline
        delegations={mockDelegations}
        auditEvents={mockAuditEvents}
      />
    );

    // Should show relative time like "X days ago" or "X months ago"
    expect(screen.getAllByText(/ago$/).length).toBeGreaterThan(0);
  });
});
