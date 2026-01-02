/**
 * RevokeTrustDialog Tests
 *
 * Tests for the trust revocation confirmation dialog
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RevokeTrustDialog } from "../components/TrustManagement/RevokeTrustDialog";

// Mock the hooks
const mockRevokeTrust = vi.fn();
vi.mock("../hooks", () => ({
  useRevokeTrust: vi.fn(() => ({
    mutate: mockRevokeTrust,
    isPending: false,
  })),
}));

// Mock toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
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

describe("RevokeTrustDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    agentId: "test-agent-123",
    agentName: "Test Agent",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open is true", () => {
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/this action will permanently revoke/i)
    ).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    renderWithProviders(<RevokeTrustDialog {...defaultProps} open={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays agent information", () => {
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    expect(screen.getByText("Test Agent")).toBeInTheDocument();
    expect(screen.getByText("test-agent-123")).toBeInTheDocument();
    expect(screen.getByText(/will be revoked/i)).toBeInTheDocument();
  });

  it("shows warning about irreversible action", () => {
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    expect(
      screen.getByText(/this action cannot be undone/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/lose all capabilities/i)).toBeInTheDocument();
  });

  it("requires reason for revocation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    // Type confirmation but not reason
    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "REVOKE");

    // Button should still be disabled
    const revokeButton = screen.getByRole("button", { name: /revoke trust/i });
    expect(revokeButton).toBeDisabled();
  });

  it("requires confirmation text to enable revoke button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    // Fill in reason
    const reasonTextarea = screen.getByPlaceholderText(/enter the reason/i);
    await user.type(reasonTextarea, "Security violation detected");

    // Revoke button should still be disabled without confirmation
    const revokeButton = screen.getByRole("button", { name: /revoke trust/i });
    expect(revokeButton).toBeDisabled();

    // Type confirmation
    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "REVOKE");

    // Button should now be enabled
    expect(revokeButton).not.toBeDisabled();
  });

  it("shows error when confirmation text is wrong", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "wrong");

    expect(screen.getByText(/please type REVOKE exactly/i)).toBeInTheDocument();
  });

  it("calls revokeTrust mutation when form is valid", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    // Fill reason
    const reasonTextarea = screen.getByPlaceholderText(/enter the reason/i);
    await user.type(reasonTextarea, "Security breach");

    // Type confirmation
    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "REVOKE");

    // Click revoke
    const revokeButton = screen.getByRole("button", { name: /revoke trust/i });
    await user.click(revokeButton);

    expect(mockRevokeTrust).toHaveBeenCalledWith(
      {
        agent_id: "test-agent-123",
        reason: "Security breach",
      },
      expect.any(Object)
    );
  });

  it("calls onOpenChange when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <RevokeTrustDialog {...defaultProps} onOpenChange={onOpenChange} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets form fields when dialog closes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = renderWithProviders(
      <RevokeTrustDialog {...defaultProps} onOpenChange={onOpenChange} />
    );

    // Fill in some values
    const reasonTextarea = screen.getByPlaceholderText(/enter the reason/i);
    await user.type(reasonTextarea, "Test reason");

    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "REV");

    // Close dialog
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Reopen dialog
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <RevokeTrustDialog
          {...defaultProps}
          open={true}
          onOpenChange={onOpenChange}
        />
      </QueryClientProvider>
    );

    // Form should be reset (the component uses internal state, so we check initial state)
    const newReasonTextarea = screen.getByPlaceholderText(/enter the reason/i);
    expect(newReasonTextarea).toHaveValue("");
  });

  it("converts confirmation to uppercase automatically", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RevokeTrustDialog {...defaultProps} />);

    const reasonTextarea = screen.getByPlaceholderText(/enter the reason/i);
    await user.type(reasonTextarea, "Test");

    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "revoke"); // lowercase

    // Button should be enabled because "revoke" becomes "REVOKE"
    const revokeButton = screen.getByRole("button", { name: /revoke trust/i });
    expect(revokeButton).not.toBeDisabled();
  });

  it("displays agent ID when name is not provided", () => {
    renderWithProviders(
      <RevokeTrustDialog
        open={true}
        onOpenChange={vi.fn()}
        agentId="agent-without-name"
      />
    );

    // Agent ID should be displayed
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const codeElement = screen.getByText("agent-without-name");
    expect(codeElement).toBeInTheDocument();
  });
});

describe("RevokeTrustDialog - Success Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup successful mutation
    mockRevokeTrust.mockImplementation((_, options) => {
      options?.onSuccess?.();
    });
  });

  it("shows success toast and closes dialog on success", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <RevokeTrustDialog
        open={true}
        onOpenChange={onOpenChange}
        agentId="test-agent"
        agentName="Test Agent"
        onSuccess={onSuccess}
      />
    );

    // Fill form
    const reasonTextarea = screen.getByPlaceholderText(/enter the reason/i);
    await user.type(reasonTextarea, "Test reason");

    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "REVOKE");

    // Submit
    const revokeButton = screen.getByRole("button", { name: /revoke trust/i });
    await user.click(revokeButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Trust Revoked",
        })
      );
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("RevokeTrustDialog - Error Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup failed mutation
    mockRevokeTrust.mockImplementation((_, options) => {
      options?.onError?.(new Error("Revocation failed"));
    });
  });

  it("shows error toast on failure", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RevokeTrustDialog
        open={true}
        onOpenChange={vi.fn()}
        agentId="test-agent"
      />
    );

    // Fill form
    const reasonTextarea = screen.getByPlaceholderText(/enter the reason/i);
    await user.type(reasonTextarea, "Test reason");

    const confirmInput = screen.getByPlaceholderText(/type revoke to confirm/i);
    await user.type(confirmInput, "REVOKE");

    // Submit
    const revokeButton = screen.getByRole("button", { name: /revoke trust/i });
    await user.click(revokeButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Revocation Failed",
          variant: "destructive",
        })
      );
    });
  });
});
