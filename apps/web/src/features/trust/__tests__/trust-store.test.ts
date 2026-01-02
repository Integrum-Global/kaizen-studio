/**
 * Trust Store Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useTrustStore } from "../store/trust";
import {
  createMockTrustChain,
  createMockVerificationResult,
  createMockTrustDashboardStats,
} from "./fixtures";
import { TrustStatus } from "../types";

describe("useTrustStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    act(() => {
      useTrustStore.setState({
        selectedChain: null,
        recentVerifications: [],
        dashboardStats: null,
        filters: {
          status: "all",
          searchQuery: "",
          dateRange: {
            start: null,
            end: null,
          },
        },
        ui: {
          sidebarOpen: true,
          verificationPanelOpen: false,
          selectedTab: "chains",
        },
      });
    });
  });

  describe("Initial state", () => {
    it("should have null selectedChain initially", () => {
      const { selectedChain } = useTrustStore.getState();
      expect(selectedChain).toBeNull();
    });

    it("should have empty recentVerifications initially", () => {
      const { recentVerifications } = useTrustStore.getState();
      expect(recentVerifications).toEqual([]);
    });

    it("should have null dashboardStats initially", () => {
      const { dashboardStats } = useTrustStore.getState();
      expect(dashboardStats).toBeNull();
    });

    it("should have default filters", () => {
      const { filters } = useTrustStore.getState();
      expect(filters).toEqual({
        status: "all",
        searchQuery: "",
        dateRange: {
          start: null,
          end: null,
        },
      });
    });

    it("should have default UI state", () => {
      const { ui } = useTrustStore.getState();
      expect(ui).toEqual({
        sidebarOpen: true,
        verificationPanelOpen: false,
        selectedTab: "chains",
      });
    });
  });

  describe("setSelectedTrustChain", () => {
    it("should set selected trust chain", () => {
      const mockChain = createMockTrustChain();

      act(() => {
        useTrustStore.getState().setSelectedChain(mockChain);
      });

      const { selectedChain } = useTrustStore.getState();
      expect(selectedChain).toEqual(mockChain);
    });

    it("should allow setting to null", () => {
      const mockChain = createMockTrustChain();

      act(() => {
        useTrustStore.getState().setSelectedChain(mockChain);
      });

      expect(useTrustStore.getState().selectedChain).toEqual(mockChain);

      act(() => {
        useTrustStore.getState().setSelectedChain(null);
      });

      expect(useTrustStore.getState().selectedChain).toBeNull();
    });
  });

  describe("addVerificationResult", () => {
    it("should add verification result to the list", () => {
      const mockResult = createMockVerificationResult();

      act(() => {
        useTrustStore.getState().addVerification(mockResult);
      });

      const { recentVerifications } = useTrustStore.getState();
      expect(recentVerifications).toHaveLength(1);
      expect(recentVerifications[0]).toEqual(mockResult);
    });

    it("should add new results to the beginning", () => {
      const result1 = createMockVerificationResult();
      const result2 = createMockVerificationResult({
        capability_used: "write_data",
      });

      act(() => {
        useTrustStore.getState().addVerification(result1);
        useTrustStore.getState().addVerification(result2);
      });

      const { recentVerifications } = useTrustStore.getState();
      expect(recentVerifications[0]).toEqual(result2);
      expect(recentVerifications[1]).toEqual(result1);
    });

    it("should limit to 50 verification results", () => {
      act(() => {
        for (let i = 0; i < 60; i++) {
          useTrustStore
            .getState()
            .addVerification(
              createMockVerificationResult({ capability_used: `cap-${i}` })
            );
        }
      });

      const { recentVerifications } = useTrustStore.getState();
      expect(recentVerifications).toHaveLength(50);
    });
  });

  describe("clearVerifications", () => {
    it("should clear all verification results", () => {
      act(() => {
        useTrustStore
          .getState()
          .addVerification(createMockVerificationResult());
        useTrustStore
          .getState()
          .addVerification(createMockVerificationResult());
      });

      expect(useTrustStore.getState().recentVerifications).toHaveLength(2);

      act(() => {
        useTrustStore.getState().clearVerifications();
      });

      expect(useTrustStore.getState().recentVerifications).toEqual([]);
    });
  });

  describe("updateDashboardStats", () => {
    it("should update dashboard stats", () => {
      const mockStats = createMockTrustDashboardStats();

      act(() => {
        useTrustStore.getState().setDashboardStats(mockStats);
      });

      const { dashboardStats } = useTrustStore.getState();
      expect(dashboardStats).toEqual(mockStats);
    });

    it("should replace existing stats", () => {
      const stats1 = createMockTrustDashboardStats({ active_agents: 100 });
      const stats2 = createMockTrustDashboardStats({ active_agents: 200 });

      act(() => {
        useTrustStore.getState().setDashboardStats(stats1);
      });

      expect(useTrustStore.getState().dashboardStats?.active_agents).toBe(100);

      act(() => {
        useTrustStore.getState().setDashboardStats(stats2);
      });

      expect(useTrustStore.getState().dashboardStats?.active_agents).toBe(200);
    });
  });

  describe("Filter actions", () => {
    it("should set status filter", () => {
      act(() => {
        useTrustStore.getState().setFilters({ status: TrustStatus.VALID });
      });

      const { filters } = useTrustStore.getState();
      expect(filters.status).toBe(TrustStatus.VALID);
    });

    it("should set search query filter", () => {
      act(() => {
        useTrustStore.getState().setFilters({ searchQuery: "test-agent" });
      });

      const { filters } = useTrustStore.getState();
      expect(filters.searchQuery).toBe("test-agent");
    });

    it("should set date range filter", () => {
      const dateRange = {
        start: "2024-01-01T00:00:00Z",
        end: "2024-12-31T23:59:59Z",
      };

      act(() => {
        useTrustStore.getState().setFilters({ dateRange });
      });

      const { filters } = useTrustStore.getState();
      expect(filters.dateRange).toEqual(dateRange);
    });

    it("should merge filter updates", () => {
      act(() => {
        useTrustStore.getState().setFilters({ status: TrustStatus.VALID });
        useTrustStore.getState().setFilters({ searchQuery: "test-agent" });
      });

      const { filters } = useTrustStore.getState();
      expect(filters.status).toBe(TrustStatus.VALID);
      expect(filters.searchQuery).toBe("test-agent");
    });

    it("should reset all filters", () => {
      act(() => {
        useTrustStore.getState().setFilters({
          status: TrustStatus.VALID,
          searchQuery: "test-agent",
          dateRange: {
            start: "2024-01-01T00:00:00Z",
            end: "2024-12-31T23:59:59Z",
          },
        });
      });

      expect(useTrustStore.getState().filters.status).toBe(TrustStatus.VALID);

      act(() => {
        useTrustStore.getState().resetFilters();
      });

      const { filters } = useTrustStore.getState();
      expect(filters).toEqual({
        status: "all",
        searchQuery: "",
        dateRange: {
          start: null,
          end: null,
        },
      });
    });
  });

  describe("UI state toggles", () => {
    it("should toggle sidebar open state", () => {
      expect(useTrustStore.getState().ui.sidebarOpen).toBe(true);

      act(() => {
        useTrustStore.getState().setSidebarOpen(false);
      });

      expect(useTrustStore.getState().ui.sidebarOpen).toBe(false);

      act(() => {
        useTrustStore.getState().setSidebarOpen(true);
      });

      expect(useTrustStore.getState().ui.sidebarOpen).toBe(true);
    });

    it("should toggle verification panel open state", () => {
      expect(useTrustStore.getState().ui.verificationPanelOpen).toBe(false);

      act(() => {
        useTrustStore.getState().setVerificationPanelOpen(true);
      });

      expect(useTrustStore.getState().ui.verificationPanelOpen).toBe(true);

      act(() => {
        useTrustStore.getState().setVerificationPanelOpen(false);
      });

      expect(useTrustStore.getState().ui.verificationPanelOpen).toBe(false);
    });

    it("should change selected tab", () => {
      expect(useTrustStore.getState().ui.selectedTab).toBe("chains");

      act(() => {
        useTrustStore.getState().setSelectedTab("audit");
      });

      expect(useTrustStore.getState().ui.selectedTab).toBe("audit");

      act(() => {
        useTrustStore.getState().setSelectedTab("delegations");
      });

      expect(useTrustStore.getState().ui.selectedTab).toBe("delegations");

      act(() => {
        useTrustStore.getState().setSelectedTab("compliance");
      });

      expect(useTrustStore.getState().ui.selectedTab).toBe("compliance");
    });
  });

  describe("State persistence", () => {
    it("should maintain state across multiple actions", () => {
      const mockChain = createMockTrustChain();
      const mockVerification = createMockVerificationResult();
      const mockStats = createMockTrustDashboardStats();

      act(() => {
        useTrustStore.getState().setSelectedChain(mockChain);
        useTrustStore.getState().addVerification(mockVerification);
        useTrustStore.getState().setDashboardStats(mockStats);
        useTrustStore.getState().setFilters({ status: TrustStatus.VALID });
        useTrustStore.getState().setSidebarOpen(false);
      });

      const state = useTrustStore.getState();
      expect(state.selectedChain).toEqual(mockChain);
      expect(state.recentVerifications).toHaveLength(1);
      expect(state.dashboardStats).toEqual(mockStats);
      expect(state.filters.status).toBe(TrustStatus.VALID);
      expect(state.ui.sidebarOpen).toBe(false);
    });
  });
});
