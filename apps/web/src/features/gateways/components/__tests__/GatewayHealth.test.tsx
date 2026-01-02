import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GatewayHealth } from "../GatewayHealth";

// Mock the hooks
vi.mock("../../hooks", () => ({
  useGatewayHealth: vi.fn(),
}));

import { useGatewayHealth } from "../../hooks";

const mockUseGatewayHealth = useGatewayHealth as ReturnType<typeof vi.fn>;

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

describe("GatewayHealth", () => {
  it("renders loading state", () => {
    mockUseGatewayHealth.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithProviders(<GatewayHealth gatewayId="gw-1" />);

    // Should show skeleton loader
    expect(screen.queryByText("Gateway Health")).not.toBeInTheDocument();
  });

  it("renders health data when loaded", () => {
    mockUseGatewayHealth.mockReturnValue({
      data: {
        gatewayId: "gw-1",
        status: "healthy",
        latency: 45,
        requestsPerSecond: 1200,
        errorRate: 0.5,
        cpuUsage: 65,
        memoryUsage: 72,
        uptime: 99.95,
        lastCheck: "2024-01-15T10:30:00Z",
      },
      isLoading: false,
    });

    renderWithProviders(
      <GatewayHealth gatewayId="gw-1" gatewayName="Test Gateway" />
    );

    expect(screen.getByText("Test Gateway Health")).toBeInTheDocument();
    expect(screen.getByText("45ms")).toBeInTheDocument();
    // Note: toLocaleString() output may vary by environment
    expect(screen.getByText((1200).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText("0.5%")).toBeInTheDocument();
    expect(screen.getByText("99.95%")).toBeInTheDocument();
  });

  it("renders error message when no data", () => {
    mockUseGatewayHealth.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderWithProviders(<GatewayHealth gatewayId="gw-1" />);

    expect(screen.getByText("Unable to fetch health data")).toBeInTheDocument();
  });

  it("displays healthy status badge", () => {
    mockUseGatewayHealth.mockReturnValue({
      data: {
        gatewayId: "gw-1",
        status: "healthy",
        latency: 45,
        requestsPerSecond: 1200,
        errorRate: 0.5,
        cpuUsage: 65,
        memoryUsage: 72,
        uptime: 99.95,
        lastCheck: "2024-01-15T10:30:00Z",
      },
      isLoading: false,
    });

    renderWithProviders(<GatewayHealth gatewayId="gw-1" />);

    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("displays degraded status badge", () => {
    mockUseGatewayHealth.mockReturnValue({
      data: {
        gatewayId: "gw-1",
        status: "degraded",
        latency: 150,
        requestsPerSecond: 800,
        errorRate: 5.2,
        cpuUsage: 90,
        memoryUsage: 85,
        uptime: 98.5,
        lastCheck: "2024-01-15T10:30:00Z",
      },
      isLoading: false,
    });

    renderWithProviders(<GatewayHealth gatewayId="gw-1" />);

    expect(screen.getByText("degraded")).toBeInTheDocument();
  });
});
