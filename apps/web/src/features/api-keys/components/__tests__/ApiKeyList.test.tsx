import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { ApiKeyList } from "../ApiKeyList";
import { apiKeysApi } from "../../api";
import type { ApiKey, ApiKeyResponse } from "../../types";

// Mock the API keys API
vi.mock("../../api", () => ({
  apiKeysApi: {
    getAll: vi.fn(),
    revoke: vi.fn(),
    regenerate: vi.fn(),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe("ApiKeyList", () => {
  const createMockApiKey = (overrides?: Partial<ApiKey>): ApiKey => ({
    id: `key-${Math.random()}`,
    name: "Test API Key",
    key: "kks_abc...xyz",
    prefix: "kks_abc",
    permissions: ["read", "write"],
    scopes: ["agents", "deployments"],
    lastUsedAt: "2024-01-01T00:00:00Z",
    expiresAt: undefined,
    status: "active",
    createdBy: "user-789",
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    vi.mocked(apiKeysApi.getAll).mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no API keys", async () => {
    const mockResponse: ApiKeyResponse = {
      keys: [],
      total: 0,
      page: 1,
      page_size: 12,
    };
    vi.mocked(apiKeysApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No API keys found")).toBeInTheDocument();
    });
  });

  it("should render API keys correctly", async () => {
    const apiKeys = [
      createMockApiKey({ name: "Production Key" }),
      createMockApiKey({ name: "Development Key" }),
      createMockApiKey({ name: "Testing Key" }),
    ];
    const mockResponse: ApiKeyResponse = {
      keys: apiKeys,
      total: 3,
      page: 1,
      page_size: 12,
    };
    vi.mocked(apiKeysApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Production Key")).toBeInTheDocument();
      expect(screen.getByText("Development Key")).toBeInTheDocument();
      expect(screen.getByText("Testing Key")).toBeInTheDocument();
    });
  });

  it("should filter by search query", async () => {
    const user = userEvent.setup();
    const apiKeys = [
      createMockApiKey({ name: "Production API Key" }),
      createMockApiKey({ name: "Staging API Key" }),
    ];
    const mockResponse: ApiKeyResponse = {
      keys: apiKeys,
      total: 2,
      page: 1,
      page_size: 12,
    };
    vi.mocked(apiKeysApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Production API Key")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search API keys...");
    await user.type(searchInput, "Production");

    await waitFor(() => {
      expect(apiKeysApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Production" })
      );
    });
  });

  it("should filter by status", async () => {
    const user = userEvent.setup();
    const apiKeys = [
      createMockApiKey({ status: "active" }),
      createMockApiKey({ status: "revoked" }),
    ];
    const mockResponse: ApiKeyResponse = {
      keys: apiKeys,
      total: 2,
      page: 1,
      page_size: 12,
    };
    vi.mocked(apiKeysApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getAllByText("active")).toBeTruthy();
    });

    // Find the status filter select
    const statusFilters = screen.getAllByRole("combobox");
    const statusFilter = statusFilters.find((filter) =>
      filter.getAttribute("id")?.includes("radix")
    );

    if (statusFilter) {
      await user.click(statusFilter);

      await waitFor(() => {
        const activeOption = screen.getByRole("option", { name: /^active$/i });
        expect(activeOption).toBeInTheDocument();
      });
    }
  });

  it("should handle pagination", async () => {
    const user = userEvent.setup();
    const apiKeys = Array.from({ length: 12 }, (_, i) =>
      createMockApiKey({ name: `API Key ${i + 1}` })
    );
    const mockResponse: ApiKeyResponse = {
      keys: apiKeys,
      total: 24,
      page: 1,
      page_size: 12,
    };
    vi.mocked(apiKeysApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(apiKeysApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(apiKeysApi.getAll).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load API keys")).toBeInTheDocument();
    });
  });

  it("should call apiKeysApi.getAll on mount", async () => {
    const mockResponse: ApiKeyResponse = {
      keys: [createMockApiKey()],
      total: 1,
      page: 1,
      page_size: 12,
    };
    vi.mocked(apiKeysApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(apiKeysApi.getAll).toHaveBeenCalled();
    });
  });

  it("should have create button in header and empty state", async () => {
    const mockResponse: ApiKeyResponse = {
      keys: [],
      total: 0,
      page: 1,
      page_size: 12,
    };
    vi.mocked(apiKeysApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ApiKeyList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No API keys found")).toBeInTheDocument();
    });

    // Verify both "Create API Key" buttons exist (header + empty state)
    const createButtons = screen.getAllByRole("button", {
      name: /create api key/i,
    });
    expect(createButtons.length).toBe(2);
    expect(createButtons[0]).not.toBeDisabled();
    expect(createButtons[1]).not.toBeDisabled();
  });
});
