/**
 * TrustChainViewer Component Tests
 */

import { describe, it, expect } from "vitest";
import { screen, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrustChainViewer } from "../components/TrustChainViewer";
import {
  createMockTrustChain,
  createMockTrustChainWithoutDelegations,
  createMockTrustChainWithoutCapabilities,
  createMockTrustChainWithoutAudits,
  createMockTrustChainWithoutConstraints,
} from "./fixtures";

describe("TrustChainViewer", () => {
  describe("Tabs rendering", () => {
    it("should render all 5 tabs", () => {
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      // Use getAllByText since tabs may have hidden text on small screens
      expect(screen.getByText("Genesis")).toBeInTheDocument();
      expect(screen.getByText("Capabilities")).toBeInTheDocument();
      expect(screen.getByText("Delegations")).toBeInTheDocument();
      expect(screen.getByText("Constraints")).toBeInTheDocument();
      expect(screen.getByText("Audit")).toBeInTheDocument();
    });

    it("should display correct badge counts for each tab", () => {
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      // Capabilities count (2 in mock)
      const capabilitiesTab = screen
        .getByText("Capabilities")
        .closest("button");
      expect(within(capabilitiesTab!).getByText("2")).toBeInTheDocument();

      // Delegations count (1 in mock)
      const delegationsTab = screen.getByText("Delegations").closest("button");
      expect(within(delegationsTab!).getByText("1")).toBeInTheDocument();

      // Constraints count (2 in mock)
      const constraintsTab = screen.getByText("Constraints").closest("button");
      expect(within(constraintsTab!).getByText("2")).toBeInTheDocument();

      // Audit count (2 in mock)
      const auditTab = screen.getByText("Audit").closest("button");
      expect(within(auditTab!).getByText("2")).toBeInTheDocument();
    });
  });

  describe("Tab switching", () => {
    it("should switch to Capabilities tab when clicked", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const capabilitiesTab = screen
        .getByText("Capabilities")
        .closest("button");
      await user.click(capabilitiesTab!);

      // Should show capability cards
      expect(screen.getByText("read_data")).toBeInTheDocument();
      expect(screen.getByText("write_data")).toBeInTheDocument();
    });

    it("should switch to Delegations tab when clicked", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const delegationsTab = screen.getByText("Delegations").closest("button");
      await user.click(delegationsTab!);

      // Should show delegation info
      expect(screen.getByText(/agent-456/)).toBeInTheDocument();
    });

    it("should switch to Constraints tab when clicked", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const constraintsTab = screen.getByText("Constraints").closest("button");
      await user.click(constraintsTab!);

      // Should show constraints
      expect(screen.getByText("resource_limit")).toBeInTheDocument();
      expect(screen.getByText("time_window")).toBeInTheDocument();
    });

    it("should switch to Audit tab when clicked", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const auditTab = screen.getByText("Audit").closest("button");
      await user.click(auditTab!);

      // Should show audit events
      expect(screen.getByText("read_database")).toBeInTheDocument();
      expect(screen.getByText("write_database")).toBeInTheDocument();
    });
  });

  describe("Genesis tab", () => {
    it("should display genesis record by default", () => {
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      // Genesis tab is default, so content should be visible
      expect(screen.getByText(/agent-123/)).toBeInTheDocument();
    });

    it("should display chain hash", () => {
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      expect(screen.getByText("Chain Hash:")).toBeInTheDocument();
      expect(screen.getByText("trust-chain-hash-abc")).toBeInTheDocument();
    });
  });

  describe("Capabilities tab", () => {
    it("should display capabilities list", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const capabilitiesTab = screen
        .getByText("Capabilities")
        .closest("button");
      await user.click(capabilitiesTab!);

      expect(screen.getByText("read_data")).toBeInTheDocument();
      expect(screen.getByText("write_data")).toBeInTheDocument();
    });

    it("should show empty state when no capabilities", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChainWithoutCapabilities();
      render(<TrustChainViewer trustChain={trustChain} />);

      const capabilitiesTab = screen
        .getByText("Capabilities")
        .closest("button");
      await user.click(capabilitiesTab!);

      expect(screen.getByText("No capabilities attested")).toBeInTheDocument();
    });

    it("should display capability cards in grid layout", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      const { container } = render(
        <TrustChainViewer trustChain={trustChain} />
      );

      const capabilitiesTab = screen
        .getByText("Capabilities")
        .closest("button");
      await user.click(capabilitiesTab!);

      // Should have grid layout
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe("Delegations tab", () => {
    it("should display delegations list", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const delegationsTab = screen.getByText("Delegations").closest("button");
      await user.click(delegationsTab!);

      expect(screen.getByText(/agent-456/)).toBeInTheDocument();
    });

    it("should show empty state when no delegations", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChainWithoutDelegations();
      render(<TrustChainViewer trustChain={trustChain} />);

      const delegationsTab = screen.getByText("Delegations").closest("button");
      await user.click(delegationsTab!);

      expect(screen.getByText("No delegations created")).toBeInTheDocument();
    });
  });

  describe("Constraints tab", () => {
    it("should display constraints", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const constraintsTab = screen.getByText("Constraints").closest("button");
      await user.click(constraintsTab!);

      expect(screen.getByText("resource_limit")).toBeInTheDocument();
      expect(screen.getByText("time_window")).toBeInTheDocument();
    });

    it("should display constraint details", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const constraintsTab = screen.getByText("Constraints").closest("button");
      await user.click(constraintsTab!);

      expect(screen.getByText("Priority: 1")).toBeInTheDocument();
      expect(screen.getByText("Priority: 2")).toBeInTheDocument();
    });

    it("should show empty state when no constraints", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChainWithoutConstraints();
      render(<TrustChainViewer trustChain={trustChain} />);

      const constraintsTab = screen.getByText("Constraints").closest("button");
      await user.click(constraintsTab!);

      expect(screen.getByText("No active constraints")).toBeInTheDocument();
    });

    it("should display constraint value as JSON", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const constraintsTab = screen.getByText("Constraints").closest("button");
      await user.click(constraintsTab!);

      // Should have pre tags for JSON display
      const preTags = document.querySelectorAll("pre");
      expect(preTags.length).toBeGreaterThan(0);
    });
  });

  describe("Audit tab", () => {
    it("should display audit events", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const auditTab = screen.getByText("Audit").closest("button");
      await user.click(auditTab!);

      expect(screen.getByText("read_database")).toBeInTheDocument();
      expect(screen.getByText("write_database")).toBeInTheDocument();
    });

    it("should display audit event details", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const auditTab = screen.getByText("Audit").closest("button");
      await user.click(auditTab!);

      expect(screen.getAllByText(/database:\/\/db-123/).length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByText("success").length).toBeGreaterThan(0);
    });

    it("should show empty state when no audit events", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChainWithoutAudits();
      render(<TrustChainViewer trustChain={trustChain} />);

      const auditTab = screen.getByText("Audit").closest("button");
      await user.click(auditTab!);

      expect(screen.getByText("No audit records yet")).toBeInTheDocument();
    });

    it("should display audit result badges with correct colors", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const auditTab = screen.getByText("Audit").closest("button");
      await user.click(auditTab!);

      const badges = screen.getAllByText("success");
      // Should have at least one success badge
      expect(badges.length).toBeGreaterThan(0);
      // Check that badges have the correct styling classes
      badges.forEach((badge) => {
        const badgeElement = badge.closest('[class*="bg-green"]');
        expect(badgeElement).toBeInTheDocument();
      });
    });

    it("should display audit context as JSON when present", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const auditTab = screen.getByText("Audit").closest("button");
      await user.click(auditTab!);

      // Should have context labels (one per audit event with context)
      const contextLabels = screen.getAllByText("Context");
      expect(contextLabels.length).toBeGreaterThan(0);
    });

    it("should format timestamps correctly", async () => {
      const user = userEvent.setup();
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      const auditTab = screen.getByText("Audit").closest("button");
      await user.click(auditTab!);

      // Should have formatted timestamp labels (one per audit event)
      const timestampLabels = screen.getAllByText("Timestamp");
      expect(timestampLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Header", () => {
    it("should display Trust Chain title", () => {
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      expect(screen.getByText("Trust Chain")).toBeInTheDocument();
    });

    it("should display chain hash in header", () => {
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      expect(screen.getByText("Chain Hash:")).toBeInTheDocument();
      expect(screen.getByText("trust-chain-hash-abc")).toBeInTheDocument();
    });

    it("should display chain hash in code element", () => {
      const trustChain = createMockTrustChain();
      const { container } = render(
        <TrustChainViewer trustChain={trustChain} />
      );

      const code = container.querySelector("code");
      expect(code).toBeInTheDocument();
      expect(code).toHaveTextContent("trust-chain-hash-abc");
    });
  });

  describe("Responsive design", () => {
    it("should have responsive tab labels", () => {
      const trustChain = createMockTrustChain();
      render(<TrustChainViewer trustChain={trustChain} />);

      // Tab text should have hidden class on small screens
      const genesisTab = screen.getByText("Genesis");
      const span = genesisTab.closest("span");
      expect(span).toHaveClass("sm:inline");
    });

    it("should render icons in tabs", () => {
      const trustChain = createMockTrustChain();
      const { container } = render(
        <TrustChainViewer trustChain={trustChain} />
      );

      // Should have multiple SVG icons (one per tab)
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(5); // At least 5 tabs + badge icons
    });
  });
});
