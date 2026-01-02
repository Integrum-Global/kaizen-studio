import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { AuditLogList } from "../AuditLogList";
import { auditApi } from "../../api";
import type { AuditLog, AuditResponse } from "../../types";

// Mock the audit API
vi.mock("../../api", () => ({
  auditApi: {
    getLogs: vi.fn(),
    export: vi.fn(),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("AuditLogList", () => {
  const createMockAuditLog = (overrides?: Partial<AuditLog>): AuditLog => ({
    id: `log-${Math.random()}`,
    action: "create",
    actor: {
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
    },
    resource: "agent",
    resourceId: "agent-456",
    resourceName: "Test Agent",
    status: "success",
    details: { key: "value" },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    timestamp: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    vi.mocked(auditApi.getLogs).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no logs", async () => {
    const mockResponse: AuditResponse = {
      logs: [],
      total: 0,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No audit logs found")).toBeInTheDocument();
    });
  });

  it("should render audit logs correctly", async () => {
    const logs = [
      createMockAuditLog({
        actor: { id: "1", name: "Alice", email: "alice@example.com" },
      }),
      createMockAuditLog({
        actor: { id: "2", name: "Bob", email: "bob@example.com" },
      }),
      createMockAuditLog({
        actor: { id: "3", name: "Charlie", email: "charlie@example.com" },
      }),
    ];
    const mockResponse: AuditResponse = {
      logs,
      total: 3,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });
  });

  it("should have search input for filtering", async () => {
    const logs = [
      createMockAuditLog({ resourceName: "Production Agent" }),
      createMockAuditLog({ resourceName: "Staging Agent" }),
    ];
    const mockResponse: AuditResponse = {
      logs,
      total: 2,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    // Wait for data to load (search input only appears after loading)
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search audit logs...")
      ).toBeInTheDocument();
    });

    // Verify search input exists and is editable
    const searchInput = screen.getByPlaceholderText("Search audit logs...");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).not.toBeDisabled();
  });

  it("should have action filter selector", async () => {
    const logs = [
      createMockAuditLog({ action: "create" }),
      createMockAuditLog({ action: "delete" }),
    ];
    const mockResponse: AuditResponse = {
      logs,
      total: 2,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    // Wait for data to load - filters only appear after loading
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search audit logs...")
      ).toBeInTheDocument();
    });

    // Verify action filter is rendered (look for "All Actions" default text)
    expect(screen.getByText("All Actions")).toBeInTheDocument();
  });

  it("should have status filter selector", async () => {
    const logs = [
      createMockAuditLog({ status: "success" }),
      createMockAuditLog({ status: "failure" }),
    ];
    const mockResponse: AuditResponse = {
      logs,
      total: 2,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    // Wait for data to load - filters only appear after loading
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search audit logs...")
      ).toBeInTheDocument();
    });

    // Verify status filter is rendered (look for "All Status" default text)
    expect(screen.getByText("All Status")).toBeInTheDocument();
  });

  it("should handle pagination", async () => {
    const user = userEvent.setup();
    const logs = Array.from({ length: 20 }, (_, i) =>
      createMockAuditLog({ resourceName: `Log ${i + 1}` })
    );
    const mockResponse: AuditResponse = {
      logs,
      total: 40,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(auditApi.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("should expand log details when clicked", async () => {
    const user = userEvent.setup();
    const log = createMockAuditLog({
      id: "log-123",
      details: { message: "Test details" },
    });
    const mockResponse: AuditResponse = {
      logs: [log],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Click expand button
    const expandButton = screen.getByRole("button", { name: "" });
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText("Log ID")).toBeInTheDocument();
      expect(screen.getByText("log-123")).toBeInTheDocument();
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(auditApi.getLogs).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load audit logs")).toBeInTheDocument();
    });
  });

  it("should call auditApi.getLogs on mount", async () => {
    const mockResponse: AuditResponse = {
      logs: [createMockAuditLog()],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(auditApi.getLogs).toHaveBeenCalled();
    });
  });

  it("should display export button", async () => {
    const mockResponse: AuditResponse = {
      logs: [createMockAuditLog()],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    vi.mocked(auditApi.getLogs).mockResolvedValue(mockResponse);

    renderWithProviders(<AuditLogList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Export")).toBeInTheDocument();
    });
  });
});
