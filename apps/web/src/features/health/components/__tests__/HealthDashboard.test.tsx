import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test/utils";
import { HealthDashboard } from "../HealthDashboard";
import { QueryClient } from "@tanstack/react-query";
import { healthApi } from "../../api/health";
import type { SystemHealth, ServiceStatus, Incident } from "../../types";

// Mock the health API
vi.mock("../../api/health", () => {
  const mockApi = {
    getSystemHealth: vi.fn(),
    getIncidents: vi.fn(),
    exportReport: vi.fn(),
  };
  return {
    healthApi: mockApi,
    default: mockApi,
  };
});

// Mock data matching the actual component structure
const mockServices: ServiceStatus[] = [
  {
    id: "1",
    name: "API Gateway",
    status: "healthy",
    uptime: 99.9,
    latency: 45,
    lastCheck: new Date().toISOString(),
    description: "Main API gateway",
  },
  {
    id: "2",
    name: "Database",
    status: "healthy",
    uptime: 99.8,
    latency: 12,
    lastCheck: new Date().toISOString(),
    description: "Primary database",
  },
  {
    id: "3",
    name: "Cache",
    status: "degraded",
    uptime: 98.5,
    latency: 85,
    lastCheck: new Date().toISOString(),
    description: "Redis cache",
  },
];

const mockIncidents: Incident[] = [
  {
    id: "1",
    title: "Database slowdown",
    severity: "medium",
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    description: "Increased query latency",
    affectedServices: ["Database"],
  },
];

const mockSystemHealth: SystemHealth = {
  status: "healthy",
  overallStatus: "healthy",
  totalServices: 3,
  healthyServices: 2,
  degradedServices: 1,
  downServices: 0,
  averageLatency: 47,
  averageUptime: 99.4,
  lastUpdated: new Date().toISOString(),
  services: mockServices,
  metrics: {
    responseTime: { avg: 47, p95: 120, p99: 200 },
    errorRate: 0.1,
    requestCount: 10000,
    cpu: 45,
    memory: 62,
  },
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
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<HealthDashboard />, { queryClient });

      expect(screen.getByText("System Health Status")).toBeInTheDocument();
      expect(
        screen.getByText("Monitor system health and service availability")
      ).toBeInTheDocument();
    });

    it("should render refresh button", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<HealthDashboard />, { queryClient });

      expect(
        screen.getByRole("button", { name: /refresh/i })
      ).toBeInTheDocument();
    });

    it("should render loading state initially", () => {
      vi.mocked(healthApi.getSystemHealth).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(healthApi.getIncidents).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(<HealthDashboard />, { queryClient });

      // Skeleton loaders should be present
      const skeletons = screen.getAllByRole("generic");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render error state for system health", async () => {
      vi.mocked(healthApi.getSystemHealth).mockRejectedValue(
        new Error("Failed to fetch")
      );
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load health data/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("system overview", () => {
    beforeEach(() => {
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should display overall status section", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Overall Status")).toBeInTheDocument();
      });
    });

    it("should display status as healthy", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/System is currently healthy/i)).toBeInTheDocument();
      });
    });

    it("should display services section header", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Services")).toBeInTheDocument();
      });
    });

    it("should display service cards when services exist", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("API Gateway")).toBeInTheDocument();
        expect(screen.getByText("Database")).toBeInTheDocument();
        expect(screen.getByText("Cache")).toBeInTheDocument();
      });
    });

    it("should display last updated time", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
      });
    });

    it("should display auto-refresh toggle", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Auto Refresh")).toBeInTheDocument();
      });
    });
  });

  describe("export functionality", () => {
    beforeEach(() => {
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should display export button", async () => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /export/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("interactions", () => {
    beforeEach(() => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should refresh data when refresh button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("System Health Status")).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      await user.click(refreshButton);

      // API should be called again
      await waitFor(() => {
        expect(healthApi.getSystemHealth).toHaveBeenCalledTimes(2);
      });
    });

    it("should toggle auto-refresh when switch is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Auto Refresh")).toBeInTheDocument();
      });

      const toggle = screen.getByRole("switch", { name: /auto-refresh/i });
      await user.click(toggle);

      await waitFor(() => {
        expect(toggle).toBeChecked();
      });
    });
  });

  describe("incidents timeline", () => {
    beforeEach(() => {
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(mockSystemHealth);
    });

    it("should render incident timeline component", async () => {
      vi.mocked(healthApi.getIncidents).mockResolvedValue(mockIncidents);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        // IncidentTimeline renders the incidents
        expect(screen.getByText("Database slowdown")).toBeInTheDocument();
      });
    });

    it("should handle empty incidents", async () => {
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<HealthDashboard />, { queryClient });

      // Should not crash with empty incidents
      await waitFor(() => {
        expect(screen.getByText("System Health Status")).toBeInTheDocument();
      });
    });
  });

  describe("status variants", () => {
    beforeEach(() => {
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should display degraded overall status", async () => {
      const degradedHealth: SystemHealth = {
        ...mockSystemHealth,
        status: "degraded",
        overallStatus: "degraded",
      };
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(degradedHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/System is currently degraded/i)).toBeInTheDocument();
      });
    });

    it("should display down overall status", async () => {
      const downHealth: SystemHealth = {
        ...mockSystemHealth,
        status: "down",
        overallStatus: "down",
      };
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(downHealth);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/System is currently down/i)).toBeInTheDocument();
      });
    });
  });

  describe("dependencies section", () => {
    beforeEach(() => {
      vi.mocked(healthApi.getIncidents).mockResolvedValue([]);
    });

    it("should display dependencies when present", async () => {
      const healthWithDependencies: SystemHealth = {
        ...mockSystemHealth,
        dependencies: [
          {
            name: "External API",
            type: "external",
            status: "healthy",
            lastCheck: new Date().toISOString(),
          },
        ],
      };
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(healthWithDependencies);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Dependencies")).toBeInTheDocument();
        expect(screen.getByText("External API")).toBeInTheDocument();
      });
    });

    it("should not display dependencies section when empty", async () => {
      const healthWithoutDependencies: SystemHealth = {
        ...mockSystemHealth,
        dependencies: [],
      };
      vi.mocked(healthApi.getSystemHealth).mockResolvedValue(healthWithoutDependencies);

      renderWithProviders(<HealthDashboard />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Services")).toBeInTheDocument();
      });

      // Dependencies section should not be present
      expect(screen.queryByText("Dependencies")).not.toBeInTheDocument();
    });
  });
});
