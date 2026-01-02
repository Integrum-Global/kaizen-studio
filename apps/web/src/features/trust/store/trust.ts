/**
 * Trust Store (Zustand)
 *
 * Global state management for trust-related UI state
 */

import { create } from "zustand";
import type {
  TrustChain,
  VerificationResult,
  TrustStatus,
  TrustDashboardStats,
} from "../types";

interface TrustState {
  // Selected trust chain for detail view
  selectedChain: TrustChain | null;
  setSelectedChain: (chain: TrustChain | null) => void;

  // Trust chains cache
  trustChains: TrustChain[];
  addTrustChain: (chain: TrustChain) => void;
  removeTrustChain: (agentId: string) => void;
  setTrustChains: (chains: TrustChain[]) => void;

  // Recent verification results
  recentVerifications: VerificationResult[];
  addVerification: (result: VerificationResult) => void;
  clearVerifications: () => void;

  // Dashboard stats cache
  dashboardStats: TrustDashboardStats | null;
  setDashboardStats: (stats: TrustDashboardStats) => void;

  // Filter/search state
  filters: {
    status: TrustStatus | "all";
    searchQuery: string;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  setFilters: (filters: Partial<TrustState["filters"]>) => void;
  resetFilters: () => void;

  // UI state
  ui: {
    sidebarOpen: boolean;
    verificationPanelOpen: boolean;
    selectedTab: "chains" | "audit" | "delegations" | "compliance";
  };
  setSidebarOpen: (open: boolean) => void;
  setVerificationPanelOpen: (open: boolean) => void;
  setSelectedTab: (tab: TrustState["ui"]["selectedTab"]) => void;
}

const defaultFilters: TrustState["filters"] = {
  status: "all",
  searchQuery: "",
  dateRange: {
    start: null,
    end: null,
  },
};

const defaultUI: TrustState["ui"] = {
  sidebarOpen: true,
  verificationPanelOpen: false,
  selectedTab: "chains",
};

export const useTrustStore = create<TrustState>((set) => ({
  // Selected chain
  selectedChain: null,
  setSelectedChain: (chain) => set({ selectedChain: chain }),

  // Trust chains cache
  trustChains: [],
  addTrustChain: (chain) =>
    set((state) => ({
      trustChains: [chain, ...state.trustChains],
    })),
  removeTrustChain: (agentId) =>
    set((state) => ({
      trustChains: state.trustChains.filter(
        (c) => c.genesis.agent_id !== agentId
      ),
    })),
  setTrustChains: (chains) => set({ trustChains: chains }),

  // Recent verifications
  recentVerifications: [],
  addVerification: (result) =>
    set((state) => ({
      recentVerifications: [result, ...state.recentVerifications].slice(0, 50),
    })),
  clearVerifications: () => set({ recentVerifications: [] }),

  // Dashboard stats
  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  // Filters
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),

  // UI state
  ui: defaultUI,
  setSidebarOpen: (open) =>
    set((state) => ({
      ui: { ...state.ui, sidebarOpen: open },
    })),
  setVerificationPanelOpen: (open) =>
    set((state) => ({
      ui: { ...state.ui, verificationPanelOpen: open },
    })),
  setSelectedTab: (tab) =>
    set((state) => ({
      ui: { ...state.ui, selectedTab: tab },
    })),
}));
