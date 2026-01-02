import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { TeamDialog } from "../TeamDialog";
import type { Team } from "../../types";

// Mock the APIs
vi.mock("../../api", () => ({
  teamsApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("TeamDialog", () => {
  const mockOnOpenChange = vi.fn();

  const createMockTeam = (overrides?: Partial<Team>): Team => ({
    id: "team-123",
    organization_id: "org-456",
    name: "Test Team",
    description: "A test team description",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("should render create dialog", () => {
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByText("Create New Team")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create team/i })
      ).toBeInTheDocument();
    });

    it("should show form fields", () => {
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Check for form field labels
      expect(screen.getByText(/Team Name/i)).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should show empty fields for create mode", () => {
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const nameInput = screen.getByPlaceholderText(/e.g., Engineering Team/i);
      expect(nameInput).toHaveValue("");
    });

    it("should call onOpenChange when cancel is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Edit Mode", () => {
    it("should render edit dialog", () => {
      const team = createMockTeam();
      renderWithProviders(
        <TeamDialog team={team} open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByText("Edit Team")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /update team/i })
      ).toBeInTheDocument();
    });

    it("should show existing values", () => {
      const team = createMockTeam({
        name: "Engineering Team",
        description: "The engineering team",
      });
      renderWithProviders(
        <TeamDialog team={team} open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Check existing values
      expect(screen.getByDisplayValue("Engineering Team")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("The engineering team")
      ).toBeInTheDocument();
    });

    it("should show team name in edit mode", () => {
      const team = createMockTeam({ name: "Marketing Team" });
      renderWithProviders(
        <TeamDialog team={team} open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByDisplayValue("Marketing Team")).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("should update name input", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const nameInput = screen.getByPlaceholderText(/e.g., Engineering Team/i);
      await user.type(nameInput, "New Team");

      expect(screen.getByDisplayValue("New Team")).toBeInTheDocument();
    });

    it("should update description input", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const descriptionInput =
        screen.getByPlaceholderText(/Describe the purpose/i);
      await user.type(descriptionInput, "A new team description");

      expect(
        screen.getByDisplayValue("A new team description")
      ).toBeInTheDocument();
    });
  });

  describe("Dialog Open/Close", () => {
    it("should not render when open is false", () => {
      renderWithProviders(
        <TeamDialog open={false} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.queryByText("Create New Team")).not.toBeInTheDocument();
    });

    it("should render when open is true", () => {
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByText("Create New Team")).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("should show error for empty team name", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TeamDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const submitButton = screen.getByRole("button", {
        name: /create team/i,
      });
      await user.click(submitButton);

      // Zod validation should show error
      expect(
        await screen.findByText(/Team name is required/i)
      ).toBeInTheDocument();
    });
  });
});
