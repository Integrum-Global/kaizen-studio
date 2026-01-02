import { useEffect, useRef, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/auth";
import { useCurrentUser, usePermissions } from "../hooks/useAuth";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Check if the current path is a public auth page
 */
function isAuthPage(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth/callback")
  );
}

/**
 * AuthProvider Component
 * Initializes authentication state on mount and manages user/permissions
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const location = useLocation();
  const { isAuthenticated, setUser, setPermissions, setLoading, logout } =
    useAuthStore();
  // Track if we've already attempted logout to prevent loops
  const hasAttemptedLogout = useRef(false);

  // Check if we're on an auth page - skip API calls if so
  const onAuthPage = isAuthPage(location.pathname);

  // Fetch current user if authenticated AND not on auth page
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser();

  // Fetch permissions if authenticated AND not on auth page
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();

  // Initialize loading state - but not on auth pages
  useEffect(() => {
    if (isAuthenticated && !onAuthPage) {
      setLoading(userLoading || permissionsLoading);
    } else {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    onAuthPage,
    userLoading,
    permissionsLoading,
    setLoading,
  ]);

  // Update user in store when fetched
  useEffect(() => {
    if (user) {
      setUser(user);
      // Reset logout attempt flag on successful user fetch
      hasAttemptedLogout.current = false;
    }
  }, [user, setUser]);

  // Update permissions in store when fetched
  useEffect(() => {
    if (permissions) {
      setPermissions(permissions);
    }
  }, [permissions, setPermissions]);

  // Handle user fetch error (token invalid/expired)
  // The axios interceptor clears localStorage on 401s
  // We detect this by checking if tokens are gone
  useEffect(() => {
    if (
      userError &&
      isAuthenticated &&
      !hasAttemptedLogout.current &&
      !onAuthPage
    ) {
      // Check if the axios interceptor already cleared the tokens
      const hasTokens = !!localStorage.getItem("access_token");

      if (!hasTokens) {
        // Tokens were cleared by interceptor, sync zustand state
        hasAttemptedLogout.current = true;
        logout();
      } else {
        // Non-401 error with valid tokens
        const errorStatus = (userError as { response?: { status?: number } })
          ?.response?.status;
        if (errorStatus !== 401) {
          console.error("Failed to fetch user (non-401 error):", userError);
          hasAttemptedLogout.current = true;
          logout();
        }
      }
    }
  }, [userError, isAuthenticated, onAuthPage, logout]);

  return <>{children}</>;
}
