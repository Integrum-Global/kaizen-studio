import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { AlertDialog } from "../AlertDialog";
import { alertsApi } from "../../api";
import type { AlertRule } from "../../types";

// Mock the alerts API
vi.mock("../../api", () => ({
  alertsApi: {
    rules: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("AlertDialog", () => {
  const createMockRule = (overrides?: Partial<AlertRule>): AlertRule => ({
    id: "rule-1",
    name: "Test Rule",
    description: "A test rule",
    metric: "cpu_usage",
    operator: "gt",
    threshold: 80,
    duration: 300,
    severity: "warning",
    enabled: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create dialog when no rule provided", () => {
    renderWithProviders(<AlertDialog open={true} onOpenChange={vi.fn()} />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("Create Alert Rule")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure a new alert rule to monitor your system metrics."
      )
    ).toBeInTheDocument();
  });

  it("should render edit dialog when rule is provided", () => {
    const rule = createMockRule({ name: "Existing Rule" });

    renderWithProviders(
      <AlertDialog open={true} onOpenChange={vi.fn()} rule={rule} />,
      { queryClient: createTestQueryClient() }
    );

    expect(screen.getByText("Edit Alert Rule")).toBeInTheDocument();
    expect(
      screen.getByText("Update the alert rule configuration below.")
    ).toBeInTheDocument();
  });

  it("should pre-fill form when editing", () => {
    const rule = createMockRule({
      name: "High CPU Alert",
      description: "Alert for high CPU usage",
    });

    renderWithProviders(
      <AlertDialog open={true} onOpenChange={vi.fn()} rule={rule} />,
      { queryClient: createTestQueryClient() }
    );

    const nameInput = screen.getByLabelText(/rule name/i);
    expect(nameInput).toHaveValue("High CPU Alert");

    const descInput = screen.getByLabelText(/description/i);
    expect(descInput).toHaveValue("Alert for high CPU usage");
  });

  it("should call create API when submitting new rule", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const newRule = createMockRule();

    vi.mocked(alertsApi.rules.create).mockResolvedValue(newRule);

    renderWithProviders(
      <AlertDialog open={true} onOpenChange={onOpenChange} />,
      { queryClient: createTestQueryClient() }
    );

    // Fill in the form
    const nameInput = screen.getByLabelText(/rule name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Alert Rule");

    // Submit
    const submitButton = screen.getByRole("button", { name: /create rule/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertsApi.rules.create).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should call update API when submitting existing rule", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const rule = createMockRule({ name: "Existing Rule" });
    const updatedRule = { ...rule, name: "Updated Rule" };

    vi.mocked(alertsApi.rules.update).mockResolvedValue(updatedRule);

    renderWithProviders(
      <AlertDialog open={true} onOpenChange={onOpenChange} rule={rule} />,
      { queryClient: createTestQueryClient() }
    );

    // Update the name
    const nameInput = screen.getByLabelText(/rule name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Rule");

    // Submit
    const submitButton = screen.getByRole("button", { name: /update rule/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertsApi.rules.update).toHaveBeenCalledWith(
        rule.id,
        expect.objectContaining({ name: "Updated Rule" })
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("should close dialog on cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <AlertDialog open={true} onOpenChange={onOpenChange} />,
      { queryClient: createTestQueryClient() }
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should not render when open is false", () => {
    const { container } = renderWithProviders(
      <AlertDialog open={false} onOpenChange={vi.fn()} />,
      { queryClient: createTestQueryClient() }
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should disable submit button while submitting", async () => {
    const user = userEvent.setup();
    vi.mocked(alertsApi.rules.create).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<AlertDialog open={true} onOpenChange={vi.fn()} />, {
      queryClient: createTestQueryClient(),
    });

    const nameInput = screen.getByLabelText(/rule name/i);
    await user.type(nameInput, "Test Rule");

    const submitButton = screen.getByRole("button", { name: /create rule/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
