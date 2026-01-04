/**
 * Tests for ReferenceWarnings component
 *
 * These tests verify the component's behavior for displaying warnings about
 * orphaned or changed resource references in policy conditions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReferenceWarnings } from "../ReferenceWarnings";
import type { ResourceReferenceStatus } from "../../../types";

// Helper to create mock references with specified status
function createMockReference(
  overrides: Partial<ResourceReferenceStatus> = {}
): ResourceReferenceStatus {
  return {
    type: "agent",
    id: "agent-123",
    name: "Test Agent",
    status: "valid",
    validated_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

// Helper to render with user event setup
function setup(props: Partial<Parameters<typeof ReferenceWarnings>[0]> = {}) {
  const user = userEvent.setup();
  const defaultProps = {
    references: [],
    onDismiss: undefined,
    onRefresh: undefined,
    className: undefined,
  };
  const mergedProps = { ...defaultProps, ...props };
  const result = render(<ReferenceWarnings {...mergedProps} />);
  return { user, ...result, ...mergedProps };
}

describe("ReferenceWarnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ Rendering with no issues ============

  describe("when all references are valid", () => {
    it("renders nothing when all references are valid", () => {
      const { container } = setup({
        references: [
          createMockReference({ status: "valid" }),
          createMockReference({ id: "agent-456", status: "valid" }),
        ],
      });

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when references array is empty", () => {
      const { container } = setup({ references: [] });

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing with only valid status references", () => {
      const { container } = setup({
        references: [
          createMockReference({ type: "pipeline", id: "p1", status: "valid" }),
          createMockReference({ type: "team", id: "t1", status: "valid" }),
          createMockReference({ type: "deployment", id: "d1", status: "valid" }),
        ],
      });

      expect(container.firstChild).toBeNull();
    });
  });

  // ============ Rendering orphaned references ============

  describe("when references are orphaned", () => {
    it("renders alert for single orphaned reference", () => {
      setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Resource Reference Issues")).toBeInTheDocument();
      expect(screen.getByText(/1 deleted resource/)).toBeInTheDocument();
    });

    it("renders pluralized message for multiple orphaned references", () => {
      setup({
        references: [
          createMockReference({ id: "agent-1", status: "orphaned" }),
          createMockReference({ id: "agent-2", status: "orphaned" }),
          createMockReference({ id: "agent-3", status: "orphaned" }),
        ],
      });

      expect(screen.getByText(/3 deleted resources/)).toBeInTheDocument();
    });

    it("displays resource type label correctly", () => {
      setup({
        references: [
          createMockReference({ type: "agent", status: "orphaned" }),
        ],
      });

      expect(screen.getByText("Work Unit:")).toBeInTheDocument();
    });

    it("displays resource name when available", () => {
      setup({
        references: [
          createMockReference({
            name: "My Custom Agent",
            status: "orphaned",
          }),
        ],
      });

      expect(screen.getByText("My Custom Agent")).toBeInTheDocument();
    });

    it("displays resource ID when name is not available", () => {
      setup({
        references: [
          createMockReference({
            id: "agent-xyz-123",
            name: undefined,
            status: "orphaned",
          }),
        ],
      });

      expect(screen.getByText("agent-xyz-123")).toBeInTheDocument();
    });

    it("shows (Deleted) status label for orphaned", () => {
      setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      expect(screen.getByText("(Deleted)")).toBeInTheDocument();
    });

    it("shows advice to update or remove conditions for orphaned resources", () => {
      setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      expect(
        screen.getByText(/Consider updating or removing conditions/)
      ).toBeInTheDocument();
    });

    it("renders alert when orphaned resources exist", () => {
      const { container } = setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      // Alert should be rendered
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      // Verify the alert exists with content about orphaned resources
      expect(screen.getByText(/1 deleted resource/)).toBeInTheDocument();
    });
  });

  // ============ Rendering changed references ============

  describe("when references are changed", () => {
    it("renders alert for single changed reference", () => {
      setup({
        references: [createMockReference({ status: "changed" })],
      });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/1 modified resource/)).toBeInTheDocument();
    });

    it("renders pluralized message for multiple changed references", () => {
      setup({
        references: [
          createMockReference({ id: "agent-1", status: "changed" }),
          createMockReference({ id: "agent-2", status: "changed" }),
        ],
      });

      expect(screen.getByText(/2 modified resources/)).toBeInTheDocument();
    });

    it("shows (Modified) status label for changed", () => {
      setup({
        references: [createMockReference({ status: "changed" })],
      });

      expect(screen.getByText("(Modified)")).toBeInTheDocument();
    });

    it("renders alert when only changed resources exist (no orphaned)", () => {
      const { container } = setup({
        references: [createMockReference({ status: "changed" })],
      });

      // Alert should be rendered
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      // Verify it shows modified resource content
      expect(screen.getByText(/1 modified resource/)).toBeInTheDocument();
    });

    it("does not show advice text for changed-only references", () => {
      setup({
        references: [createMockReference({ status: "changed" })],
      });

      expect(
        screen.queryByText(/Consider updating or removing conditions/)
      ).not.toBeInTheDocument();
    });
  });

  // ============ Rendering mixed references ============

  describe("when references have mixed statuses", () => {
    it("shows both orphaned and changed counts in summary", () => {
      setup({
        references: [
          createMockReference({ id: "a1", status: "orphaned" }),
          createMockReference({ id: "a2", status: "orphaned" }),
          createMockReference({ id: "a3", status: "changed" }),
        ],
      });

      expect(screen.getByText(/2 deleted resources/)).toBeInTheDocument();
      expect(screen.getByText(/1 modified resource/)).toBeInTheDocument();
    });

    it("filters out valid references from display", () => {
      setup({
        references: [
          createMockReference({ id: "a1", name: "Valid Agent", status: "valid" }),
          createMockReference({ id: "a2", name: "Orphaned Agent", status: "orphaned" }),
        ],
      });

      expect(screen.queryByText("Valid Agent")).not.toBeInTheDocument();
      expect(screen.getByText("Orphaned Agent")).toBeInTheDocument();
    });

    it("renders alert when both orphaned and changed exist", () => {
      const { container } = setup({
        references: [
          createMockReference({ status: "orphaned" }),
          createMockReference({ id: "a2", status: "changed" }),
        ],
      });

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      // Verify both types are mentioned
      expect(screen.getByText(/1 deleted resource/)).toBeInTheDocument();
      expect(screen.getByText(/1 modified resource/)).toBeInTheDocument();
    });

    it("lists all problem references", () => {
      setup({
        references: [
          createMockReference({ id: "a1", name: "Agent One", status: "orphaned" }),
          createMockReference({ id: "p1", name: "Pipeline One", type: "pipeline", status: "changed" }),
          createMockReference({ id: "t1", name: "Team Valid", type: "team", status: "valid" }),
        ],
      });

      expect(screen.getByText("Agent One")).toBeInTheDocument();
      expect(screen.getByText("Pipeline One")).toBeInTheDocument();
      expect(screen.queryByText("Team Valid")).not.toBeInTheDocument();
    });
  });

  // ============ Resource type labels ============

  describe("resource type labels", () => {
    it("displays correct label for agent type", () => {
      setup({
        references: [createMockReference({ type: "agent", status: "orphaned" })],
      });

      expect(screen.getByText("Work Unit:")).toBeInTheDocument();
    });

    it("displays correct label for pipeline type", () => {
      setup({
        references: [createMockReference({ type: "pipeline", status: "orphaned" })],
      });

      expect(screen.getByText("Process:")).toBeInTheDocument();
    });

    it("displays correct label for deployment type", () => {
      setup({
        references: [createMockReference({ type: "deployment", status: "orphaned" })],
      });

      expect(screen.getByText("Deployment:")).toBeInTheDocument();
    });

    it("displays correct label for gateway type", () => {
      setup({
        references: [createMockReference({ type: "gateway", status: "orphaned" })],
      });

      expect(screen.getByText("Gateway:")).toBeInTheDocument();
    });

    it("displays correct label for team type", () => {
      setup({
        references: [createMockReference({ type: "team", status: "orphaned" })],
      });

      expect(screen.getByText("Team:")).toBeInTheDocument();
    });

    it("displays correct label for user type", () => {
      setup({
        references: [createMockReference({ type: "user", status: "orphaned" })],
      });

      expect(screen.getByText("User:")).toBeInTheDocument();
    });

    it("displays correct label for role type", () => {
      setup({
        references: [createMockReference({ type: "role", status: "orphaned" })],
      });

      expect(screen.getByText("Role:")).toBeInTheDocument();
    });

    it("displays raw type for unknown resource types", () => {
      setup({
        references: [createMockReference({ type: "custom_resource", status: "orphaned" })],
      });

      expect(screen.getByText("custom_resource:")).toBeInTheDocument();
    });
  });

  // ============ Dismiss button ============

  describe("dismiss button", () => {
    it("renders dismiss button when onDismiss is provided", () => {
      const onDismiss = vi.fn();
      setup({
        references: [createMockReference({ status: "orphaned" })],
        onDismiss,
      });

      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });

    it("does not render dismiss button when onDismiss is undefined", () => {
      setup({
        references: [createMockReference({ status: "orphaned" })],
        onDismiss: undefined,
      });

      expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it("calls onDismiss when dismiss button is clicked", async () => {
      const onDismiss = vi.fn();
      const { user } = setup({
        references: [createMockReference({ status: "orphaned" })],
        onDismiss,
      });

      await user.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // ============ Refresh button ============

  describe("refresh button", () => {
    it("renders refresh button when onRefresh is provided", () => {
      const onRefresh = vi.fn();
      setup({
        references: [createMockReference({ status: "orphaned" })],
        onRefresh,
      });

      expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    });

    it("does not render refresh button when onRefresh is undefined", () => {
      setup({
        references: [createMockReference({ status: "orphaned" })],
        onRefresh: undefined,
      });

      expect(screen.queryByRole("button", { name: /refresh/i })).not.toBeInTheDocument();
    });

    it("calls onRefresh when refresh button is clicked", async () => {
      const onRefresh = vi.fn();
      const { user } = setup({
        references: [createMockReference({ status: "orphaned" })],
        onRefresh,
      });

      await user.click(screen.getByRole("button", { name: /refresh/i }));

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("renders both refresh and dismiss buttons when both handlers provided", () => {
      const onDismiss = vi.fn();
      const onRefresh = vi.fn();
      setup({
        references: [createMockReference({ status: "orphaned" })],
        onDismiss,
        onRefresh,
      });

      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    });
  });

  // ============ Icons ============

  describe("icons", () => {
    it("renders Link2Off icon for orphaned status", () => {
      const { container } = setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      // Check for the Link2Off icon (has specific class or structure)
      const listItem = screen.getByText("(Deleted)").closest("li");
      expect(listItem).toBeInTheDocument();
      const icon = listItem?.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-destructive");
    });

    it("renders RefreshCw icon for changed status", () => {
      const { container } = setup({
        references: [createMockReference({ status: "changed" })],
      });

      const listItem = screen.getByText("(Modified)").closest("li");
      expect(listItem).toBeInTheDocument();
      const icon = listItem?.querySelector("svg");
      expect(icon).toBeInTheDocument();
      // Changed status uses yellow color class
      expect(icon?.classList.toString()).toContain("text-yellow");
    });

    it("renders AlertTriangle icon in alert title", () => {
      const { container } = setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      // Alert component should have warning triangle icon
      const alert = container.querySelector('[role="alert"]');
      const titleSection = screen.getByText("Resource Reference Issues").closest("div");
      expect(titleSection?.parentElement?.querySelector("svg")).toBeInTheDocument();
    });
  });

  // ============ Styling and className ============

  describe("styling", () => {
    it("applies custom className when provided", () => {
      const { container } = setup({
        references: [createMockReference({ status: "orphaned" })],
        className: "custom-class mt-4",
      });

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass("custom-class");
      expect(alert).toHaveClass("mt-4");
    });

    it("renders resource name in monospace font", () => {
      setup({
        references: [createMockReference({ name: "Test Name", status: "orphaned" })],
      });

      const nameElement = screen.getByText("Test Name");
      expect(nameElement).toHaveClass("font-mono");
    });

    it("renders resource type in font-medium style", () => {
      setup({
        references: [createMockReference({ type: "agent", status: "orphaned" })],
      });

      const typeElement = screen.getByText("Work Unit:");
      expect(typeElement).toHaveClass("font-medium");
    });
  });

  // ============ Alert content structure ============

  describe("alert content structure", () => {
    it("displays title 'Resource Reference Issues'", () => {
      setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      expect(screen.getByText("Resource Reference Issues")).toBeInTheDocument();
    });

    it("displays summary message about policy not working as expected", () => {
      setup({
        references: [createMockReference({ status: "orphaned" })],
      });

      expect(
        screen.getByText(/The policy may not work as expected/)
      ).toBeInTheDocument();
    });

    it("renders references as list items", () => {
      setup({
        references: [
          createMockReference({ id: "a1", name: "Agent 1", status: "orphaned" }),
          createMockReference({ id: "a2", name: "Agent 2", status: "orphaned" }),
        ],
      });

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();

      const listItems = within(list).getAllByRole("listitem");
      expect(listItems).toHaveLength(2);
    });

    it("uses unique key for each list item", () => {
      const { container } = setup({
        references: [
          createMockReference({ type: "agent", id: "a1", status: "orphaned" }),
          createMockReference({ type: "pipeline", id: "p1", status: "changed" }),
        ],
      });

      const listItems = container.querySelectorAll("li");
      expect(listItems).toHaveLength(2);
      // React should not warn about duplicate keys
    });
  });

  // ============ Edge cases ============

  describe("edge cases", () => {
    it("handles reference with empty name string", () => {
      setup({
        references: [createMockReference({ id: "agent-id", name: "", status: "orphaned" })],
      });

      // Should fall back to showing the ID
      expect(screen.getByText("agent-id")).toBeInTheDocument();
    });

    it("handles large number of problem references", () => {
      const manyReferences = Array.from({ length: 50 }, (_, i) =>
        createMockReference({ id: `agent-${i}`, name: `Agent ${i}`, status: "orphaned" })
      );

      setup({ references: manyReferences });

      expect(screen.getByText(/50 deleted resources/)).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(50);
    });

    it("correctly handles references array with single valid reference among problems", () => {
      setup({
        references: [
          createMockReference({ id: "v1", name: "Valid", status: "valid" }),
          createMockReference({ id: "o1", name: "Orphaned", status: "orphaned" }),
        ],
      });

      expect(screen.queryByText("Valid")).not.toBeInTheDocument();
      expect(screen.getByText("Orphaned")).toBeInTheDocument();
      expect(screen.getByText(/1 deleted resource\b/)).toBeInTheDocument();
    });

    it("handles special characters in resource names", () => {
      setup({
        references: [
          createMockReference({
            name: "Agent <script>alert('xss')</script>",
            status: "orphaned",
          }),
        ],
      });

      // Should render text content safely (React escapes by default)
      expect(
        screen.getByText("Agent <script>alert('xss')</script>")
      ).toBeInTheDocument();
    });

    it("handles very long resource names gracefully", () => {
      const longName = "A".repeat(200);
      setup({
        references: [createMockReference({ name: longName, status: "orphaned" })],
      });

      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });
});
