import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuthStore } from "../../store/auth";
import { useQueryClient } from "@tanstack/react-query";

// Extend window for debug flag
declare global {
  interface Window {
    __sso_debug_shown?: boolean;
  }
}

/**
 * SSOCallbackPage Component
 * Handles the SSO callback after provider authentication
 *
 * Two possible flows:
 * 1. Direct token flow: /auth/callback?access_token=...&refresh_token=...
 * 2. Code exchange flow: /auth/callback?code=...&state=... (handled by backend redirect)
 */
export function SSOCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: storeLogin } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  // Debug: Log all URL params on every render
  console.log("SSOCallbackPage render - URL:", window.location.href);
  console.log("SSOCallbackPage render - searchParams:", {
    accessToken: accessToken ? accessToken.substring(0, 20) + "..." : null,
    refreshToken: refreshToken ? refreshToken.substring(0, 20) + "..." : null,
    code: code ? code.substring(0, 20) + "..." : null,
    state: state ? state.substring(0, 20) + "..." : null,
    error,
    message,
  });

  // TEMPORARY: Alert to confirm this page is rendering
  // Remove after debugging
  if (typeof window !== "undefined" && !window.__sso_debug_shown) {
    window.__sso_debug_shown = true;
    console.log("=== SSO DEBUG: Page is rendering ===");
    console.log("accessToken present:", !!accessToken);
    console.log("code present:", !!code);
  }

  useEffect(() => {
    // Prevent double processing in React strict mode
    if (processedRef.current) {
      console.log("SSOCallbackPage useEffect - already processed, skipping");
      return;
    }
    processedRef.current = true;

    console.log("SSOCallbackPage useEffect - starting processing");
    // Handle SSO error
    if (error) {
      setErrorMessage(message || "SSO authentication failed");
      setTimeout(() => navigate("/login?error=sso_failed"), 3000);
      return;
    }

    // Handle direct token flow (from backend redirect after successful OAuth)
    if (accessToken && refreshToken) {
      // Store tokens
      const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "bearer",
        expires_in: 3600,
      };

      // Decode user info from JWT token (basic parsing)
      try {
        const tokenParts = accessToken.split(".");
        if (tokenParts.length < 2 || !tokenParts[1]) {
          throw new Error("Invalid token format");
        }
        // JWT uses base64url encoding - need to convert to standard base64
        let payloadBase64 = tokenParts[1];
        payloadBase64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        // Add padding if needed
        const pad = payloadBase64.length % 4;
        if (pad) {
          payloadBase64 += "=".repeat(4 - pad);
        }
        console.log("SSO Login - decoding base64 payload");
        const payload = JSON.parse(atob(payloadBase64));
        console.log("SSO Login - decoded payload:", payload);
        const user = {
          id: payload.sub || payload.user_id || "",
          email: payload.email || "",
          name: payload.name || "",
          organization_id: payload.org_id || payload.organization_id || "",
          organization_name: payload.org_name || "",
          role: payload.role || "developer",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log("SSO Login - storing user:", user);
        console.log("SSO Login - storing tokens:", {
          ...tokens,
          access_token: tokens.access_token.substring(0, 20) + "...",
        });

        storeLogin(user, tokens);
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        queryClient.invalidateQueries({ queryKey: ["permissions"] });

        // Get saved location from localStorage or default to dashboard
        const savedLocation =
          localStorage.getItem("sso_return_url") || "/dashboard";
        console.log(
          "SSO Login - sso_return_url from localStorage:",
          savedLocation
        );
        console.log(
          "SSO Login - all localStorage keys:",
          Object.keys(localStorage)
        );
        localStorage.removeItem("sso_return_url");

        console.log("SSO Login - navigating to:", savedLocation);
        console.log("SSO Login - auth store state:", useAuthStore.getState());

        // Wait a tick for Zustand persist middleware to save state to localStorage
        // Then use window.location for a full page reload
        setTimeout(() => {
          console.log(
            "SSO Login - after timeout, auth store state:",
            useAuthStore.getState()
          );
          console.log(
            "SSO Login - localStorage kaizen-auth-storage:",
            localStorage.getItem("kaizen-auth-storage")
          );
          window.location.href = savedLocation;
        }, 100);
      } catch (e) {
        console.error("Failed to parse token:", e);
        setErrorMessage("Failed to process authentication token");
        setTimeout(() => navigate("/login?error=token_parse_failed"), 3000);
      }
      return;
    }

    // Handle code exchange flow (redirect to backend for processing)
    if (code && state) {
      // Redirect to backend callback endpoint which will process the code
      // and redirect back with tokens
      // Use relative URL so nginx can proxy to backend
      const backendCallbackUrl = `/api/v1/sso/callback/public?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      window.location.href = backendCallbackUrl;
      return;
    }

    // No valid parameters
    setErrorMessage("Invalid callback parameters");
    setTimeout(() => navigate("/login"), 3000);
  }, [
    accessToken,
    refreshToken,
    code,
    state,
    error,
    message,
    navigate,
    storeLogin,
    queryClient,
  ]);

  // Show error state
  if (errorMessage || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Authentication Failed
            </CardTitle>
            <CardDescription>
              Unable to complete SSO authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {errorMessage ||
                message ||
                "SSO authentication was cancelled or failed"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completing Sign In</CardTitle>
          <CardDescription>
            Processing your Microsoft authentication...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}
