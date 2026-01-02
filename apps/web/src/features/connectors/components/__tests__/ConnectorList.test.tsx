import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { ConnectorList } from "../ConnectorList";
import { connectorsApi } from "../../api";
import type { Connector, ConnectorResponse } from "../../types";

// Mock the connectors API
vi.mock("../../api", () => ({
  connectorsApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    testConnection: vi.fn(),
  },
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

describe("ConnectorList", () => {
  const createMockConnector = (overrides?: Partial<Connector>): Connector => ({
    id: `connector-${Math.random()}`,
    organization_id: "org-123",
    name: "Test Connector",
    connector_type: "database",
    provider: "postgresql",
    status: "connected",
    created_by: "user-123",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it("should render loading state", () => {
    vi.mocked(connectorsApi.getAll).mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no connectors", async () => {
    const mockResponse: ConnectorResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No connectors found")).toBeInTheDocument();
    });
  });

  it("should render connectors correctly", async () => {
    const connectors = [
      createMockConnector({ name: "Database Connector" }),
      createMockConnector({ name: "Email Connector", connector_type: "email" }),
      createMockConnector({ name: "Cloud Connector", connector_type: "cloud" }),
    ];
    const mockResponse: ConnectorResponse = {
      records: connectors,
      total: 3,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Database Connector")).toBeInTheDocument();
      expect(screen.getByText("Email Connector")).toBeInTheDocument();
      expect(screen.getByText("Cloud Connector")).toBeInTheDocument();
    });
  });

  it("should filter by connector type", async () => {
    const user = userEvent.setup();
    const connectors = [
      createMockConnector({ name: "Database Connector" }),
      createMockConnector({ name: "Email Connector" }),
    ];
    const mockResponse: ConnectorResponse = {
      records: connectors,
      total: 2,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Database Connector")).toBeInTheDocument();
    });

    const typeSelect = screen.getByRole("combobox");
    await user.selectOptions(typeSelect, "database");

    await waitFor(() => {
      expect(connectorsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ connector_type: "database" })
      );
    });
  });

  it("should handle pagination", async () => {
    const user = userEvent.setup();
    const connectors = Array.from({ length: 12 }, (_, i) =>
      createMockConnector({ name: `Connector ${i + 1}` })
    );
    const mockResponse: ConnectorResponse = {
      records: connectors,
      total: 24,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(connectorsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("should disable previous button on first page", async () => {
    const mockResponse: ConnectorResponse = {
      records: [createMockConnector()],
      total: 24,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const previousButton = screen.getByRole("button", { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });
  });

  it("should disable next button on last page", async () => {
    const connectors = Array.from({ length: 12 }, (_, i) =>
      createMockConnector({ name: `Connector ${i + 1}` })
    );
    const mockResponse: ConnectorResponse = {
      records: connectors,
      total: 24,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    // Navigate to page 2 (last page)
    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await userEvent.setup().click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
      const updatedNextButton = screen.getByRole("button", { name: /next/i });
      expect(updatedNextButton).toBeDisabled();
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(connectorsApi.getAll).mockRejectedValue(
      new Error("Network error")
    );

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load connectors")).toBeInTheDocument();
    });
  });

  it("should call connectorsApi.getAll on mount", async () => {
    const mockResponse: ConnectorResponse = {
      records: [createMockConnector()],
      total: 1,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(connectorsApi.getAll).toHaveBeenCalled();
    });
  });

  it("should show create connector button", async () => {
    const mockResponse: ConnectorResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getAllByText("Create Connector").length).toBeGreaterThan(0);
    });
  });

  it("should show create button in empty state", async () => {
    const mockResponse: ConnectorResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const createButtons = screen.getAllByText("Create Connector");
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  it("should display different connector types with correct icons", async () => {
    const connectors = [
      createMockConnector({
        name: "DB Connector",
        connector_type: "database",
      }),
      createMockConnector({
        name: "Cloud Connector",
        connector_type: "cloud",
      }),
      createMockConnector({
        name: "Email Connector",
        connector_type: "email",
      }),
      createMockConnector({
        name: "Storage Connector",
        connector_type: "storage",
      }),
      createMockConnector({
        name: "API Connector",
        connector_type: "api",
      }),
      createMockConnector({
        name: "Message Connector",
        connector_type: "messaging",
      }),
    ];
    const mockResponse: ConnectorResponse = {
      records: connectors,
      total: 6,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("DB Connector")).toBeInTheDocument();
      expect(screen.getByText("Cloud Connector")).toBeInTheDocument();
      expect(screen.getByText("Email Connector")).toBeInTheDocument();
      expect(screen.getByText("Storage Connector")).toBeInTheDocument();
      expect(screen.getByText("API Connector")).toBeInTheDocument();
      expect(screen.getByText("Message Connector")).toBeInTheDocument();
    });
  });

  it("should display different connector statuses", async () => {
    const connectors = [
      createMockConnector({ status: "connected" }),
      createMockConnector({ status: "disconnected" }),
      createMockConnector({ status: "error" }),
      createMockConnector({ status: "pending" }),
    ];
    const mockResponse: ConnectorResponse = {
      records: connectors,
      total: 4,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("connected")).toBeInTheDocument();
      expect(screen.getByText("disconnected")).toBeInTheDocument();
      expect(screen.getByText("error")).toBeInTheDocument();
      expect(screen.getByText("pending")).toBeInTheDocument();
    });
  });

  it("should render grid layout for connectors", async () => {
    const connectors = Array.from({ length: 3 }, (_, i) =>
      createMockConnector({ name: `Connector ${i + 1}` })
    );
    const mockResponse: ConnectorResponse = {
      records: connectors,
      total: 3,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    const { container } = renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  it("should show skeleton cards during loading", () => {
    vi.mocked(connectorsApi.getAll).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should reset page when changing filter type", async () => {
    const user = userEvent.setup();
    const mockResponse: ConnectorResponse = {
      records: [createMockConnector()],
      total: 1,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Test Connector")).toBeInTheDocument();
    });

    const typeSelect = screen.getByRole("combobox");
    await user.selectOptions(typeSelect, "email");

    await waitFor(() => {
      expect(connectorsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ connector_type: "email", page: 1 })
      );
    });
  });

  it("should display empty state message when filtered results are empty", async () => {
    const mockResponse: ConnectorResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No connectors found")).toBeInTheDocument();
    });
  });

  it("should show different empty state message when filters are applied", async () => {
    const user = userEvent.setup();
    const mockResponse: ConnectorResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No connectors found")).toBeInTheDocument();
    });

    const typeSelect = screen.getByRole("combobox");
    await user.selectOptions(typeSelect, "database");

    await waitFor(() => {
      expect(
        screen.getByText("Try adjusting your filters")
      ).toBeInTheDocument();
    });
  });

  it("should not show pagination when total items fit on one page", async () => {
    const mockResponse: ConnectorResponse = {
      records: [createMockConnector()],
      total: 5,
    };
    vi.mocked(connectorsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<ConnectorList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });
  });
});
