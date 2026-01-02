import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScalingEventTimeline } from "../ScalingEventTimeline";

// Mock the hooks
vi.mock("../../hooks", () => ({
  useScalingEvents: vi.fn(),
}));

import { useScalingEvents } from "../../hooks";

const mockUseScalingEvents = useScalingEvents as ReturnType<typeof vi.fn>;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("ScalingEventTimeline", () => {
  it("renders loading state", () => {
    mockUseScalingEvents.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithProviders(<ScalingEventTimeline />);

    // Should show skeleton loader
    expect(screen.queryByText("Scaling Events")).not.toBeInTheDocument();
  });

  it("renders empty state when no events", () => {
    mockUseScalingEvents.mockReturnValue({
      data: { records: [], total: 0 },
      isLoading: false,
    });

    renderWithProviders(<ScalingEventTimeline />);

    expect(screen.getByText("Scaling Events")).toBeInTheDocument();
    expect(screen.getByText("No scaling events recorded")).toBeInTheDocument();
  });

  it("renders scaling events", () => {
    mockUseScalingEvents.mockReturnValue({
      data: {
        records: [
          {
            id: "event-1",
            gatewayId: "gw-1",
            policyId: "policy-1",
            type: "scale_up",
            previousReplicas: 3,
            newReplicas: 5,
            reason: "High CPU usage detected",
            triggeredBy: "auto-scaler",
            createdAt: "2024-01-15T10:30:00Z",
          },
          {
            id: "event-2",
            gatewayId: "gw-1",
            type: "manual",
            previousReplicas: 5,
            newReplicas: 4,
            reason: "Manual adjustment",
            triggeredBy: "admin@example.com",
            createdAt: "2024-01-14T15:00:00Z",
          },
        ],
        total: 2,
      },
      isLoading: false,
    });

    renderWithProviders(<ScalingEventTimeline />);

    expect(screen.getByText("Scaling Events")).toBeInTheDocument();
    expect(screen.getByText("Scale Up")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("3 → 5 replicas")).toBeInTheDocument();
    expect(screen.getByText("5 → 4 replicas")).toBeInTheDocument();
    expect(screen.getByText("High CPU usage detected")).toBeInTheDocument();
    expect(screen.getByText("auto-scaler")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });

  it("respects maxItems prop", () => {
    mockUseScalingEvents.mockReturnValue({
      data: {
        records: [
          {
            id: "event-1",
            gatewayId: "gw-1",
            type: "scale_up",
            previousReplicas: 3,
            newReplicas: 5,
            reason: "Reason 1",
            triggeredBy: "auto-scaler",
            createdAt: "2024-01-15T10:30:00Z",
          },
          {
            id: "event-2",
            gatewayId: "gw-1",
            type: "scale_down",
            previousReplicas: 5,
            newReplicas: 3,
            reason: "Reason 2",
            triggeredBy: "auto-scaler",
            createdAt: "2024-01-14T10:30:00Z",
          },
          {
            id: "event-3",
            gatewayId: "gw-1",
            type: "manual",
            previousReplicas: 3,
            newReplicas: 4,
            reason: "Reason 3",
            triggeredBy: "user@example.com",
            createdAt: "2024-01-13T10:30:00Z",
          },
        ],
        total: 3,
      },
      isLoading: false,
    });

    renderWithProviders(<ScalingEventTimeline maxItems={2} />);

    expect(screen.getByText("Reason 1")).toBeInTheDocument();
    expect(screen.getByText("Reason 2")).toBeInTheDocument();
    expect(screen.queryByText("Reason 3")).not.toBeInTheDocument();
  });
});
