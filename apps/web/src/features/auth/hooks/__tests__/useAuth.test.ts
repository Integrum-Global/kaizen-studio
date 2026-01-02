import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useLogin,
  useLogout,
  useHasPermission,
  useCurrentUser,
  usePermissions,
} from "../useAuth";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";
import {
  createMockUser,
  createMockTokens,
  createTestQueryClient,
} from "@/test/utils";

// Mock the auth API
vi.mock("@/api/auth", () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getPermissions: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("Auth Hooks", () => {
  let queryClient: QueryClient;

  function wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children });
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();

    // Reset auth store
    useAuthStore.setState({
      user: null,
      tokens: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });

    // Clear localStorage
    localStorage.clear();
  });

  describe("useLogin", () => {
    it("should call login API and update store on success", async () => {
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      const loginResponse = { user: mockUser, tokens: mockTokens };

      vi.mocked(authApi.login).mockResolvedValue(loginResponse);

      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate({
        email: "test@example.com",
        password: "password123",
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      // Check store was updated
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isAuthenticated).toBe(true);
    });

    it("should handle login error", async () => {
      const error = new Error("Invalid credentials");
      vi.mocked(authApi.login).mockRejectedValue(error);

      const { result } = renderHook(() => useLogin(), { wrapper });

      result.current.mutate({
        email: "test@example.com",
        password: "wrongpassword",
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);

      // Store should not be updated
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("useLogout", () => {
    it("should call logout API and clear store", async () => {
      // Setup authenticated state
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      useAuthStore.getState().login(mockUser, mockTokens);

      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useLogout(), { wrapper });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authApi.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/login");

      // Check store was cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should clear store even if API call fails", async () => {
      // Setup authenticated state
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      useAuthStore.getState().login(mockUser, mockTokens);

      vi.mocked(authApi.logout).mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() => useLogout(), { wrapper });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Store should still be cleared
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("useCurrentUser", () => {
    it("should fetch current user when authenticated", async () => {
      const mockUser = createMockUser();

      // Mock location to be a non-auth page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true
      });

      // Set authenticated state with hydration flag
      useAuthStore.setState({ isAuthenticated: true, _hasHydrated: true });

      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authApi.getCurrentUser).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockUser);
    });

    it("should not fetch when not authenticated", () => {
      useAuthStore.setState({ isAuthenticated: false, _hasHydrated: true });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      expect(authApi.getCurrentUser).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("usePermissions", () => {
    it("should fetch permissions when authenticated", async () => {
      const mockPermissions = ["read:agents", "write:agents", "admin:all"];

      // Mock location to be a non-auth page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true
      });

      // Set authenticated state with hydration flag
      useAuthStore.setState({ isAuthenticated: true, _hasHydrated: true });

      vi.mocked(authApi.getPermissions).mockResolvedValue(mockPermissions);

      const { result } = renderHook(() => usePermissions(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authApi.getPermissions).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockPermissions);
    });

    it("should not fetch when not authenticated", () => {
      useAuthStore.setState({ isAuthenticated: false, _hasHydrated: true });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(authApi.getPermissions).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useHasPermission", () => {
    it("should return true when user has permission", async () => {
      const mockPermissions = ["read:agents", "write:agents", "admin:all"];

      // Mock location to be a non-auth page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true
      });

      useAuthStore.setState({ isAuthenticated: true, _hasHydrated: true });
      vi.mocked(authApi.getPermissions).mockResolvedValue(mockPermissions);

      const { result } = renderHook(() => useHasPermission("read:agents"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should return false when user does not have permission", async () => {
      const mockPermissions = ["read:agents"];

      // Mock location to be a non-auth page
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true
      });

      useAuthStore.setState({ isAuthenticated: true, _hasHydrated: true });
      vi.mocked(authApi.getPermissions).mockResolvedValue(mockPermissions);

      const { result } = renderHook(() => useHasPermission("admin:all"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it("should return false when not authenticated", () => {
      useAuthStore.setState({ isAuthenticated: false, _hasHydrated: true });

      const { result } = renderHook(() => useHasPermission("read:agents"), {
        wrapper,
      });

      expect(result.current).toBe(false);
    });
  });
});
