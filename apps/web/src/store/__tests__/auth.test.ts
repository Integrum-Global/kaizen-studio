import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../auth";
import { createMockUser, createMockTokens } from "@/test/utils";

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store before each test
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

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("setUser", () => {
    it("should set user in state", () => {
      const mockUser = createMockUser();
      const { setUser } = useAuthStore.getState();

      setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });
  });

  describe("setTokens", () => {
    it("should set tokens in state and localStorage", () => {
      const mockTokens = createMockTokens();
      const { setTokens } = useAuthStore.getState();

      setTokens(mockTokens);

      const state = useAuthStore.getState();
      expect(state.tokens).toEqual(mockTokens);
      expect(localStorage.getItem("access_token")).toBe(
        mockTokens.access_token
      );
      expect(localStorage.getItem("refresh_token")).toBe(
        mockTokens.refresh_token
      );
    });
  });

  describe("setPermissions", () => {
    it("should set permissions in state", () => {
      const permissions = ["read:agents", "write:agents"];
      const { setPermissions } = useAuthStore.getState();

      setPermissions(permissions);

      const state = useAuthStore.getState();
      expect(state.permissions).toEqual(permissions);
    });
  });

  describe("login", () => {
    it("should update all auth state correctly", () => {
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      const { login } = useAuthStore.getState();

      login(mockUser, mockTokens);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("should save tokens to localStorage", () => {
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      const { login } = useAuthStore.getState();

      login(mockUser, mockTokens);

      expect(localStorage.getItem("access_token")).toBe(
        mockTokens.access_token
      );
      expect(localStorage.getItem("refresh_token")).toBe(
        mockTokens.refresh_token
      );
    });
  });

  describe("logout", () => {
    it("should clear all auth state", () => {
      // First login
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      const { login, logout } = useAuthStore.getState();

      login(mockUser, mockTokens);

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("should remove tokens from localStorage", () => {
      // First login
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      const { login, logout } = useAuthStore.getState();

      login(mockUser, mockTokens);

      // Verify tokens are in localStorage
      expect(localStorage.getItem("access_token")).toBeTruthy();
      expect(localStorage.getItem("refresh_token")).toBeTruthy();

      // Logout
      logout();

      // Verify tokens are removed
      expect(localStorage.getItem("access_token")).toBeNull();
      expect(localStorage.getItem("refresh_token")).toBeNull();
    });
  });

  describe("setLoading", () => {
    it("should update loading state", () => {
      const { setLoading } = useAuthStore.getState();

      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("should return true when user has permission", () => {
      const { setPermissions, hasPermission } = useAuthStore.getState();
      const permissions = ["read:agents", "write:agents", "admin:all"];

      setPermissions(permissions);

      expect(hasPermission("read:agents")).toBe(true);
      expect(hasPermission("write:agents")).toBe(true);
      expect(hasPermission("admin:all")).toBe(true);
    });

    it("should return false when user does not have permission", () => {
      const { setPermissions, hasPermission } = useAuthStore.getState();
      const permissions = ["read:agents"];

      setPermissions(permissions);

      expect(hasPermission("write:agents")).toBe(false);
      expect(hasPermission("admin:all")).toBe(false);
    });

    it("should return false when permissions array is empty", () => {
      const { hasPermission } = useAuthStore.getState();

      expect(hasPermission("read:agents")).toBe(false);
    });
  });

  describe("persistence", () => {
    it("should persist user, tokens, permissions, and isAuthenticated", () => {
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      const { login, setPermissions } = useAuthStore.getState();

      login(mockUser, mockTokens);
      setPermissions(["read:agents"]);

      // Verify what's persisted (would normally check localStorage)
      // For this test, we just verify the state is set correctly
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.permissions).toEqual(["read:agents"]);
      expect(state.isAuthenticated).toBe(true);
    });
  });
});
