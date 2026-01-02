import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { AlertHistory } from "../AlertHistory";
import { alertsApi } from "../../api";
import type {
  AlertHistory as AlertHistoryType,
  AlertHistoryResponse,
} from "../../types";

// Mock the alerts API
vi.mock("../../api", () => ({
  alertsApi: {
    getHistory: vi.fn(),
  },
}));

describe("AlertHistory", () => {
  const createMockHistoryEvent = (
    overrides?: Partial<AlertHistoryType>
  ): AlertHistoryType => ({
    id: `history-${Math.random()}`,
    alert_id: "alert-1",
    triggered_at: "2024-01-01T00:00:00Z",
    resolved_at: undefined,
    duration: undefined,
    value: 85,
    threshold: 80,
    severity: "warning",
    details: "Test event",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    vi.mocked(alertsApi.getHistory).mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no history", async () => {
    const mockResponse: AlertHistoryResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No history available")).toBeInTheDocument();
      expect(
        screen.getByText("This alert has not been triggered yet")
      ).toBeInTheDocument();
    });
  });

  it("should render history events correctly", async () => {
    const events = [
      createMockHistoryEvent({
        triggered_at: "2024-01-01T10:00:00Z",
        severity: "critical",
      }),
      createMockHistoryEvent({
        triggered_at: "2024-01-02T10:00:00Z",
        severity: "warning",
      }),
    ];
    const mockResponse: AlertHistoryResponse = {
      records: events,
      total: 2,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Alert History")).toBeInTheDocument();
      expect(screen.getByText("2 events")).toBeInTheDocument();
    });
  });

  it("should display severity badges", async () => {
    const events = [
      createMockHistoryEvent({ severity: "critical" }),
      createMockHistoryEvent({ severity: "warning" }),
      createMockHistoryEvent({ severity: "info" }),
    ];
    const mockResponse: AlertHistoryResponse = {
      records: events,
      total: 3,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Critical")).toBeInTheDocument();
      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText("Info")).toBeInTheDocument();
    });
  });

  it("should display value and threshold", async () => {
    const event = createMockHistoryEvent({
      value: 95,
      threshold: 80,
    });
    const mockResponse: AlertHistoryResponse = {
      records: [event],
      total: 1,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Value:")).toBeInTheDocument();
      expect(screen.getByText("95")).toBeInTheDocument();
      expect(screen.getByText("Threshold:")).toBeInTheDocument();
      expect(screen.getByText("80")).toBeInTheDocument();
    });
  });

  it("should show resolved status for resolved events", async () => {
    const event = createMockHistoryEvent({
      resolved_at: "2024-01-01T12:00:00Z",
      duration: 7200, // 2 hours
    });
    const mockResponse: AlertHistoryResponse = {
      records: [event],
      total: 1,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Resolved/)).toBeInTheDocument();
      expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    });
  });

  it("should show active status for unresolved events", async () => {
    const event = createMockHistoryEvent({
      resolved_at: undefined,
    });
    const mockResponse: AlertHistoryResponse = {
      records: [event],
      total: 1,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Still active")).toBeInTheDocument();
    });
  });

  it("should display event details when available", async () => {
    const event = createMockHistoryEvent({
      details: "Alert triggered due to high CPU usage",
    });
    const mockResponse: AlertHistoryResponse = {
      records: [event],
      total: 1,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Alert triggered due to high CPU usage")
      ).toBeInTheDocument();
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(alertsApi.getHistory).mockRejectedValue(
      new Error("Network error")
    );

    renderWithProviders(<AlertHistory alertId="alert-1" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load alert history")
      ).toBeInTheDocument();
    });
  });

  it("should format event count correctly", async () => {
    const singleEvent = createMockHistoryEvent();
    const mockResponseSingle: AlertHistoryResponse = {
      records: [singleEvent],
      total: 1,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponseSingle);

    const { unmount } = renderWithProviders(
      <AlertHistory alertId="alert-1" />,
      {
        queryClient: createTestQueryClient(),
      }
    );

    await waitFor(() => {
      expect(screen.getByText("1 event")).toBeInTheDocument();
    });

    unmount();

    // Test plural
    const multipleEvents = [createMockHistoryEvent(), createMockHistoryEvent()];
    const mockResponseMultiple: AlertHistoryResponse = {
      records: multipleEvents,
      total: 5,
    };
    vi.mocked(alertsApi.getHistory).mockResolvedValue(mockResponseMultiple);

    renderWithProviders(<AlertHistory alertId="alert-2" />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("5 events")).toBeInTheDocument();
    });
  });
});
