import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { TeamList } from "../TeamList";
import { teamsApi } from "../../api";
import type { Team, TeamResponse } from "../../types";

// Mock the teams API
vi.mock("../../api", () => ({
  teamsApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("TeamList", () => {
  const createMockTeam = (overrides?: Partial<Team>): Team => ({
    id: `team-${Math.random()}`,
    organization_id: "org-123",
    name: "Test Team",
    description: "A test team description",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    vi.mocked(teamsApi.getAll).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no teams", async () => {
    const mockResponse: TeamResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(teamsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No teams found")).toBeInTheDocument();
    });
  });

  it("should render teams correctly", async () => {
    const teams = [
      createMockTeam({ name: "Team A" }),
      createMockTeam({ name: "Team B" }),
      createMockTeam({ name: "Team C" }),
    ];
    const mockResponse: TeamResponse = {
      records: teams,
      total: 3,
    };
    vi.mocked(teamsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Team A")).toBeInTheDocument();
      expect(screen.getByText("Team B")).toBeInTheDocument();
      expect(screen.getByText("Team C")).toBeInTheDocument();
    });
  });

  it("should filter by search query", async () => {
    const user = userEvent.setup();
    const teams = [
      createMockTeam({ name: "Engineering Team" }),
      createMockTeam({ name: "Marketing Team" }),
    ];
    const mockResponse: TeamResponse = {
      records: teams,
      total: 2,
    };
    vi.mocked(teamsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Engineering Team")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search teams...");
    await user.type(searchInput, "Engineering");

    await waitFor(() => {
      expect(teamsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Engineering" })
      );
    });
  });

  it("should handle pagination", async () => {
    const user = userEvent.setup();
    const teams = Array.from({ length: 12 }, (_, i) =>
      createMockTeam({ name: `Team ${i + 1}` })
    );
    const mockResponse: TeamResponse = {
      records: teams,
      total: 24,
    };
    vi.mocked(teamsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(teamsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(teamsApi.getAll).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load teams")).toBeInTheDocument();
    });
  });

  it("should call teamsApi.getAll on mount", async () => {
    const mockResponse: TeamResponse = {
      records: [createMockTeam()],
      total: 1,
    };
    vi.mocked(teamsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(teamsApi.getAll).toHaveBeenCalled();
    });
  });

  it("should show create team button", async () => {
    const mockResponse: TeamResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(teamsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<TeamList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getAllByText("Create Team").length).toBeGreaterThan(0);
    });
  });
});
