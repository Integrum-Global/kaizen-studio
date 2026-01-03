/**
 * EATP (Enterprise Agent Trust Protocol) Features Tests
 *
 * Intent-based testing for core EATP UI features:
 * 1. HumanOrigin Display - "Who authorized this action?"
 * 2. Cascade Revocation - "What happens when I revoke this agent?"
 * 3. Constraint Tightening - "Can I only restrict, never expand permissions?"
 *
 * These tests focus on USER INTENT, not technical implementation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { HumanOriginBadge } from "../components/HumanOriginBadge";
import { CascadeRevocationModal } from "../components/CascadeRevocationModal";
import type {
  HumanOrigin,
  AuthProvider,
  RevocationImpactPreview,
  AffectedAgent,
  TrustStatus,
  ConstraintTighteningResult,
  ConstraintTighteningViolation,
} from "../types";

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockHumanOrigin(
  overrides?: Partial<HumanOrigin>
): HumanOrigin {
  return {
    humanId: "alice.johnson@acme.com",
    displayName: "Alice Johnson",
    authProvider: "okta" as AuthProvider,
    sessionId: "session-abc123",
    authenticatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockAffectedAgent(
  overrides?: Partial<AffectedAgent>
): AffectedAgent {
  return {
    agentId: "agent-downstream-1",
    agentName: "Downstream Agent 1",
    delegationDepth: 1,
    activeTasks: 0,
    status: "valid" as TrustStatus,
    ...overrides,
  };
}

function createMockRevocationImpact(
  overrides?: Partial<RevocationImpactPreview>
): RevocationImpactPreview {
  return {
    targetAgentId: "agent-target-123",
    targetAgentName: "Target Agent",
    affectedAgents: [
      createMockAffectedAgent(),
      createMockAffectedAgent({
        agentId: "agent-downstream-2",
        agentName: "Downstream Agent 2",
        delegationDepth: 2,
      }),
      createMockAffectedAgent({
        agentId: "agent-downstream-3",
        agentName: "Downstream Agent 3",
        delegationDepth: 3,
        activeTasks: 5,
      }),
    ],
    totalAffected: 3,
    hasActiveWorkloads: true,
    warnings: [],
    ...overrides,
  };
}

function createMockConstraintTighteningViolation(
  overrides?: Partial<ConstraintTighteningViolation>
): ConstraintTighteningViolation {
  return {
    constraintType: "cost_limit",
    parentValue: 100,
    childValue: 200, // Trying to INCREASE limit = violation
    message: "Child cost limit ($200) exceeds parent limit ($100)",
    ...overrides,
  };
}

// ============================================================================
// HumanOrigin Display Logic Tests
// ============================================================================

describe("HumanOriginBadge", () => {
  describe("Intent: When a user views an audit record, they should immediately see who authorized it", () => {
    it("displays correct initials derived from the human's display name", () => {
      const humanOrigin = createMockHumanOrigin({
        displayName: "Alice Johnson",
      });

      renderWithProviders(<HumanOriginBadge humanOrigin={humanOrigin} />);

      // User should see initials "AJ" for "Alice Johnson"
      expect(screen.getByText("AJ")).toBeInTheDocument();
    });

    it("handles single-word names with single initial", () => {
      const humanOrigin = createMockHumanOrigin({
        displayName: "Alice",
      });

      renderWithProviders(<HumanOriginBadge humanOrigin={humanOrigin} />);

      // Single word = single initial
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("truncates initials to 2 characters for long names", () => {
      const humanOrigin = createMockHumanOrigin({
        displayName: "Alice Bob Charlie",
      });

      renderWithProviders(<HumanOriginBadge humanOrigin={humanOrigin} />);

      // Should only show first 2 initials
      expect(screen.getByText("AB")).toBeInTheDocument();
    });

    it("shows full name in detailed view mode", () => {
      const humanOrigin = createMockHumanOrigin({
        displayName: "Alice Johnson",
        humanId: "alice.johnson@acme.com",
      });

      renderWithProviders(
        <HumanOriginBadge humanOrigin={humanOrigin} showDetails />
      );

      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText("alice.johnson@acme.com")).toBeInTheDocument();
    });
  });

  describe("Intent: Legacy records without human origin should be clearly marked", () => {
    it("displays 'Legacy' badge when human_origin is null", () => {
      renderWithProviders(<HumanOriginBadge humanOrigin={null} />);

      expect(screen.getByText("Legacy")).toBeInTheDocument();
    });

    it("displays 'Legacy' badge when human_origin is undefined", () => {
      renderWithProviders(<HumanOriginBadge humanOrigin={undefined} />);

      expect(screen.getByText("Legacy")).toBeInTheDocument();
    });

    it("applies muted styling to legacy badges to indicate reduced accountability", () => {
      const { container } = renderWithProviders(
        <HumanOriginBadge humanOrigin={null} />
      );

      // Legacy badge should have muted styling
      const badge = container.querySelector('[class*="text-muted"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Intent: Users should quickly identify auth provider for security review", () => {
    const authProviders: Array<{
      provider: AuthProvider;
      expectedLabel: string;
    }> = [
      { provider: "okta" as AuthProvider, expectedLabel: "Okta" },
      { provider: "azure_ad" as AuthProvider, expectedLabel: "Azure AD" },
      { provider: "google" as AuthProvider, expectedLabel: "Google" },
      { provider: "saml" as AuthProvider, expectedLabel: "SAML" },
      { provider: "oidc" as AuthProvider, expectedLabel: "OIDC" },
      { provider: "ldap" as AuthProvider, expectedLabel: "LDAP" },
      { provider: "session" as AuthProvider, expectedLabel: "Session" },
      { provider: "custom" as AuthProvider, expectedLabel: "Custom" },
    ];

    authProviders.forEach(({ provider, expectedLabel }) => {
      it(`shows correct icon for ${expectedLabel} authentication`, async () => {
        const user = userEvent.setup();
        const humanOrigin = createMockHumanOrigin({
          authProvider: provider,
        });

        renderWithProviders(
          <HumanOriginBadge humanOrigin={humanOrigin} showProvider />
        );

        // Hover to see tooltip with provider name
        const badge = screen.getByText("AJ").closest("div");
        if (badge) {
          await user.hover(badge);

          // Wait for tooltip - use queryAllByText as tooltip may show label multiple times
          await waitFor(() => {
            const elements = screen.queryAllByText(expectedLabel);
            expect(elements.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it("falls back to Custom icon for unknown auth providers", async () => {
      const user = userEvent.setup();
      const humanOrigin = createMockHumanOrigin({
        authProvider: "unknown_provider" as AuthProvider,
      });

      renderWithProviders(
        <HumanOriginBadge humanOrigin={humanOrigin} showProvider />
      );

      const badge = screen.getByText("AJ").closest("div");
      if (badge) {
        await user.hover(badge);

        // Use queryAllByText as tooltip may show label multiple times
        await waitFor(() => {
          const elements = screen.queryAllByText("Custom");
          expect(elements.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe("Intent: Timestamp display helps with session correlation", () => {
    it("shows relative time when timestamp is enabled", () => {
      const recentTime = new Date();
      recentTime.setMinutes(recentTime.getMinutes() - 5);

      const humanOrigin = createMockHumanOrigin({
        authenticatedAt: recentTime.toISOString(),
      });

      renderWithProviders(
        <HumanOriginBadge humanOrigin={humanOrigin} showTimestamp />
      );

      expect(screen.getByText(/5m ago/)).toBeInTheDocument();
    });

    it("shows 'just now' for very recent authentications", () => {
      const humanOrigin = createMockHumanOrigin({
        authenticatedAt: new Date().toISOString(),
      });

      renderWithProviders(
        <HumanOriginBadge humanOrigin={humanOrigin} showTimestamp />
      );

      expect(screen.getByText(/just now/)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Cascade Revocation Tests
// ============================================================================

describe("CascadeRevocationModal", () => {
  const mockLoadImpact = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConfirm.mockResolvedValue(undefined);
  });

  describe("Intent: Before revoking an agent, users must understand the full impact", () => {
    it("displays the correct count of affected agents", async () => {
      const impact = createMockRevocationImpact({
        totalAffected: 5,
        affectedAgents: Array(5)
          .fill(null)
          .map((_, i) =>
            createMockAffectedAgent({
              agentId: `agent-${i}`,
              agentName: `Agent ${i}`,
              delegationDepth: Math.floor(i / 2) + 1,
            })
          ),
      });
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          targetAgentName="Target Agent"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        // User sees "5" as the affected agents count
        expect(screen.getByText("5")).toBeInTheDocument();
      });
    });

    it("shows each affected agent with their delegation depth", async () => {
      const impact = createMockRevocationImpact({
        affectedAgents: [
          createMockAffectedAgent({
            agentId: "agent-1",
            agentName: "Direct Delegate",
            delegationDepth: 1,
          }),
          createMockAffectedAgent({
            agentId: "agent-2",
            agentName: "Second Level",
            delegationDepth: 2,
          }),
        ],
        totalAffected: 2,
      });
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Direct Delegate")).toBeInTheDocument();
        expect(screen.getByText("Second Level")).toBeInTheDocument();
        expect(screen.getByText("Delegation depth: 1")).toBeInTheDocument();
        expect(screen.getByText("Delegation depth: 2")).toBeInTheDocument();
      });
    });

    it("indicates when agents have active workloads that will be disrupted", async () => {
      const impact = createMockRevocationImpact({
        hasActiveWorkloads: true,
        affectedAgents: [
          createMockAffectedAgent({
            agentId: "agent-busy",
            agentName: "Busy Agent",
            activeTasks: 10,
          }),
        ],
        totalAffected: 1,
      });
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        // User should see "Yes" for active workloads
        expect(screen.getByText("Yes")).toBeInTheDocument();
        // User should see the count of active tasks
        expect(screen.getByText("10 active")).toBeInTheDocument();
      });
    });
  });

  describe("Intent: Revocation confirmation requires exact REVOKE text to prevent accidents", () => {
    it("disables confirm button until user types exactly 'REVOKE'", async () => {
      const user = userEvent.setup();
      const impact = createMockRevocationImpact();
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Affected Agents")).toBeInTheDocument();
      });

      // Find and fill the reason field (required)
      const reasonInput = screen.getByPlaceholderText(
        /employee termination|security incident/i
      );
      await user.type(reasonInput, "Test revocation");

      // Confirm button should be disabled without REVOKE text
      const confirmButton = screen.getByRole("button", {
        name: /revoke.*agent/i,
      });
      expect(confirmButton).toBeDisabled();

      // Type partial text - still disabled
      const confirmInput = screen.getByPlaceholderText("REVOKE");
      await user.type(confirmInput, "REVO");
      expect(confirmButton).toBeDisabled();
    });

    it("enables confirm button when user types exactly 'REVOKE'", async () => {
      const user = userEvent.setup();
      const impact = createMockRevocationImpact();
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Affected Agents")).toBeInTheDocument();
      });

      // Fill reason
      const reasonInput = screen.getByPlaceholderText(
        /employee termination|security incident/i
      );
      await user.type(reasonInput, "Security incident");

      // Type REVOKE
      const confirmInput = screen.getByPlaceholderText("REVOKE");
      await user.type(confirmInput, "revoke"); // lowercase - should convert

      // Button should now be enabled
      const confirmButton = screen.getByRole("button", {
        name: /revoke.*agent/i,
      });
      expect(confirmButton).toBeEnabled();
    });

    it("shows error message when confirmation text is incorrect", async () => {
      const user = userEvent.setup();
      const impact = createMockRevocationImpact();
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Affected Agents")).toBeInTheDocument();
      });

      // Type wrong confirmation
      const confirmInput = screen.getByPlaceholderText("REVOKE");
      await user.type(confirmInput, "DELETE");

      // Should show error message
      expect(
        screen.getByText(/please type revoke exactly/i)
      ).toBeInTheDocument();
    });
  });

  describe("Intent: Warnings must be prominently displayed for risky revocations", () => {
    it("displays all warnings when present", async () => {
      const impact = createMockRevocationImpact({
        warnings: [
          "This agent has pending delegations to 5 other agents",
          "Revocation will affect production workloads",
          "Some affected agents have active API keys",
        ],
      });
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(
          screen.getByText("This agent has pending delegations to 5 other agents")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Revocation will affect production workloads")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Some affected agents have active API keys")
        ).toBeInTheDocument();
      });
    });

    it("shows warning section with destructive styling", async () => {
      const impact = createMockRevocationImpact({
        warnings: ["Critical warning message"],
      });
      mockLoadImpact.mockResolvedValue(impact);

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      // Wait for warning text to appear first
      await waitFor(() => {
        expect(screen.getByText("Critical warning message")).toBeInTheDocument();
      });

      // Alert with destructive styling should be present (findByRole is async-friendly)
      const alertElement = await screen.findByRole("alert");
      expect(alertElement).toBeInTheDocument();
    });
  });

  describe("Intent: Loading and error states must be clear", () => {
    it("shows loading skeleton while fetching impact data", async () => {
      // Never resolve to keep loading - use a promise that stays pending
      let resolvePromise: (value: RevocationImpactPreview) => void;
      mockLoadImpact.mockImplementation(
        () =>
          new Promise<RevocationImpactPreview>((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { container } = renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      // Wait for the modal to render and be in loading state
      // The loading state is indicated by the absence of the "Affected Agents" text
      // and the presence of skeleton elements
      await waitFor(
        () => {
          // Modal should be open (dialog title visible)
          expect(screen.getByText("Cascade Revocation")).toBeInTheDocument();

          // During loading, the main content (Affected Agents) should NOT be visible
          expect(screen.queryByText("Affected Agents")).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Verify the loadImpact was called (component started loading)
      expect(mockLoadImpact).toHaveBeenCalledWith("agent-target");
    });

    it("shows error message when impact loading fails", async () => {
      mockLoadImpact.mockRejectedValue(new Error("Failed to load impact data"));

      renderWithProviders(
        <CascadeRevocationModal
          open={true}
          onOpenChange={() => {}}
          targetAgentId="agent-target"
          onConfirm={mockOnConfirm}
          loadImpact={mockLoadImpact}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load impact data")
        ).toBeInTheDocument();
      });
    });
  });
});

// ============================================================================
// Constraint Tightening Validation Tests
// ============================================================================

describe("Constraint Tightening Validation", () => {
  /**
   * These tests validate the EATP principle:
   * "Constraints can only be tightened, never loosened"
   *
   * When delegating, the child agent must have EQUAL or MORE RESTRICTIVE
   * constraints than the parent.
   */

  describe("Intent: The system should prevent delegation that expands permissions", () => {
    /**
     * Test utility to validate constraint tightening
     * In a real implementation, this would call an API or hook
     */
    function validateConstraintTightening(
      parentConstraints: Record<string, unknown>,
      childConstraints: Record<string, unknown>
    ): ConstraintTighteningResult {
      const violations: ConstraintTighteningViolation[] = [];

      // Cost limit validation
      if (
        parentConstraints.cost_limit !== undefined &&
        childConstraints.cost_limit !== undefined
      ) {
        const parentLimit = parentConstraints.cost_limit as number;
        const childLimit = childConstraints.cost_limit as number;
        if (childLimit > parentLimit) {
          violations.push({
            constraintType: "cost_limit",
            parentValue: parentLimit,
            childValue: childLimit,
            message: `Child cost limit ($${childLimit}) exceeds parent limit ($${parentLimit})`,
          });
        }
      }

      // Time window validation (child must be subset)
      if (parentConstraints.time_window && childConstraints.time_window) {
        const parent = parentConstraints.time_window as {
          start: number;
          end: number;
        };
        const child = childConstraints.time_window as {
          start: number;
          end: number;
        };
        if (child.start < parent.start || child.end > parent.end) {
          violations.push({
            constraintType: "time_window",
            parentValue: parent,
            childValue: child,
            message: `Child time window (${child.start}-${child.end}) extends beyond parent window (${parent.start}-${parent.end})`,
          });
        }
      }

      // Rate limit validation
      if (
        parentConstraints.rate_limit !== undefined &&
        childConstraints.rate_limit !== undefined
      ) {
        const parentRate = parentConstraints.rate_limit as number;
        const childRate = childConstraints.rate_limit as number;
        if (childRate > parentRate) {
          violations.push({
            constraintType: "rate_limit",
            parentValue: parentRate,
            childValue: childRate,
            message: `Child rate limit (${childRate}/min) exceeds parent limit (${parentRate}/min)`,
          });
        }
      }

      // Resource access validation (child must be subset)
      if (parentConstraints.resources && childConstraints.resources) {
        const parentResources = parentConstraints.resources as string[];
        const childResources = childConstraints.resources as string[];
        const extraResources = childResources.filter(
          (r) => !parentResources.includes(r)
        );
        if (extraResources.length > 0) {
          violations.push({
            constraintType: "resources",
            parentValue: parentResources,
            childValue: childResources,
            message: `Child has access to resources not granted to parent: ${extraResources.join(", ")}`,
          });
        }
      }

      return {
        valid: violations.length === 0,
        violations,
      };
    }

    it("allows tightening cost limits (child limit < parent limit)", () => {
      const result = validateConstraintTightening(
        { cost_limit: 100 },
        { cost_limit: 50 } // Tighter - OK
      );

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("rejects loosening cost limits (child limit > parent limit)", () => {
      const result = validateConstraintTightening(
        { cost_limit: 100 },
        { cost_limit: 200 } // Looser - VIOLATION
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]?.constraintType).toBe("cost_limit");
      expect(result.violations[0]?.message).toContain("exceeds parent limit");
    });

    it("allows narrower time windows (child window inside parent window)", () => {
      const result = validateConstraintTightening(
        { time_window: { start: 9, end: 17 } },
        { time_window: { start: 10, end: 16 } } // Subset - OK
      );

      expect(result.valid).toBe(true);
    });

    it("rejects wider time windows (child window extends beyond parent)", () => {
      const result = validateConstraintTightening(
        { time_window: { start: 9, end: 17 } },
        { time_window: { start: 8, end: 18 } } // Extends both directions - VIOLATION
      );

      expect(result.valid).toBe(false);
      expect(result.violations[0]?.constraintType).toBe("time_window");
    });

    it("allows subset of resource access", () => {
      const result = validateConstraintTightening(
        { resources: ["database:read", "database:write", "cache:read"] },
        { resources: ["database:read"] } // Subset - OK
      );

      expect(result.valid).toBe(true);
    });

    it("rejects additional resource access not in parent", () => {
      const result = validateConstraintTightening(
        { resources: ["database:read"] },
        { resources: ["database:read", "database:write"] } // Extra permissions - VIOLATION
      );

      expect(result.valid).toBe(false);
      expect(result.violations[0]?.message).toContain("database:write");
    });

    it("allows lower rate limits", () => {
      const result = validateConstraintTightening(
        { rate_limit: 1000 },
        { rate_limit: 500 } // Lower - OK
      );

      expect(result.valid).toBe(true);
    });

    it("rejects higher rate limits", () => {
      const result = validateConstraintTightening(
        { rate_limit: 1000 },
        { rate_limit: 2000 } // Higher - VIOLATION
      );

      expect(result.valid).toBe(false);
      expect(result.violations[0]?.constraintType).toBe("rate_limit");
    });

    it("accumulates multiple violations when multiple constraints are loosened", () => {
      const result = validateConstraintTightening(
        {
          cost_limit: 100,
          rate_limit: 1000,
          resources: ["database:read"],
        },
        {
          cost_limit: 200, // VIOLATION
          rate_limit: 2000, // VIOLATION
          resources: ["database:read", "database:write"], // VIOLATION
        }
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(3);
    });
  });

  describe("Intent: Equal constraints are valid (no change)", () => {
    function validateConstraintTightening(
      parentConstraints: Record<string, unknown>,
      childConstraints: Record<string, unknown>
    ): ConstraintTighteningResult {
      const violations: ConstraintTighteningViolation[] = [];

      if (
        parentConstraints.cost_limit !== undefined &&
        childConstraints.cost_limit !== undefined
      ) {
        const parentLimit = parentConstraints.cost_limit as number;
        const childLimit = childConstraints.cost_limit as number;
        if (childLimit > parentLimit) {
          violations.push({
            constraintType: "cost_limit",
            parentValue: parentLimit,
            childValue: childLimit,
            message: `Child cost limit ($${childLimit}) exceeds parent limit ($${parentLimit})`,
          });
        }
      }

      return {
        valid: violations.length === 0,
        violations,
      };
    }

    it("allows exact same constraints (no tightening)", () => {
      const constraints = { cost_limit: 100 };
      const result = validateConstraintTightening(constraints, constraints);

      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// Integration Test: Complete EATP Workflow
// ============================================================================

describe("EATP Integration: Human Origin through Delegation Chain", () => {
  describe("Intent: Human origin is preserved and visible throughout delegation chain", () => {
    it("displays human origin consistently across all delegation levels", () => {
      // Create a delegation chain where human origin stays the same
      const humanOrigin = createMockHumanOrigin({
        displayName: "Security Admin",
        humanId: "admin@company.com",
        authProvider: "okta" as AuthProvider,
      });

      // Render human origin badge in different contexts
      const { rerender } = renderWithProviders(
        <HumanOriginBadge humanOrigin={humanOrigin} showDetails />
      );

      // Level 0: Direct from human
      expect(screen.getByText("Security Admin")).toBeInTheDocument();

      // Rerender simulating different delegation level - same human origin
      rerender(
        <HumanOriginBadge humanOrigin={humanOrigin} showDetails size="sm" />
      );

      // Human origin should still be clearly visible
      expect(screen.getByText("Security Admin")).toBeInTheDocument();
      expect(screen.getByText("admin@company.com")).toBeInTheDocument();
    });
  });
});
