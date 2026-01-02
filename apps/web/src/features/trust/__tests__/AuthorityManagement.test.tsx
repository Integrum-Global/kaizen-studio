/**
 * Phase 4: Authority Management Component Tests
 *
 * Tests for AuthorityManager, AuthorityCard, CreateAuthorityDialog, and DeactivateAuthorityDialog
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { AuthorityManager } from "../components/AuthorityManagement/AuthorityManager";
import { AuthorityCard } from "../components/AuthorityManagement/AuthorityCard";
import { CreateAuthorityDialog } from "../components/AuthorityManagement/CreateAuthorityDialog";
import { DeactivateAuthorityDialog } from "../components/AuthorityManagement/DeactivateAuthorityDialog";
import { createMockAuthority } from "./fixtures";
import { AuthorityType } from "../types";

// Mock hooks - using vi.hoisted to avoid hoisting issues
const mocks = vi.hoisted(() => ({
  mockCreateAuthority: vi.fn(),
  mockDeactivateAuthority: vi.fn(),
  mockToast: vi.fn(),
  mockUseAuthoritiesFiltered: vi.fn(() => ({
    data: [],
    isPending: false,
  })),
  mockUseCreateAuthority: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  mockUseDeactivateAuthority: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("../hooks", () => ({
  useAuthoritiesFiltered: mocks.mockUseAuthoritiesFiltered,
  useCreateAuthority: mocks.mockUseCreateAuthority,
  useDeactivateAuthority: mocks.mockUseDeactivateAuthority,
  // Additional hooks needed by AuthorityManager and its child components
  useUpdateAuthority: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useAuthority: vi.fn(() => ({
    data: null,
    isPending: false,
  })),
  useAuthorityById: vi.fn(() => ({
    data: null,
    isPending: false,
  })),
  useAuthorityAgents: vi.fn(() => ({
    data: [],
    isPending: false,
  })),
  useAuthorities: vi.fn(() => ({
    data: [],
    isPending: false,
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mocks.mockToast,
  }),
}));

describe("AuthorityManager", () => {
  const mockAuthorities = [
    createMockAuthority({ id: "auth-1", name: "Authority One" }),
    createMockAuthority({
      id: "auth-2",
      name: "Authority Two",
      type: AuthorityType.SYSTEM,
    }),
    createMockAuthority({
      id: "auth-3",
      name: "Authority Three",
      isActive: false,
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseAuthoritiesFiltered.mockReturnValue({
      data: mockAuthorities,
      isPending: false,
    });
    mocks.mockUseCreateAuthority.mockReturnValue({
      mutate: mocks.mockCreateAuthority,
      isPending: false,
    });
    mocks.mockUseDeactivateAuthority.mockReturnValue({
      mutate: mocks.mockDeactivateAuthority,
      isPending: false,
    });
  });

  it("renders authority list", () => {
    renderWithProviders(<AuthorityManager />);

    expect(screen.getByText("Authority One")).toBeInTheDocument();
    expect(screen.getByText("Authority Two")).toBeInTheDocument();
    expect(screen.getByText("Authority Three")).toBeInTheDocument();
  });

  it("shows search input", () => {
    renderWithProviders(<AuthorityManager />);

    const searchInput = screen.getByPlaceholderText(/Search authorities.../i);
    expect(searchInput).toBeInTheDocument();
  });

  it("shows filter controls", () => {
    renderWithProviders(<AuthorityManager />);

    // All comboboxes should be present (type, status, sort)
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes.length).toBeGreaterThanOrEqual(3);

    // Verify filter options exist
    expect(screen.getByText("All Types")).toBeInTheDocument();
    expect(screen.getByText("All Status")).toBeInTheDocument();
  });

  it("shows create button", () => {
    renderWithProviders(<AuthorityManager />);

    const createButton = screen.getByRole("button", { name: /Create Authority/i });
    expect(createButton).toBeInTheDocument();
  });

  it("filters authorities by type", async () => {
    const user = userEvent.setup();

    renderWithProviders(<AuthorityManager />);

    // Click the type filter dropdown
    const typeFilter = screen.getAllByRole("combobox")[0];
    await user.click(typeFilter);

    // Select System type
    const systemOption = screen.getByRole("option", { name: /System/i });
    await user.click(systemOption);

    // Verify the hook was called with the filter
    await waitFor(() => {
      expect(mocks.mockUseAuthoritiesFiltered).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuthorityType.SYSTEM,
        })
      );
    });
  });

  it("filters authorities by status", async () => {
    const user = userEvent.setup();

    renderWithProviders(<AuthorityManager />);

    // Find the status filter (second combobox)
    const comboboxes = screen.getAllByRole("combobox");
    const statusFilter = comboboxes[1];
    await user.click(statusFilter);

    // Select Active status
    const activeOption = screen.getByRole("option", { name: /^Active$/i });
    await user.click(activeOption);

    // Verify the hook was called with the filter
    await waitFor(() => {
      expect(mocks.mockUseAuthoritiesFiltered).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        })
      );
    });
  });

  it("shows dropdown menu with edit option", async () => {
    const user = userEvent.setup();

    renderWithProviders(<AuthorityManager />);

    // The dropdown triggers are the buttons with aria-haspopup="menu" attribute
    const dropdownTriggers = screen.getAllByRole("button", { expanded: false });
    const menuTrigger = dropdownTriggers.find(
      (btn) => btn.getAttribute("aria-haspopup") === "menu"
    );
    expect(menuTrigger).toBeTruthy();

    await user.click(menuTrigger!);

    // Dropdown should show Edit option
    const editOption = await screen.findByText(/^Edit$/i);
    expect(editOption).toBeInTheDocument();

    // Dropdown should show View Details and Deactivate options
    expect(screen.getByText(/View Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Deactivate/i)).toBeInTheDocument();
  });

  it("shows empty state when no authorities", () => {
    mocks.mockUseAuthoritiesFiltered.mockReturnValue({
      data: [],
      isPending: false,
    });

    renderWithProviders(<AuthorityManager />);

    expect(screen.getByText(/No Authorities Found/i)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mocks.mockUseAuthoritiesFiltered.mockReturnValue({
      data: null,
      isPending: true,
    });

    const { container } = renderWithProviders(<AuthorityManager />);

    // Should show skeleton loaders (they have animate-pulse class)
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("AuthorityCard", () => {
  const mockAuthority = createMockAuthority();
  const mockOnEdit = vi.fn();
  const mockOnDeactivate = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders authority name and type", () => {
    renderWithProviders(
      <AuthorityCard
        authority={mockAuthority}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText(mockAuthority.name)).toBeInTheDocument();
    expect(screen.getByText("Organization")).toBeInTheDocument();
  });

  it("shows agent count", () => {
    renderWithProviders(
      <AuthorityCard
        authority={mockAuthority}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Agent count is displayed - look for the specific text pattern in stats area
    const statsArea = screen.getByText(/42/).closest("div");
    expect(statsArea).toBeInTheDocument();
    // Also verify the label exists (may be in same div or adjacent)
    const agentsText = screen.getAllByText(/agents/i);
    expect(agentsText.length).toBeGreaterThanOrEqual(1);
  });

  it("shows status badge active", () => {
    renderWithProviders(
      <AuthorityCard
        authority={mockAuthority}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows status badge inactive", () => {
    const inactiveAuthority = createMockAuthority({ isActive: false });

    renderWithProviders(
      <AuthorityCard
        authority={inactiveAuthority}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows created date", () => {
    renderWithProviders(
      <AuthorityCard
        authority={mockAuthority}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onViewDetails={mockOnViewDetails}
      />
    );

    // The date format should be "MMM d, yyyy"
    expect(screen.getByText(/Created Jan/i)).toBeInTheDocument();
  });

  it("click calls onClick handler", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AuthorityCard
        authority={mockAuthority}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Click the card (it's a Card component with cursor-pointer)
    const card = screen.getByText(mockAuthority.name).closest(".cursor-pointer") as HTMLElement;
    expect(card).toBeTruthy();
    await user.click(card);

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockAuthority);
  });

  it("shows actions dropdown", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AuthorityCard
        authority={mockAuthority}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Find and click the dropdown trigger
    const dropdownButton = screen.getByRole("button");
    await user.click(dropdownButton);

    // Should show menu items
    expect(await screen.findByText("View Details")).toBeInTheDocument();
    expect(screen.getByText(/Edit/i)).toBeInTheDocument();
    expect(screen.getByText(/Deactivate/i)).toBeInTheDocument();
  });
});

describe("CreateAuthorityDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    renderWithProviders(
      <CreateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Dialog should show the title (appears as h2) and submit button
    const titles = screen.getAllByText("Create Authority");
    expect(titles.length).toBeGreaterThanOrEqual(1);
    // Dialog content should be visible
    expect(screen.getByLabelText(/Name \*/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <CreateAuthorityDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows form fields", () => {
    renderWithProviders(
      <CreateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByLabelText(/Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Parent Authority/i)).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CreateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Try to submit without filling required fields
    const createButton = screen.getByRole("button", { name: /Create Authority/i });
    await user.click(createButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it("calls onCreate with form data", async () => {
    const user = userEvent.setup();
    mocks.mockCreateAuthority.mockImplementation((data, options) => {
      options?.onSuccess?.(createMockAuthority({ name: data.name }));
    });

    renderWithProviders(
      <CreateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill in the form
    const nameInput = screen.getByLabelText(/Name \*/i);
    await user.type(nameInput, "New Authority");

    const descriptionInput = screen.getByLabelText(/Description/i);
    await user.type(descriptionInput, "Test description");

    // Submit the form
    const createButton = screen.getByRole("button", { name: /Create Authority/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mocks.mockCreateAuthority).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Authority",
          description: "Test description",
        }),
        expect.any(Object)
      );
    });
  });

  it("closes on cancel", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CreateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows success toast on successful creation", async () => {
    const user = userEvent.setup();
    const createdAuthority = createMockAuthority({ name: "New Authority" });
    mocks.mockCreateAuthority.mockImplementation((data, options) => {
      options?.onSuccess?.(createdAuthority);
    });

    renderWithProviders(
      <CreateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill and submit
    const nameInput = screen.getByLabelText(/Name \*/i);
    await user.type(nameInput, "New Authority");

    const createButton = screen.getByRole("button", { name: /Create Authority/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mocks.mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Authority Created",
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(createdAuthority);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("DeactivateAuthorityDialog", () => {
  const mockAuthority = createMockAuthority();
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders warning message", () => {
    renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        authority={mockAuthority}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/Warning:/i)).toBeInTheDocument();
    expect(screen.getByText(/Deactivating this authority will affect/i)).toBeInTheDocument();
  });

  it("requires reason input", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        authority={mockAuthority}
        onSuccess={mockOnSuccess}
      />
    );

    const deactivateButton = screen.getByRole("button", { name: /Deactivate Authority/i });
    await user.click(deactivateButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Reason must be at least 10 characters/i)).toBeInTheDocument();
    });
  });

  it("shows authority information", () => {
    renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        authority={mockAuthority}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(mockAuthority.name)).toBeInTheDocument();
    expect(screen.getByText(/organization/i)).toBeInTheDocument();
    // Agent count appears multiple times (in warning and info section)
    const agentCounts = screen.getAllByText("42");
    expect(agentCounts.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onDeactivate with reason", async () => {
    const user = userEvent.setup();
    const updatedAuthority = createMockAuthority({ isActive: false });
    mocks.mockDeactivateAuthority.mockImplementation((data, options) => {
      options?.onSuccess?.(updatedAuthority);
    });

    renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        authority={mockAuthority}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill in reason
    const reasonInput = screen.getByPlaceholderText(/Explain why/i);
    await user.type(reasonInput, "No longer needed for testing purposes");

    // Submit
    const deactivateButton = screen.getByRole("button", { name: /Deactivate Authority/i });
    await user.click(deactivateButton);

    await waitFor(() => {
      expect(mocks.mockDeactivateAuthority).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockAuthority.id,
          reason: "No longer needed for testing purposes",
        }),
        expect.any(Object)
      );
    });
  });

  it("closes on cancel", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        authority={mockAuthority}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows success toast on successful deactivation", async () => {
    const user = userEvent.setup();
    const deactivatedAuthority = createMockAuthority({ isActive: false });
    mocks.mockDeactivateAuthority.mockImplementation((data, options) => {
      options?.onSuccess?.(deactivatedAuthority);
    });

    renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        authority={mockAuthority}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill and submit
    const reasonInput = screen.getByPlaceholderText(/Explain why/i);
    await user.type(reasonInput, "Security policy update");

    const deactivateButton = screen.getByRole("button", { name: /Deactivate Authority/i });
    await user.click(deactivateButton);

    await waitFor(() => {
      expect(mocks.mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Authority Deactivated",
        })
      );
      expect(mockOnSuccess).toHaveBeenCalledWith(deactivatedAuthority);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("returns null when authority is null", () => {
    const { container } = renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        authority={null}
        onSuccess={mockOnSuccess}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe("CreateAuthorityDialog - Error Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseCreateAuthority.mockReturnValue({
      mutate: mocks.mockCreateAuthority,
      isPending: false,
    });
    mocks.mockCreateAuthority.mockImplementation((data, options) => {
      options?.onError?.(new Error("Creation failed"));
    });
  });

  it("shows error toast on creation failure", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CreateAuthorityDialog
        open={true}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    // Fill and submit
    const nameInput = screen.getByLabelText(/Name \*/i);
    await user.type(nameInput, "New Authority");

    const createButton = screen.getByRole("button", { name: /Create Authority/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mocks.mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Failed to Create Authority",
          variant: "destructive",
        })
      );
    });
  });
});

describe("DeactivateAuthorityDialog - Error Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseDeactivateAuthority.mockReturnValue({
      mutate: mocks.mockDeactivateAuthority,
      isPending: false,
    });
    mocks.mockDeactivateAuthority.mockImplementation((data, options) => {
      options?.onError?.(new Error("Deactivation failed"));
    });
  });

  it("shows error toast on deactivation failure", async () => {
    const user = userEvent.setup();
    const mockAuthority = createMockAuthority();

    renderWithProviders(
      <DeactivateAuthorityDialog
        open={true}
        onOpenChange={vi.fn()}
        authority={mockAuthority}
        onSuccess={vi.fn()}
      />
    );

    // Fill and submit
    const reasonInput = screen.getByPlaceholderText(/Explain why/i);
    await user.type(reasonInput, "Test reason for deactivation");

    const deactivateButton = screen.getByRole("button", { name: /Deactivate Authority/i });
    await user.click(deactivateButton);

    await waitFor(() => {
      expect(mocks.mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Failed to Deactivate Authority",
          variant: "destructive",
        })
      );
    });
  });
});
