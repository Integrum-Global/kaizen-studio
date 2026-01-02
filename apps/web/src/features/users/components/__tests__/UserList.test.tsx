import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { UserList } from "../UserList";
import type { User, UserResponse } from "../../types";

// Mock the users API
vi.mock("../../api", () => ({
  usersApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock hooks
vi.mock("../../hooks", () => ({
  useUsers: vi.fn(),
  useUser: vi.fn(),
  useCurrentUser: vi.fn(),
  useCreateUser: vi.fn(),
  useUpdateUser: vi.fn(),
  useDeleteUser: vi.fn(),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

import {
  useUsers,
  useDeleteUser,
  useCurrentUser,
  useCreateUser,
  useUpdateUser,
} from "../../hooks";

describe("UserList", () => {
  const createMockUser = (overrides?: Partial<User>): User => ({
    id: `user-${Math.random()}`,
    organization_id: "org-123",
    email: "test@example.com",
    name: "Test User",
    status: "active",
    role: "developer",
    mfa_enabled: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    // Default mock implementations
    vi.mocked(useDeleteUser).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      reset: vi.fn(),
    } as any);

    vi.mocked(useCreateUser).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      reset: vi.fn(),
    } as any);

    vi.mocked(useUpdateUser).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      reset: vi.fn(),
    } as any);

    vi.mocked(useCurrentUser).mockReturnValue({
      data: createMockUser({ role: "org_admin" }),
    } as any);
  });

  it("should render loading state", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no users", async () => {
    const mockResponse: UserResponse = {
      records: [],
      total: 0,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });
  });

  it("should render users correctly", async () => {
    const users = [
      createMockUser({ name: "Alice Johnson" }),
      createMockUser({ name: "Bob Smith" }),
      createMockUser({ name: "Charlie Brown" }),
    ];
    const mockResponse: UserResponse = {
      records: users,
      total: 3,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    });
  });

  it("should filter by user role", async () => {
    const user = userEvent.setup();
    const users = [
      createMockUser({ name: "Admin User", role: "org_admin" }),
      createMockUser({ name: "Developer User", role: "developer" }),
    ];
    const mockResponse: UserResponse = {
      records: users,
      total: 2,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    const roleSelect = screen.getAllByRole("combobox")[0]!;
    await user.selectOptions(roleSelect, "org_admin");

    // The useUsers hook should be called with the new filter
    await waitFor(() => {
      expect(roleSelect).toHaveValue("org_admin");
    });
  });

  it("should filter by user status", async () => {
    const user = userEvent.setup();
    const users = [createMockUser({ name: "Active User", status: "active" })];
    const mockResponse: UserResponse = {
      records: users,
      total: 1,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Active User")).toBeInTheDocument();
    });

    const statusSelect = screen.getAllByRole("combobox")[1]!;
    await user.selectOptions(statusSelect, "suspended");

    await waitFor(() => {
      expect(statusSelect).toHaveValue("suspended");
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isPending: false,
      error: new Error("Network error"),
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load users")).toBeInTheDocument();
    });
  });

  it("should show Create User button for admin users", async () => {
    const mockResponse: UserResponse = {
      records: [],
      total: 0,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useCurrentUser).mockReturnValue({
      data: createMockUser({ role: "org_admin" }),
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const createButtons = screen.getAllByText("Create User");
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  it("should not show Create User button for non-admin users", async () => {
    const mockResponse: UserResponse = {
      records: [createMockUser()],
      total: 1,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    vi.mocked(useCurrentUser).mockReturnValue({
      data: createMockUser({ role: "viewer" }),
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.queryByText("Create User")).not.toBeInTheDocument();
    });
  });

  it("should display different user roles with correct badges", async () => {
    const users = [
      createMockUser({
        name: "Owner User",
        role: "org_owner",
      }),
      createMockUser({
        name: "Admin User",
        role: "org_admin",
      }),
      createMockUser({
        name: "Developer User",
        role: "developer",
      }),
      createMockUser({
        name: "Viewer User",
        role: "viewer",
      }),
    ];
    const mockResponse: UserResponse = {
      records: users,
      total: 4,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Owner User")).toBeInTheDocument();
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("Developer User")).toBeInTheDocument();
      expect(screen.getByText("Viewer User")).toBeInTheDocument();
      expect(screen.getAllByText("Owner").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Developer").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Viewer").length).toBeGreaterThan(0);
    });
  });

  it("should display different user statuses", async () => {
    const users = [
      createMockUser({ name: "Active User", status: "active" }),
      createMockUser({ name: "Suspended User", status: "suspended" }),
    ];
    const mockResponse: UserResponse = {
      records: users,
      total: 2,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Active User")).toBeInTheDocument();
      expect(screen.getByText("Suspended User")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("suspended")).toBeInTheDocument();
    });
  });

  it("should render grid layout for users", async () => {
    const users = Array.from({ length: 3 }, (_, i) =>
      createMockUser({ name: `User ${i + 1}` })
    );
    const mockResponse: UserResponse = {
      records: users,
      total: 3,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    const { container } = renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  it("should show skeleton cards during loading", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isPending: true,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should reset filters when changing role filter", async () => {
    const user = userEvent.setup();
    const mockResponse: UserResponse = {
      records: [createMockUser()],
      total: 1,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    const roleSelect = screen.getAllByRole("combobox")[0]!;
    await user.selectOptions(roleSelect, "developer");

    await waitFor(() => {
      expect(roleSelect).toHaveValue("developer");
    });
  });

  it("should display empty state message when filtered results are empty", async () => {
    const mockResponse: UserResponse = {
      records: [],
      total: 0,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });
  });

  it("should show different empty state message when filters are applied", async () => {
    const user = userEvent.setup();
    const mockResponse: UserResponse = {
      records: [],
      total: 0,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });

    const roleSelect = screen.getAllByRole("combobox")[0]!;
    await user.selectOptions(roleSelect, "developer");

    await waitFor(() => {
      expect(
        screen.getByText("Try adjusting your filters")
      ).toBeInTheDocument();
    });
  });

  it("should render user with delete action available", async () => {
    const mockUser = createMockUser({ id: "user-123", name: "Test User" });
    const mockResponse: UserResponse = {
      records: [mockUser],
      total: 1,
    };

    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useDeleteUser).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as any);

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Verify the dropdown menu button exists (UserCard shows actions)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1); // Should have Create User button + dropdown menu button
  });

  it("should render user cards with proper action buttons", async () => {
    const mockUser = createMockUser({ id: "user-123", name: "Test User" });
    const mockResponse: UserResponse = {
      records: [mockUser],
      total: 1,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Verify multiple buttons are rendered (Create User button + dropdown menu button)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("should display MFA enabled users correctly", async () => {
    const users = [
      createMockUser({
        name: "MFA User",
        mfa_enabled: true,
      }),
      createMockUser({
        name: "Regular User",
        mfa_enabled: false,
      }),
    ];
    const mockResponse: UserResponse = {
      records: users,
      total: 2,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    const { container } = renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("MFA User")).toBeInTheDocument();
      expect(screen.getByText("Regular User")).toBeInTheDocument();
      // MFA icon should be present for MFA User
      const mfaIcons = container.querySelectorAll(".text-green-600");
      expect(mfaIcons.length).toBe(1);
    });
  });

  it("should show all role filter options", async () => {
    const mockResponse: UserResponse = {
      records: [],
      total: 0,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const roleSelect = screen.getAllByRole("combobox")[0];
      expect(roleSelect).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    const roleOptions = options.slice(0, 5); // First 5 options are role filters

    expect(roleOptions[0]).toHaveTextContent("All Roles");
    expect(roleOptions[1]).toHaveTextContent("Owner");
    expect(roleOptions[2]).toHaveTextContent("Admin");
    expect(roleOptions[3]).toHaveTextContent("Developer");
    expect(roleOptions[4]).toHaveTextContent("Viewer");
  });

  it("should show all status filter options", async () => {
    const mockResponse: UserResponse = {
      records: [],
      total: 0,
    };

    vi.mocked(useUsers).mockReturnValue({
      data: mockResponse,
      isPending: false,
      error: null,
    } as any);

    renderWithProviders(<UserList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const statusSelect = screen.getAllByRole("combobox")[1];
      expect(statusSelect).toBeInTheDocument();
    });

    const options = screen.getAllByRole("option");
    const statusOptions = options.slice(5); // Last 3 options are status filters

    expect(statusOptions[0]).toHaveTextContent("All Statuses");
    expect(statusOptions[1]).toHaveTextContent("Active");
    expect(statusOptions[2]).toHaveTextContent("Suspended");
  });
});
