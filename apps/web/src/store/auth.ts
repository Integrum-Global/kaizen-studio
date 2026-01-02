import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AuthTokens, OrganizationMembership } from "../types/auth";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  // Multi-organization support
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setPermissions: (permissions: string[]) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
  setHasHydrated: (hydrated: boolean) => void;

  // Multi-organization actions
  setOrganizations: (organizations: OrganizationMembership[]) => void;
  setActiveOrganization: (organization: OrganizationMembership) => void;
  switchOrganization: (organization: OrganizationMembership, tokens: AuthTokens) => void;
}

/**
 * Check if actual tokens exist in localStorage
 * This prevents stale persisted state from causing auth loops
 */
function hasValidTokens(): boolean {
  const accessToken = localStorage.getItem("access_token");
  return !!accessToken && accessToken.length > 0;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      // Multi-organization state
      organizations: [],
      activeOrganization: null,

      setUser: (user: User) => set({ user }),

      setTokens: (tokens: AuthTokens) => {
        // Also save to localStorage for axios interceptor
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        set({ tokens });
      },

      setPermissions: (permissions: string[]) => set({ permissions }),

      login: (user: User, tokens: AuthTokens) => {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({
          user: null,
          tokens: null,
          permissions: [],
          isAuthenticated: false,
          isLoading: false,
          organizations: [],
          activeOrganization: null,
        });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      // Multi-organization actions
      setOrganizations: (organizations: OrganizationMembership[]) => {
        const activeOrg = organizations.find((org) => org.is_primary) || organizations[0] || null;
        set({ organizations, activeOrganization: activeOrg });
      },

      setActiveOrganization: (organization: OrganizationMembership) => {
        set({ activeOrganization: organization });
      },

      switchOrganization: (organization: OrganizationMembership, tokens: AuthTokens) => {
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        set({
          tokens,
          activeOrganization: organization,
        });
      },
    }),
    {
      name: "kaizen-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
        _hasHydrated: state._hasHydrated,
        organizations: state.organizations,
        activeOrganization: state.activeOrganization,
      }),
      // Custom merge function to validate auth state on hydration
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;

        // If persisted state says authenticated but no actual tokens exist,
        // don't restore the authenticated state - this prevents loops
        if (persisted?.isAuthenticated && !hasValidTokens()) {
          return {
            ...currentState,
            // Don't restore authenticated state - use defaults
            user: null,
            tokens: null,
            permissions: [],
            isAuthenticated: false,
          };
        }

        // Normal merge - restore persisted state
        return {
          ...currentState,
          ...persisted,
        };
      },
      onRehydrateStorage: () => {
        // Return the callback to run after hydration completes
        return (state, error) => {
          if (error) {
            console.error("[Auth Store] Hydration error:", error);
          }

          // IMPORTANT: Validate tokens after hydration
          // If isAuthenticated but no valid tokens, force logout
          // This catches cases where the merge function didn't block the state
          if (state?.isAuthenticated && !hasValidTokens()) {
            // Clear the auth state since we don't have valid tokens
            state.logout();
          }

          // Mark hydration as complete
          state?.setHasHydrated(true);
        };
      },
    }
  )
);

export default useAuthStore;
