import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { User, AuthTokens } from "@/types/auth";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";

/**
 * Create a test query client with custom options
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component with all providers
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

function AllProviders({ children, queryClient }: AllProvidersProps) {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render function with all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, initialRoute = "/", ...renderOptions } = options || {};

  // Set initial route if provided
  if (initialRoute !== "/") {
    window.history.pushState({}, "Test page", initialRoute);
  }

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllProviders queryClient={queryClient}>{children}</AllProviders>
      ),
      ...renderOptions,
    }),
  };
}

/**
 * Factory function to create mock users
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    organization_id: "org-123",
    organization_name: "Test Organization",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory function to create mock tokens
 */
export function createMockTokens(overrides?: Partial<AuthTokens>): AuthTokens {
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    ...overrides,
  };
}

/**
 * Factory function to create mock agents
 */
export interface MockAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: "active" | "inactive" | "error";
  created_at: string;
  updated_at: string;
  organization_id: string;
  created_by: string;
}

export function createMockAgent(overrides?: Partial<MockAgent>): MockAgent {
  return {
    id: "agent-123",
    name: "Test Agent",
    description: "A test agent for testing purposes",
    type: "chat",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization_id: "org-123",
    created_by: "user-123",
    ...overrides,
  };
}

/**
 * Helper to set up authenticated state in auth store
 */
export function mockAuthStore(user?: User, tokens?: AuthTokens) {
  const mockUser = user || createMockUser();
  const mockTokens = tokens || createMockTokens();

  useAuthStore.setState({
    user: mockUser,
    tokens: mockTokens,
    permissions: ["read:agents", "write:agents", "admin:all"],
    isAuthenticated: true,
    isLoading: false,
  });
}

/**
 * Helper to reset auth store to initial state
 */
export function resetAuthStore() {
  useAuthStore.setState({
    user: null,
    tokens: null,
    permissions: [],
    isAuthenticated: false,
    isLoading: false,
  });
}

/**
 * Helper to set up UI store state
 */
export function mockUIStore(overrides?: {
  sidebarCollapsed?: boolean;
  theme?: "light" | "dark" | "system";
}) {
  useUIStore.setState({
    sidebarCollapsed: false,
    theme: "light",
    notifications: [],
    ...overrides,
  });
}

/**
 * Helper to reset UI store to initial state
 */
export function resetUIStore() {
  useUIStore.setState({
    sidebarCollapsed: false,
    theme: "system",
    notifications: [],
  });
}

/**
 * Wait for async operations to complete
 */
export async function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock API response helper
 */
export function mockApiSuccess<T>(data: T, delay = 0) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Mock API error helper
 */
export function mockApiError(message = "API Error", status = 500, delay = 0) {
  return new Promise((_, reject) => {
    setTimeout(
      () =>
        reject({
          response: {
            data: { detail: message },
            status,
          },
          message,
        }),
      delay
    );
  });
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
