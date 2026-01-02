import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test/utils";
import { HealthDashboard } from "../HealthDashboard";
import { QueryClient } from "@tanstack/react-query";
import * as healthApi from "../../api/health";
import type { SystemHealth } from "../../types";

// Mock the health API
vi.mock("../../api/health", () => ({
  healthApi: {
    getSystemHealth: vi.fn(),
    getAllServices: vi.fn(),
    getIncidents: vi.fn(),
  },
}));

const mockSystemHealth: SystemHealth = {
  overallStatus: "healthy",
  totalServices: 6,
  healthyServices: 4,
  degradedServices: 1,
  downServices: 1,
  averageLatency: 52,
  averageUptime: 98.5,
  lastUpdated: new Date().toISOString(),
};

describe("HealthDashboard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render header with title", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<HealthDashboard />, { queryClient });

      expect(screen.getByText("System Health")).toBeInTheDocument();
      expect(
        screen.getByText("Monitor service status and performance")
      ).toBeInTheDocument();
    });

    it("should render refresh button", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<HealthDashboard />, { queryClient });

      expect(
        screen.getByRole("button", { name: /refresh/i })
      ).toBeInTheDocument();
    });

    it("should render loading state initially", () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(healthApi.healthApi.getAllServices).mockImplementation(
        () => new Promise(() => {})
      );
      vi.mocked(healthApi.healthApi.getIncidents).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      // Skeleton loaders should be present
      const skeletons = screen.getAllByRole("generic");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render error state for system health", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockRejectedValue(
        new Error("Failed to fetch")
      );
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load system health")
        ).toBeInTheDocument();
      });
    });
  });

  describe("system overview", () => {
    beforeEach(() => {
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should display overall status", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Overall Status")).toBeInTheDocument();
        expect(screen.getByText("healthy")).toBeInTheDocument();
      });
    });

    it("should display total services count", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Total Services")).toBeInTheDocument();
        expect(screen.getByText("6")).toBeInTheDocument();
      });
    });

    it("should display service breakdown", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("4 healthy")).toBeInTheDocument();
        expect(screen.getByText("1 degraded")).toBeInTheDocument();
        expect(screen.getByText("1 down")).toBeInTheDocument();
      });
    });

    it("should display average latency", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Avg Latency")).toBeInTheDocument();
        expect(screen.getByText("52")).toBeInTheDocument();
        expect(screen.getByText("ms")).toBeInTheDocument();
      });
    });

    it("should display average uptime", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Avg Uptime")).toBeInTheDocument();
        expect(screen.getByText("98.5")).toBeInTheDocument();
        expect(screen.getByText("%")).toBeInTheDocument();
      });
    });

    it("should display last updated time", async () => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Last Updated")).toBeInTheDocument();
      });
    });
  });

  describe("performance descriptions", () => {
    beforeEach(() => {
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should show excellent performance for low latency", async () => {
      const excellentHealth = { ...mockSystemHealth, averageLatency: 45 };
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        excellentHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Excellent performance")).toBeInTheDocument();
      });
    });

    it("should show good performance for moderate latency", async () => {
      const goodHealth = { ...mockSystemHealth, averageLatency: 75 };
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        goodHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Good performance")).toBeInTheDocument();
      });
    });

    it("should show exceptional reliability for high uptime", async () => {
      const highUptime = { ...mockSystemHealth, averageUptime: 99.95 };
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        highUptime
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Exceptional reliability")).toBeInTheDocument();
      });
    });

    it("should show high reliability for good uptime", async () => {
      const goodUptime = { ...mockSystemHealth, averageUptime: 99.5 };
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        goodUptime
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("High reliability")).toBeInTheDocument();
      });
    });
  });

  describe("interactions", () => {
    beforeEach(() => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should refresh data when refresh button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("System Health")).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      await user.click(refreshButton);

      // API should be called again
      await waitFor(() => {
        expect(healthApi.healthApi.getSystemHealth).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("layout", () => {
    beforeEach(() => {
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        mockSystemHealth
      );
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should render service list", async () => {
      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        // ServiceList component renders search input
        expect(
          screen.getByPlaceholderText("Search services...")
        ).toBeInTheDocument();
      });
    });

    it("should render incidents sidebar", async () => {
      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Recent Incidents")).toBeInTheDocument();
      });
    });
  });

  describe("status variants", () => {
    beforeEach(() => {
      vi.mocked(healthApi.healthApi.getAllServices).mockResolvedValue([]);
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should display degraded overall status", async () => {
      const degradedHealth = {
        ...mockSystemHealth,
        overallStatus: "degraded" as const,
      };
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        degradedHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("degraded")).toBeInTheDocument();
      });
    });

    it("should display down overall status", async () => {
      const downHealth = {
        ...mockSystemHealth,
        overallStatus: "down" as const,
      };
      vi.mocked(healthApi.healthApi.getSystemHealth).mockResolvedValue(
        downHealth
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("down")).toBeInTheDocument();
      });
    });
  });
});
