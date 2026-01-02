import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { ApiKeyDialog } from "../ApiKeyDialog";
import { apiKeysApi } from "../../api";
import type { NewApiKeyResponse } from "../../types";

// Mock the APIs
vi.mock("../../api", () => ({
  apiKeysApi: {
    create: vi.fn(),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("ApiKeyDialog", () => {
  const mockOnOpenChange = vi.fn();

  const createMockNewApiKeyResponse = (): NewApiKeyResponse => ({
    key: {
      id: "key-123",
      name: "Test API Key",
      key: "kks_abc...xyz",
      prefix: "kks_abc",
      permissions: ["read", "write"],
      scopes: ["agents"],
      status: "active",
      createdBy: "user-789",
      createdAt: "2024-01-01T00:00:00Z",
    },
    fullKey: "kks_abc123def456ghi789",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("should render create dialog", () => {
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByText("Create New API Key")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create api key/i })
      ).toBeInTheDocument();
    });

    it("should show form fields", () => {
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Check for form field labels
      expect(screen.getByText("API Key Name")).toBeInTheDocument();
      expect(screen.getByText("Permissions")).toBeInTheDocument();
      expect(screen.getByText("Scopes")).toBeInTheDocument();
      expect(
        screen.getByText("Expiration Date (Optional)")
      ).toBeInTheDocument();
    });

    it("should show permission checkboxes", () => {
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Check for permission options
      expect(screen.getByText("Read")).toBeInTheDocument();
      expect(screen.getByText("Write")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should show scope checkboxes", () => {
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Check for scope options
      expect(screen.getByText("Agents")).toBeInTheDocument();
      expect(screen.getByText("Deployments")).toBeInTheDocument();
      expect(screen.getByText("Pipelines")).toBeInTheDocument();
      expect(screen.getByText("API Keys")).toBeInTheDocument();
    });

    it("should call onOpenChange when cancel is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Form Interaction", () => {
    it("should update name input", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const nameInput = screen.getByPlaceholderText("My API Key");
      await user.type(nameInput, "Production Key");

      expect(screen.getByDisplayValue("Production Key")).toBeInTheDocument();
    });

    it("should toggle permission checkboxes", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const readCheckbox = screen.getByRole("checkbox", {
        name: /read/i,
      });
      await user.click(readCheckbox);

      // Checkbox should be checked
      expect(readCheckbox).toBeChecked();
    });

    it("should toggle scope checkboxes", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const agentsCheckbox = screen.getByRole("checkbox", {
        name: /agents/i,
      });
      await user.click(agentsCheckbox);

      // Checkbox should be checked
      expect(agentsCheckbox).toBeChecked();
    });
  });

  describe("Form Submission", () => {
    it("should create API key successfully and show reveal dialog", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockNewApiKeyResponse();
      vi.mocked(apiKeysApi.create).mockResolvedValue(mockResponse);

      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Fill in the form
      const nameInput = screen.getByPlaceholderText("My API Key");
      await user.type(nameInput, "Test Key");

      // Select at least one permission
      const readCheckbox = screen.getByRole("checkbox", {
        name: /read/i,
      });
      await user.click(readCheckbox);

      // Submit form
      await user.click(screen.getByRole("button", { name: /create api key/i }));

      // Wait for API call
      await waitFor(() => {
        expect(apiKeysApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Key",
            permissions: expect.arrayContaining(["read"]),
          })
        );
      });

      // Dialog should close
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Reveal dialog should open with full key
      await waitFor(() => {
        expect(
          screen.getByText("API Key Created Successfully")
        ).toBeInTheDocument();
        expect(screen.getByText("kks_abc123def456ghi789")).toBeInTheDocument();
      });
    });

    it("should validate required fields", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Try to submit without filling required fields
      await user.click(screen.getByRole("button", { name: /create api key/i }));

      // Should show validation errors
      await waitFor(() => {
        expect(
          screen.getByText(/api key name is required/i)
        ).toBeInTheDocument();
      });
    });

    it("should require at least one permission", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Fill name but no permissions
      const nameInput = screen.getByPlaceholderText("My API Key");
      await user.type(nameInput, "Test Key");

      // Submit form
      await user.click(screen.getByRole("button", { name: /create api key/i }));

      // Should show validation error for permissions
      await waitFor(() => {
        expect(
          screen.getByText(/at least one permission is required/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Dialog Open/Close", () => {
    it("should not render when open is false", () => {
      renderWithProviders(
        <ApiKeyDialog open={false} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.queryByText("Create New API Key")).not.toBeInTheDocument();
    });

    it("should render when open is true", () => {
      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByText("Create New API Key")).toBeInTheDocument();
    });
  });

  describe("Reveal Dialog", () => {
    it("should show warning about saving the key", async () => {
      const user = userEvent.setup();
      const mockResponse = createMockNewApiKeyResponse();
      vi.mocked(apiKeysApi.create).mockResolvedValue(mockResponse);

      renderWithProviders(
        <ApiKeyDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Fill and submit form
      await user.type(screen.getByPlaceholderText("My API Key"), "Test Key");
      await user.click(screen.getByRole("checkbox", { name: /read/i }));
      await user.click(screen.getByRole("button", { name: /create api key/i }));

      // Check for warning message
      await waitFor(() => {
        expect(
          screen.getByText(/make sure to copy your api key now/i)
        ).toBeInTheDocument();
      });
    });
  });
});
