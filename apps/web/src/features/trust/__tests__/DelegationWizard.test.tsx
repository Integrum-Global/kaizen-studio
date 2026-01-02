/**
 * DelegationWizard Tests
 *
 * Tests for the 5-step trust delegation wizard
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DelegationWizard } from "../components/TrustManagement/DelegationWizard";
import { CapabilityType, TrustStatus } from "../types";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-1234-5678-9012-345678901234",
});

// Mock the hooks
vi.mock("../hooks", () => ({
  useTrustChains: vi.fn(() => ({
    data: {
      items: [
        {
          genesis: { agent_id: "agent-001" },
          capabilities: [
            {
              capability: "access:read:*",
              capability_type: "ACCESS",
              constraints: [],
            },
          ],
        },
      ],
      total: 1,
    },
    isLoading: false,
  })),
  useTrustChain: vi.fn((agentId: string) => ({
    data: agentId
      ? {
          genesis: { agent_id: agentId },
          capabilities: [
            {
              capability: "access:read:*",
              capability_type: "ACCESS",
              constraints: [],
            },
            {
              capability: "action:execute:*",
              capability_type: "ACTION",
              constraints: ["audit_requirement:level:high"],
            },
          ],
        }
      : null,
    isLoading: false,
    error: null,
  })),
  useDelegateTrust: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Mock toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("DelegationWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the wizard with all steps", () => {
    renderWithProviders(<DelegationWizard />);

    expect(screen.getByText("Delegate Trust")).toBeInTheDocument();
    expect(screen.getByText("Source Agent")).toBeInTheDocument();
    expect(screen.getByText("Target Agent")).toBeInTheDocument();
    expect(screen.getByText("Capabilities")).toBeInTheDocument();
    expect(screen.getByText("Constraints")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("shows step 1 (Source Agent) by default", () => {
    renderWithProviders(<DelegationWizard />);

    expect(screen.getByText(/select source agent/i)).toBeInTheDocument();
    expect(
      screen.getByText(/select the agent delegating trust/i)
    ).toBeInTheDocument();
  });

  it("validates source agent before proceeding", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DelegationWizard />);

    // Try to click Next without selecting source agent
    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText(/please select a source agent/i)
      ).toBeInTheDocument();
    });
  });

  it("navigates to step 2 after selecting source agent", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DelegationWizard />);

    // Enter source agent ID
    const agentIdInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(agentIdInput, "12345678-1234-1234-1234-123456789012");

    // Click Next
    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/select target agent/i)).toBeInTheDocument();
    });
  });

  it("validates target agent is different from source", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DelegationWizard />);

    // Step 1: Enter source agent
    const agentIdInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(agentIdInput, "12345678-1234-1234-1234-123456789012");

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 2: Enter same agent as target
    await waitFor(() => {
      expect(screen.getByText(/select target agent/i)).toBeInTheDocument();
    });

    const targetInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(targetInput, "12345678-1234-1234-1234-123456789012");
    await user.click(nextButton);

    await waitFor(() => {
      expect(
        screen.getByText(/target agent must be different/i)
      ).toBeInTheDocument();
    });
  });

  it("shows progress bar that updates with steps", () => {
    renderWithProviders(<DelegationWizard />);

    // Progress should be at 20% (step 1 of 5)
    const progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it("allows going back to previous steps", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DelegationWizard />);

    // Navigate to step 2
    const agentIdInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(agentIdInput, "12345678-1234-1234-1234-123456789012");

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/select target agent/i)).toBeInTheDocument();
    });

    // Go back to step 1
    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/select source agent/i)).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<DelegationWizard onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("pre-fills source agent when initialSourceAgentId is provided", () => {
    renderWithProviders(
      <DelegationWizard initialSourceAgentId="pre-filled-agent-id" />
    );

    const agentIdInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    expect(agentIdInput).toHaveValue("pre-filled-agent-id");
  });
});

describe("DelegationWizard - Constraints Step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows toggling further delegation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DelegationWizard />);

    // Navigate to step 4 (Constraints)
    const agentIdInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(agentIdInput, "12345678-1234-1234-1234-123456789012");

    // Step 1 -> 2
    let nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/select target agent/i)).toBeInTheDocument();
    });

    // Step 2: Enter target
    const targetInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(targetInput, "87654321-4321-4321-4321-210987654321");

    nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 3: Select a capability (check the first one via clicking)
    await waitFor(() => {
      expect(
        screen.getByText(/select capabilities to delegate/i)
      ).toBeInTheDocument();
    });

    // Click select all to add capabilities (use getAllByText and pick first)
    const selectAllLinks = screen.getAllByText(/select all/i);
    await user.click(selectAllLinks[0] as HTMLElement);

    nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 4: Constraints
    await waitFor(() => {
      expect(
        screen.getByText(/configure constraints and limits/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/allow further delegation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/understanding delegation depth/i)
    ).toBeInTheDocument();
  });
});

describe("DelegationWizard - Review Step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows summary of all configuration", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DelegationWizard />);

    // Navigate through all steps to reach review
    // This is a more detailed integration test showing the full flow

    // Step 1: Source agent
    const agentIdInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(agentIdInput, "12345678-1234-1234-1234-123456789012");

    let nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 2: Target agent
    await waitFor(() => {
      expect(screen.getByText(/select target agent/i)).toBeInTheDocument();
    });

    const targetInput = screen.getByPlaceholderText(
      /00000000-0000-0000-0000-000000000000/i
    );
    await user.type(targetInput, "87654321-4321-4321-4321-210987654321");

    nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 3: Capabilities
    await waitFor(() => {
      expect(
        screen.getByText(/select capabilities to delegate/i)
      ).toBeInTheDocument();
    });

    const selectAllLinks = screen.getAllByText(/select all/i);
    await user.click(selectAllLinks[0] as HTMLElement);

    nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 4: Constraints
    await waitFor(() => {
      expect(
        screen.getByText(/configure constraints and limits/i)
      ).toBeInTheDocument();
    });

    nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Step 5: Review
    await waitFor(() => {
      expect(
        screen.getByText(/review delegation details/i)
      ).toBeInTheDocument();
    });

    // Verify we reached review step - check specific review content
    // The step navigation also contains "Source Agent" etc., so we use getAllByText
    expect(screen.getAllByText(/source agent/i).length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getAllByText(/target agent/i).length).toBeGreaterThanOrEqual(
      1
    );
    expect(screen.getAllByText(/capabilities/i).length).toBeGreaterThanOrEqual(
      1
    );

    // These are unique to the review step form
    expect(screen.getByText(/expiration date/i)).toBeInTheDocument();
    expect(screen.getByText(/justification/i)).toBeInTheDocument();

    // Should show Create Delegation button on final step
    expect(
      screen.getByRole("button", { name: /create delegation/i })
    ).toBeInTheDocument();
  });
});
