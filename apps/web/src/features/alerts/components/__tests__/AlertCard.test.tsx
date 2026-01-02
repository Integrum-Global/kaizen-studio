import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AlertCard } from "../AlertCard";
import type { Alert } from "../../types";

describe("AlertCard", () => {
  const createMockAlert = (overrides?: Partial<Alert>): Alert => ({
    id: "alert-1",
    name: "Test Alert",
    description: "A test alert description",
    severity: "warning",
    status: "active",
    metric: "cpu_usage",
    condition: "cpu_usage > 80%",
    threshold: 80,
    current_value: 85,
    rule_id: "rule-1",
    triggered_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  it("should render alert information correctly", () => {
    const alert = createMockAlert({
      name: "High CPU Usage",
      description: "CPU usage is too high",
    });

    renderWithProviders(<AlertCard alert={alert} />);

    expect(screen.getByText("High CPU Usage")).toBeInTheDocument();
    expect(screen.getByText("CPU usage is too high")).toBeInTheDocument();
  });

  it("should display severity badge", () => {
    const alert = createMockAlert({ severity: "critical" });

    renderWithProviders(<AlertCard alert={alert} />);

    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("should display status badge", () => {
    const alert = createMockAlert({ status: "acknowledged" });

    renderWithProviders(<AlertCard alert={alert} />);

    expect(screen.getByText("Acknowledged")).toBeInTheDocument();
  });

  it("should display condition and threshold", () => {
    const alert = createMockAlert({
      condition: "memory_usage > 90%",
      threshold: 90,
      current_value: 95,
    });

    renderWithProviders(<AlertCard alert={alert} />);

    expect(screen.getByText("memory_usage > 90%")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("should show acknowledge button for active alerts", async () => {
    const user = userEvent.setup();
    const onAcknowledge = vi.fn();
    const alert = createMockAlert({ status: "active" });

    renderWithProviders(
      <AlertCard alert={alert} onAcknowledge={onAcknowledge} />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click acknowledge
    const acknowledgeButton = screen.getByText("Acknowledge");
    await user.click(acknowledgeButton);

    expect(onAcknowledge).toHaveBeenCalledWith(alert.id);
  });

  it("should show resolve button for non-resolved alerts", async () => {
    const user = userEvent.setup();
    const onResolve = vi.fn();
    const alert = createMockAlert({ status: "active" });

    renderWithProviders(<AlertCard alert={alert} onResolve={onResolve} />);

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click resolve
    const resolveButton = screen.getByText("Resolve");
    await user.click(resolveButton);

    expect(onResolve).toHaveBeenCalledWith(alert.id);
  });

  it("should show view history button", async () => {
    const user = userEvent.setup();
    const onViewHistory = vi.fn();
    const alert = createMockAlert();

    renderWithProviders(
      <AlertCard alert={alert} onViewHistory={onViewHistory} />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click view history
    const historyButton = screen.getByText("View History");
    await user.click(historyButton);

    expect(onViewHistory).toHaveBeenCalledWith(alert.id);
  });

  it("should display resolved timestamp when alert is resolved", () => {
    const alert = createMockAlert({
      status: "resolved",
      resolved_at: "2024-01-02T00:00:00Z",
    });

    renderWithProviders(<AlertCard alert={alert} />);

    const resolvedElements = screen.getAllByText(/Resolved/);
    expect(resolvedElements.length).toBeGreaterThan(0);
  });

  it("should display acknowledged timestamp when alert is acknowledged", () => {
    const alert = createMockAlert({
      status: "acknowledged",
      acknowledged_at: "2024-01-02T00:00:00Z",
    });

    renderWithProviders(<AlertCard alert={alert} />);

    const acknowledgedElements = screen.getAllByText(/Acknowledged/);
    expect(acknowledgedElements.length).toBeGreaterThan(0);
  });

  it("should render without optional callbacks", () => {
    const alert = createMockAlert();

    renderWithProviders(<AlertCard alert={alert} />);

    expect(screen.getByText("Test Alert")).toBeInTheDocument();
  });

  it("should render with all severity types", () => {
    const severities: Array<Alert["severity"]> = [
      "critical",
      "warning",
      "info",
    ];

    severities.forEach((severity) => {
      const alert = createMockAlert({ severity, name: `${severity} alert` });
      const { unmount } = renderWithProviders(<AlertCard alert={alert} />);

      expect(
        screen.getByText(severity.charAt(0).toUpperCase() + severity.slice(1))
      ).toBeInTheDocument();

      unmount();
    });
  });

  it("should render with all status types", () => {
    const statuses: Array<Alert["status"]> = [
      "active",
      "acknowledged",
      "resolved",
    ];

    statuses.forEach((status) => {
      const alert = createMockAlert({ status, name: `${status} alert` });
      const { unmount } = renderWithProviders(<AlertCard alert={alert} />);

      expect(
        screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))
      ).toBeInTheDocument();

      unmount();
    });
  });
});
