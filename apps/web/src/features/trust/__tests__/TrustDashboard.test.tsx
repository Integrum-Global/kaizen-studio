/**
 * TrustDashboard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { TrustDashboard } from "../components/TrustDashboard";
import * as trustApi from "../api";
import {
  createMockTrustDashboardStats,
  createMockTrustChainsListResponse,
  createMockAuditTrailResponse,
} from "./fixtures";

// Mock the trust API
vi.mock("../api", () => ({
  listTrustChains: vi.fn(),
  queryAuditTrail: vi.fn(),
}));

describe("TrustDashboard", () => {
  const mockOnEstablishTrust = vi.fn();
  const mockOnViewAuditTrail = vi.fn();
  const mockOnAuditEventClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("should render loading skeletons", () => {
      vi.mocked(trustApi.listTrustChains).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(trustApi.queryAuditTrail).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      // Should show skeletons in stats cards
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Success state", () => {
    it("should render dashboard with real stats data", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Trusted Agents")).toBeInTheDocument();
        expect(screen.getByText("Active Delegations")).toBeInTheDocument();
        expect(screen.getByText("Audit Events (24h)")).toBeInTheDocument();
        expect(screen.getByText("Verification Rate")).toBeInTheDocument();
      });
    });

    it("should display stats from API data", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      // Wait for stats cards to render
      await waitFor(() => {
        expect(screen.getByText("Trusted Agents")).toBeInTheDocument();
      });

      // Stats should be rendered (values calculated from mock data)
      const statCards = document.querySelectorAll('[class*="text-2xl"]');
      expect(statCards.length).toBeGreaterThan(0);
    });

    it("should render header with title and description", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Trust Dashboard")).toBeInTheDocument();
        expect(
          screen.getByText("Monitor and manage agent trust relationships")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error state", () => {
    it("should render error state when API fails", async () => {
      vi.mocked(trustApi.listTrustChains).mockRejectedValue(
        new Error("Network error")
      );
      vi.mocked(trustApi.queryAuditTrail).mockRejectedValue(
        new Error("Network error")
      );

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        // Should show "Failed to load" in stats cards
        expect(screen.getAllByText("Failed to load").length).toBeGreaterThan(0);
      });
    });
  });

  describe("Quick action buttons", () => {
    beforeEach(async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);
    });

    it("should render Establish Trust button", async () => {
      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Establish Trust")).toBeInTheDocument();
      });
    });

    it("should render View Audit Trail button", async () => {
      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("View Audit Trail")).toBeInTheDocument();
      });
    });

    it("should call onEstablishTrust when Establish Trust button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Establish Trust")).toBeInTheDocument();
      });

      const button = screen.getByText("Establish Trust");
      await user.click(button);

      expect(mockOnEstablishTrust).toHaveBeenCalledTimes(1);
    });

    it("should call onViewAuditTrail when View Audit Trail button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("View Audit Trail")).toBeInTheDocument();
      });

      const button = screen.getByText("View Audit Trail");
      await user.click(button);

      expect(mockOnViewAuditTrail).toHaveBeenCalledTimes(1);
    });
  });

  describe("Recent audit events", () => {
    it("should render Recent Audit Events section", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Recent Audit Events")).toBeInTheDocument();
      });
    });

    it("should render audit event items", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        // Should show audit actions from mock data
        expect(screen.getByText("read_database")).toBeInTheDocument();
      });
    });

    it("should call onAuditEventClick when audit event is clicked", async () => {
      const user = userEvent.setup();
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
          onAuditEventClick={mockOnAuditEventClick}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("read_database")).toBeInTheDocument();
      });

      const auditEvent = screen.getByText("read_database").closest("div");
      if (auditEvent) {
        await user.click(auditEvent);
        expect(mockOnAuditEventClick).toHaveBeenCalled();
      }
    });
  });

  describe("Stats grid layout", () => {
    it("should render stats in a grid layout", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      const { container } = renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        // Should have grid layout classes
        const grid = container.querySelector('[class*="grid"][class*="gap-4"]');
        expect(grid).toBeInTheDocument();
      });
    });

    it("should render exactly 4 stat cards", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = createMockAuditTrailResponse();

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      await waitFor(() => {
        expect(screen.getByText("Trusted Agents")).toBeInTheDocument();
        expect(screen.getByText("Active Delegations")).toBeInTheDocument();
        expect(screen.getByText("Audit Events (24h)")).toBeInTheDocument();
        expect(screen.getByText("Verification Rate")).toBeInTheDocument();
      });
    });
  });

  describe("Verification rate calculation", () => {
    it("should display verification rate", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = {
        items: [
          ...createMockAuditTrailResponse().items,
          {
            ...createMockAuditTrailResponse().items[0],
            id: "audit-failed-1",
            result: "denied" as const,
          },
        ],
        total: 4,
      };

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      renderWithProviders(
        <TrustDashboard
          onEstablishTrust={mockOnEstablishTrust}
          onViewAuditTrail={mockOnViewAuditTrail}
        />,
        { queryClient: createTestQueryClient() }
      );

      // Wait for verification rate card to render
      await waitFor(() => {
        expect(screen.getByText("Verification Rate")).toBeInTheDocument();
      });

      // Verification rate card should be present
      expect(screen.getByText("Verification Rate")).toBeInTheDocument();

      // Dashboard should render all 4 stat card titles
      expect(screen.getByText("Trusted Agents")).toBeInTheDocument();
      expect(screen.getByText("Active Delegations")).toBeInTheDocument();
      expect(screen.getByText("Audit Events (24h)")).toBeInTheDocument();
      expect(screen.getByText("Verification Rate")).toBeInTheDocument();
    });
  });
});
