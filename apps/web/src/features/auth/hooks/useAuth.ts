import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../../api/auth";
import { useAuthStore } from "../../../store/auth";
import type { LoginRequest, RegisterRequest } from "../../../types/auth";
import { AxiosError } from "axios";

/**
 * Hook for login functionality
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { login: storeLogin } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      storeLogin(response.user, response.tokens);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Login error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook for registration functionality
 */
export function useRegister() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: storeLogin } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      storeLogin(response.user, response.tokens);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      navigate("/dashboard");
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Registration error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook for logout functionality
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout: storeLogout } = useAuthStore();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      storeLogout();
      queryClient.clear();
      navigate("/login");
    },
    onError: (error: AxiosError) => {
      // Even if API call fails, clear local state
      storeLogout();
      queryClient.clear();
      navigate("/login");
      console.error("Logout error:", error.message);
    },
  });
}

/**
 * Check if current path is a public auth page
 * Uses both window.location and checks for common auth paths
 */
function isOnAuthPage(): boolean {
  const pathname = window.location.pathname;
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/" // Root might redirect to login
  );
}

/**
 * Hook to get current user
 * Disabled on auth pages to prevent unnecessary API calls
 */
export function useCurrentUser() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authApi.getCurrentUser(),
    // Only fetch if:
    // 1. Store has hydrated from localStorage
    // 2. User is authenticated
    // 3. Not on an auth page
    enabled: _hasHydrated && isAuthenticated && !isOnAuthPage(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth queries - let interceptor handle 401s
  });
}

/**
 * Hook to get current user permissions
 * Disabled on auth pages to prevent unnecessary API calls
 */
export function usePermissions() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const permissions = await authApi.getPermissions();
      return permissions;
    },
    // Only fetch if:
    // 1. Store has hydrated from localStorage
    // 2. User is authenticated
    // 3. Not on an auth page
    enabled: _hasHydrated && isAuthenticated && !isOnAuthPage(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth queries - let interceptor handle 401s
  });
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  const { data: permissions = [] } = usePermissions();
  return permissions.includes(permission);
}

/**
 * Hook to gate content based on permission
 * Returns object with hasPermission boolean and isLoading state
 */
export function usePermissionGate(
  permission: string,
  options?: {
    redirectTo?: string;
    showUnauthorized?: boolean;
  }
) {
  const navigate = useNavigate();
  const { data: permissions = [], isLoading } = usePermissions();
  const hasPermission = permissions.includes(permission);

  // Handle redirect if no permission
  if (!isLoading && !hasPermission && options?.redirectTo) {
    navigate(options.redirectTo);
  }

  return {
    hasPermission,
    isLoading,
    showUnauthorized: !isLoading && !hasPermission && options?.showUnauthorized,
  };
}

/**
 * Hook for SSO initiation
 */
export function useSSOInitiate() {
  return useMutation({
    mutationFn: (provider: string) => authApi.ssoInitiate(provider),
    onSuccess: (response) => {
      // Redirect to SSO provider's authorization URL
      window.location.href = response.authorization_url;
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "SSO initiation error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook for SSO callback
 */
export function useSSOCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: storeLogin } = useAuthStore();

  return useMutation({
    mutationFn: ({
      provider,
      code,
      state,
    }: {
      provider: string;
      code: string;
      state: string;
    }) => authApi.ssoCallback(provider, code, state),
    onSuccess: (response) => {
      storeLogin(response.user, response.tokens);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });

      // Get saved location from localStorage or default to dashboard
      const savedLocation =
        localStorage.getItem("sso_return_url") || "/dashboard";
      localStorage.removeItem("sso_return_url");

      navigate(savedLocation);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "SSO callback error:",
        error.response?.data?.detail || error.message
      );
      navigate("/login?error=sso_failed");
    },
  });
}
