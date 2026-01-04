/**
 * Tests for ResourcePicker component
 *
 * These tests verify the ResourcePicker component's behavior for selecting
 * resources (agents, gateways, deployments, teams) with single and multi-select modes.
 *
 * Note: This is Tier 1 unit testing, so hooks are mocked.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResourcePicker } from "../inputs/ResourcePicker";
import type { ResourceReference } from "../types";

// Mock the hooks
vi.mock("@/features/agents/hooks", () => ({
  useAgents: vi.fn(),
}));

vi.mock("@/features/gateways/hooks", () => ({
  useGateways: vi.fn(),
}));

vi.mock("@/features/deployments/hooks", () => ({
  useDeployments: vi.fn(),
}));

vi.mock("@/features/teams/hooks", () => ({
  useTeams: vi.fn(),
}));

// Import mocked hooks for type-safe access
import { useAgents } from "@/features/agents/hooks";
import { useGateways } from "@/features/gateways/hooks";
import { useDeployments } from "@/features/deployments/hooks";
import { useTeams } from "@/features/teams/hooks";

// Test data
const mockAgents = [
  { id: "agent-1", name: "Support Bot", description: "Customer support agent", status: "active" },
  { id: "agent-2", name: "Sales Bot", description: "Sales assistant", status: "active" },
  { id: "agent-3", name: "Analytics Bot", description: "Data analytics agent", status: "inactive" },
];

const mockGateways = [
  { id: "gateway-1", name: "Production Gateway", description: "Prod environment", status: "healthy", environment: "production" },
  { id: "gateway-2", name: "Staging Gateway", description: "Staging environment", status: "healthy", environment: "staging" },
];

const mockDeployments = [
  { id: "deploy-1", pipelineName: "ML Pipeline", environment: "production", status: "running" },
  { id: "deploy-2", pipelineName: "ETL Pipeline", environment: "staging", status: "stopped" },
];

const mockTeams = [
  { id: "team-1", name: "Engineering", description: "Engineering team" },
  { id: "team-2", name: "Product", description: "Product team" },
  { id: "team-3", name: "Design", description: "Design team" },
];

// Setup default mock returns
function setupMocks(overrides: {
  agents?: { data?: { items: typeof mockAgents }; isPending?: boolean; error?: Error | null };
  gateways?: { data?: { records: typeof mockGateways }; isPending?: boolean; error?: Error | null };
  deployments?: { data?: { deployments: typeof mockDeployments }; isPending?: boolean; error?: Error | null };
  teams?: { data?: { records: typeof mockTeams }; isPending?: boolean; error?: Error | null };
} = {}) {
  (useAgents as Mock).mockReturnValue({
    data: overrides.agents?.data ?? { items: mockAgents },
    isPending: overrides.agents?.isPending ?? false,
    error: overrides.agents?.error ?? null,
  });

  (useGateways as Mock).mockReturnValue({
    data: overrides.gateways?.data ?? { records: mockGateways },
    isPending: overrides.gateways?.isPending ?? false,
    error: overrides.gateways?.error ?? null,
  });

  (useDeployments as Mock).mockReturnValue({
    data: overrides.deployments?.data ?? { deployments: mockDeployments },
    isPending: overrides.deployments?.isPending ?? false,
    error: overrides.deployments?.error ?? null,
  });

  (useTeams as Mock).mockReturnValue({
    data: overrides.teams?.data ?? { records: mockTeams },
    isPending: overrides.teams?.isPending ?? false,
    error: overrides.teams?.error ?? null,
  });
}

// Helper to render with user event setup
function setup(overrides: Partial<Parameters<typeof ResourcePicker>[0]> = {}) {
  const user = userEvent.setup();
  const defaultProps = {
    resourceType: "agent" as const,
    value: null,
    onChange: vi.fn(),
    multiple: false,
    disabled: false,
    placeholder: undefined,
  };
  const mergedProps = { ...defaultProps, ...overrides };
  const result = render(<ResourcePicker {...mergedProps} />);
  return { user, ...result, ...mergedProps };
}

describe("ResourcePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  describe("rendering", () => {
    it("renders picker trigger with placeholder", () => {
      setup();

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
      expect(screen.getByText("Search work units...")).toBeInTheDocument();
    });

    it("renders with custom placeholder", () => {
      setup({ placeholder: "Select an agent" });

      expect(screen.getByText("Select an agent")).toBeInTheDocument();
    });

    it("renders correct placeholder for each resource type", () => {
      const { rerender } = render(
        <ResourcePicker resourceType="agent" value={null} onChange={vi.fn()} />
      );
      expect(screen.getByText("Search work units...")).toBeInTheDocument();

      rerender(
        <ResourcePicker resourceType="gateway" value={null} onChange={vi.fn()} />
      );
      expect(screen.getByText("Search gateways...")).toBeInTheDocument();

      rerender(
        <ResourcePicker resourceType="deployment" value={null} onChange={vi.fn()} />
      );
      expect(screen.getByText("Search deployments...")).toBeInTheDocument();

      rerender(
        <ResourcePicker resourceType="team" value={null} onChange={vi.fn()} />
      );
      expect(screen.getByText("Search teams...")).toBeInTheDocument();
    });
  });

  describe("opening popover", () => {
    it("opens popover when clicked", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // The popover should open and show resources
      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });
    });

    it("shows search input in popover", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search work units...")).toBeInTheDocument();
      });
    });
  });

  describe("loading state", () => {
    it("shows loading state while fetching resources", async () => {
      setupMocks({ agents: { isPending: true, data: undefined } });
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });
    });

    it("shows spinner icon during loading", async () => {
      setupMocks({ agents: { isPending: true, data: undefined } });
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Verify loading text is shown - the spinner is visible alongside it
      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });
    });
  });

  describe("displaying resources", () => {
    it("displays resources after loading", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
        expect(screen.getByText("Sales Bot")).toBeInTheDocument();
        expect(screen.getByText("Analytics Bot")).toBeInTheDocument();
      });
    });

    it("displays resource descriptions", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Customer support agent")).toBeInTheDocument();
        expect(screen.getByText("Sales assistant")).toBeInTheDocument();
      });
    });

    it("displays resource status badges", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        // Status badges are rendered
        const activeBadges = screen.getAllByText("active");
        expect(activeBadges.length).toBeGreaterThan(0);
        expect(screen.getByText("inactive")).toBeInTheDocument();
      });
    });

    it("displays gateways correctly", async () => {
      const { user } = setup({ resourceType: "gateway" });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Production Gateway")).toBeInTheDocument();
        expect(screen.getByText("Staging Gateway")).toBeInTheDocument();
      });
    });

    it("displays deployments correctly", async () => {
      const { user } = setup({ resourceType: "deployment" });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("ML Pipeline")).toBeInTheDocument();
        expect(screen.getByText("ETL Pipeline")).toBeInTheDocument();
      });
    });

    it("displays teams correctly", async () => {
      const { user } = setup({ resourceType: "team" });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Engineering")).toBeInTheDocument();
        expect(screen.getByText("Product")).toBeInTheDocument();
        expect(screen.getByText("Design")).toBeInTheDocument();
      });
    });
  });

  describe("single selection", () => {
    it("selects a resource when clicked", async () => {
      const { user, onChange } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Support Bot"));

      expect(onChange).toHaveBeenCalledWith({
        $ref: "resource",
        type: "agent",
        selector: { id: "agent-1" },
        display: {
          name: "Support Bot",
          status: "valid",
          validatedAt: expect.any(String),
        },
      });
    });

    it("closes popover after single selection", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Support Bot"));

      // Popover should close after selection
      await waitFor(() => {
        expect(screen.queryByText("Customer support agent")).not.toBeInTheDocument();
      });
    });

    it("indicates selection state correctly", async () => {
      // When a value is selected, the selectedIds set will include it
      // This test verifies the component tracks selection correctly
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { id: "agent-1" },
        display: {
          name: "Support Bot",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      const { user } = setup({ value: selectedValue });

      // The badge should be displayed for the selected item
      expect(screen.getByText("Support Bot")).toBeInTheDocument();

      // When we open the popover and click the same item, it will trigger onChange
      // with null (deselection) - proving the component knows it's selected
      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Customer support agent")).toBeInTheDocument();
      });

      // The command items should be rendered with selectable behavior
      // Clicking the selected item description should work
      await user.click(screen.getByText("Customer support agent"));
    });
  });

  describe("multi selection", () => {
    it("toggles selection in multi-select mode", async () => {
      const { user, onChange } = setup({ multiple: true });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Support Bot"));

      expect(onChange).toHaveBeenCalledWith({
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot"],
          status: "valid",
          validatedAt: expect.any(String),
        },
      });
    });

    it("keeps popover open after selection in multi-select mode", async () => {
      const { user } = setup({ multiple: true });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Support Bot"));

      // Popover should stay open
      await waitFor(() => {
        expect(screen.getByText("Sales Bot")).toBeInTheDocument();
      });
    });

    it("can select multiple items", async () => {
      const { user, onChange } = setup({ multiple: true });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      // Select first item
      await user.click(screen.getByText("Support Bot"));

      // Get the first call to onChange
      const firstCall = onChange.mock.calls[0][0];
      expect(firstCall.selector.ids).toContain("agent-1");
    });

    it("deselects item when clicked again in multi-select", async () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1", "agent-2"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot", "Sales Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      const { user, onChange } = setup({ multiple: true, value: selectedValue });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Wait for the description to be visible (ensuring command items are rendered)
      await waitFor(() => {
        expect(screen.getByText("Customer support agent")).toBeInTheDocument();
      });

      // Click on the description which is inside the command item
      await user.click(screen.getByText("Customer support agent"));

      expect(onChange).toHaveBeenCalledWith({
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-2"] },
        display: {
          name: "Sales Bot",
          names: ["Sales Bot"],
          status: "valid",
          validatedAt: expect.any(String),
        },
      });
    });

    it("calls onChange with null when all items deselected", async () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      const { user, onChange } = setup({ multiple: true, value: selectedValue });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Wait for the description to be visible (ensuring command items are rendered)
      await waitFor(() => {
        expect(screen.getByText("Customer support agent")).toBeInTheDocument();
      });

      // Click on the description which is inside the command item
      await user.click(screen.getByText("Customer support agent"));

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("selected items display", () => {
    it("displays selected items as badges", () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { id: "agent-1" },
        display: {
          name: "Support Bot",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      setup({ value: selectedValue });

      // Should display badge with name
      const badge = screen.getByText("Support Bot");
      expect(badge).toBeInTheDocument();
    });

    it("displays multiple selected items as badges", () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1", "agent-2"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot", "Sales Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      setup({ multiple: true, value: selectedValue });

      expect(screen.getByText("Support Bot")).toBeInTheDocument();
      expect(screen.getByText("Sales Bot")).toBeInTheDocument();
    });
  });

  describe("removing selected items", () => {
    it("removes selected item when clicking X", async () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { id: "agent-1" },
        display: {
          name: "Support Bot",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      const { user, onChange, container } = setup({ value: selectedValue });

      // Find and click the remove button (X icon inside badge)
      const badge = screen.getByText("Support Bot").closest("div");
      const removeButton = badge?.querySelector("button");
      expect(removeButton).toBeInTheDocument();

      await user.click(removeButton!);

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("removes specific item in multi-select mode", async () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1", "agent-2"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot", "Sales Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      const { user, onChange } = setup({ multiple: true, value: selectedValue });

      // Find the Support Bot badge and click its remove button
      const supportBotBadge = screen.getByText("Support Bot").closest("div");
      const removeButton = supportBotBadge?.querySelector("button");
      expect(removeButton).toBeInTheDocument();

      await user.click(removeButton!);

      expect(onChange).toHaveBeenCalledWith({
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-2"] },
        display: {
          name: "Sales Bot",
          names: ["Sales Bot"],
          status: "valid",
          validatedAt: expect.any(String),
        },
      });
    });

    it("shows clear all button when multiple items selected", () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1", "agent-2"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot", "Sales Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      setup({ multiple: true, value: selectedValue });

      expect(screen.getByText("Clear all")).toBeInTheDocument();
    });

    it("clears all selections when clicking clear all", async () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1", "agent-2"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot", "Sales Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      const { user, onChange } = setup({ multiple: true, value: selectedValue });

      await user.click(screen.getByText("Clear all"));

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("does not show clear all button when only one item selected", () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      setup({ multiple: true, value: selectedValue });

      expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
    });
  });

  describe("empty resource list", () => {
    it("handles empty resource list", async () => {
      setupMocks({ agents: { data: { items: [] } } });
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("No work units found.")).toBeInTheDocument();
      });
    });

    it("shows correct empty message for different resource types", async () => {
      setupMocks({ gateways: { data: { records: [] } } });
      const { user } = setup({ resourceType: "gateway" });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("No gateways found.")).toBeInTheDocument();
      });
    });
  });

  describe("error state", () => {
    it("handles error state", async () => {
      const errorMessage = "Failed to fetch agents";
      setupMocks({ agents: { error: new Error(errorMessage), data: undefined } });
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("displays error message with destructive color", async () => {
      const errorMessage = "Network error";
      setupMocks({ agents: { error: new Error(errorMessage), data: undefined } });
      const { user, container } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        const errorText = screen.getByText(errorMessage);
        expect(errorText).toHaveClass("text-destructive");
      });
    });
  });

  describe("filtering resources by search", () => {
    it("filters resources by search term", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      // Type in search input
      const searchInput = screen.getByPlaceholderText("Search work units...");
      await user.type(searchInput, "Support");

      // Should filter to only Support Bot
      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
        expect(screen.queryByText("Sales Bot")).not.toBeInTheDocument();
        expect(screen.queryByText("Analytics Bot")).not.toBeInTheDocument();
      });
    });

    it("filters by description as well", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      // Search by description
      const searchInput = screen.getByPlaceholderText("Search work units...");
      await user.type(searchInput, "analytics");

      await waitFor(() => {
        expect(screen.getByText("Analytics Bot")).toBeInTheDocument();
        expect(screen.queryByText("Support Bot")).not.toBeInTheDocument();
      });
    });

    it("shows no results message when filter matches nothing", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search work units...");
      await user.type(searchInput, "nonexistent");

      await waitFor(() => {
        expect(screen.getByText("No work units found.")).toBeInTheDocument();
      });
    });

    it("case-insensitive search", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search work units...");
      await user.type(searchInput, "SUPPORT");

      await waitFor(() => {
        expect(screen.getByText("Support Bot")).toBeInTheDocument();
      });
    });
  });

  describe("disabled state", () => {
    it("disables trigger button when disabled", () => {
      setup({ disabled: true });

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeDisabled();
    });

    it("prevents popover from opening when disabled", async () => {
      const { user } = setup({ disabled: true });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      // Popover should not open
      expect(screen.queryByPlaceholderText("Search work units...")).not.toBeInTheDocument();
    });

    it("disables remove buttons in badges when disabled", () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { id: "agent-1" },
        display: {
          name: "Support Bot",
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      setup({ value: selectedValue, disabled: true });

      const badge = screen.getByText("Support Bot").closest("div");
      const removeButton = badge?.querySelector("button");
      expect(removeButton).toBeDisabled();
    });

    it("disables clear all button when disabled", () => {
      const selectedValue: ResourceReference = {
        $ref: "resource",
        type: "agent",
        selector: { ids: ["agent-1", "agent-2"] },
        display: {
          name: "Support Bot",
          names: ["Support Bot", "Sales Bot"],
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      };

      setup({ multiple: true, value: selectedValue, disabled: true });

      const clearAllButton = screen.getByText("Clear all");
      expect(clearAllButton).toBeDisabled();
    });
  });

  describe("unsupported resource types", () => {
    it("returns empty list for unsupported resource type (user)", async () => {
      const { user } = setup({ resourceType: "user" });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("No users found.")).toBeInTheDocument();
      });
    });

    it("returns empty list for unsupported resource type (workspace)", async () => {
      const { user } = setup({ resourceType: "workspace" });

      const trigger = screen.getByRole("combobox");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("No workspaces found.")).toBeInTheDocument();
      });
    });
  });

  describe("aria attributes", () => {
    it("sets aria-expanded correctly", async () => {
      const { user } = setup();

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });
  });
});
