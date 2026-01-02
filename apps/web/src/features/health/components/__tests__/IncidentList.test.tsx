import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/utils";
import { IncidentList } from "../IncidentList";
import { QueryClient } from "@tanstack/react-query";
import * as healthApi from "../../api/health";
import type { Incident } from "../../types";

// Mock the health API
vi.mock("../../api/health", () => ({
  healthApi: {
    getIncidents: vi.fn(),
  },
}));

const mockIncidents: Incident[] = [
  {
    id: "1",
    serviceId: "1",
    title: "Database Connection Issues",
    severity: "high",
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    description: "Connection pool exhausted",
    affectedUsers: 150,
  },
  {
    id: "2",
    serviceId: "2",
    title: "API Rate Limiting",
    severity: "medium",
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    resolvedAt: new Date(Date.now() - 3600000).toISOString(),
    description: "Increased rate limiting errors",
    affectedUsers: 50,
  },
  {
    id: "3",
    serviceId: "3",
    title: "Minor Performance Degradation",
    severity: "low",
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 82800000).toISOString(),
    description: "Slow query performance",
    affectedUsers: 10,
  },
];

describe("IncidentList", () => {
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
    it("should render loading state", () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { container } = renderWithProviders(<IncidentList />, {
        queryClient,
      });

      // Check for skeleton loading elements instead of text
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should render error state", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockRejectedValue(
        new Error("Failed to fetch")
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load incidents")
        ).toBeInTheDocument();
      });
    });

    it("should render empty state when no incidents", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([]);

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("No incidents reported")).toBeInTheDocument();
        expect(
          screen.getByText("All systems operating normally")
        ).toBeInTheDocument();
      });
    });

    it("should render incidents list", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Database Connection Issues")
        ).toBeInTheDocument();
        expect(screen.getByText("API Rate Limiting")).toBeInTheDocument();
        expect(
          screen.getByText("Minor Performance Degradation")
        ).toBeInTheDocument();
      });
    });
  });

  describe("active incidents", () => {
    it("should show count of active incidents", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("1 active incident")).toBeInTheDocument();
      });
    });

    it("should show plural form for multiple active incidents", async () => {
      const baseIncident = mockIncidents[0]!;
      const multipleActive: Incident[] = [
        { ...baseIncident, id: "1a" },
        { ...baseIncident, id: "1b" },
      ];
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        multipleActive
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("2 active incidents")).toBeInTheDocument();
      });
    });

    it("should highlight active incidents", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      const { container } = renderWithProviders(<IncidentList />, {
        queryClient,
      });

      await waitFor(() => {
        const activeIncident = container.querySelector(
          ".border-orange-500\\/20"
        );
        expect(activeIncident).toBeInTheDocument();
      });
    });

    it("should show Active badge for ongoing incidents", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Active")).toBeInTheDocument();
      });
    });
  });

  describe("severity badges", () => {
    it("should render severity badges correctly", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("High")).toBeInTheDocument();
        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("Low")).toBeInTheDocument();
      });
    });

    it("should apply correct colors to severity badges", async () => {
      const baseIncident = mockIncidents[0]!;
      const criticalIncident: Incident = {
        id: "critical-1",
        serviceId: baseIncident.serviceId,
        title: baseIncident.title,
        severity: "critical",
        startedAt: baseIncident.startedAt,
        description: baseIncident.description,
        affectedUsers: baseIncident.affectedUsers,
      };
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue([
        criticalIncident,
      ]);

      renderWithProviders(<IncidentList />, {
        queryClient,
      });

      await waitFor(() => {
        const criticalBadge = screen.getByText("Critical");
        expect(criticalBadge).toHaveClass("text-red-700");
      });
    });
  });

  describe("incident details", () => {
    it("should display affected users count", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("150 users affected")).toBeInTheDocument();
      });
    });

    it("should display incident description", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Connection pool exhausted")
        ).toBeInTheDocument();
      });
    });

    it("should display relative start time", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        const startedElements = screen.getAllByText(/Started.*ago/);
        expect(startedElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("resolved incidents", () => {
    it("should show resolved status", async () => {
      const resolvedIncident = mockIncidents[1];
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        resolvedIncident ? [resolvedIncident] : []
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        const resolvedElements = screen.getAllByText(/Resolved/);
        expect(resolvedElements.length).toBeGreaterThan(0);
      });
    });

    it("should display resolution time", async () => {
      const resolvedIncident = mockIncidents[1];
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        resolvedIncident ? [resolvedIncident] : []
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/Resolved at/)).toBeInTheDocument();
      });
    });

    it("should show check circle icon for resolved incidents", async () => {
      const resolvedIncident = mockIncidents[1];
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        resolvedIncident ? [resolvedIncident] : []
      );

      const { container } = renderWithProviders(<IncidentList />, {
        queryClient,
      });

      await waitFor(() => {
        const checkIcon = container.querySelector(".text-green-500");
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe("maxItems prop", () => {
    it("should limit displayed incidents when maxItems is set", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList maxItems={2} />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Database Connection Issues")
        ).toBeInTheDocument();
        expect(screen.getByText("API Rate Limiting")).toBeInTheDocument();
        expect(
          screen.queryByText("Minor Performance Degradation")
        ).not.toBeInTheDocument();
      });
    });

    it("should show all incidents when maxItems is not set", async () => {
      vi.mocked(healthApi.healthApi.getIncidents).mockResolvedValue(
        mockIncidents
      );

      renderWithProviders(<IncidentList />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Database Connection Issues")
        ).toBeInTheDocument();
        expect(screen.getByText("API Rate Limiting")).toBeInTheDocument();
        expect(
          screen.getByText("Minor Performance Degradation")
        ).toBeInTheDocument();
      });
    });
  });
});
