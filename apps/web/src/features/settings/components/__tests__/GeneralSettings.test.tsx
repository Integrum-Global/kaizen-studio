import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GeneralSettings } from "../GeneralSettings";
import * as hooks from "../../hooks";

// Mock the hooks
vi.mock("../../hooks", () => ({
  useOrganizationSettings: vi.fn(),
  useUpdateOrganizationSettings: vi.fn(),
}));

const mockSettings = {
  id: "1",
  organizationId: "org-1",
  name: "Test Organization",
  theme: "light" as const,
  timezone: "UTC",
  language: "en",
  notifications: {
    email: true,
    push: true,
    slack: false,
    digest: false,
  },
  security: {
    mfaEnabled: false,
    sessionTimeout: 60,
    ipWhitelist: [],
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("GeneralSettings", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <GeneralSettings />
      </QueryClientProvider>
    );
  };

  it("should render loading state", () => {
    vi.mocked(hooks.useOrganizationSettings).mockReturnValue({
      data: undefined,
      isPending: true,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    vi.mocked(hooks.useUpdateOrganizationSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render settings form", () => {
    vi.mocked(hooks.useOrganizationSettings).mockReturnValue({
      data: mockSettings,
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(hooks.useUpdateOrganizationSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText("General Settings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Organization")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  it("should update organization name", async () => {
    const user = userEvent.setup();
    const mutateMock = vi.fn();

    vi.mocked(hooks.useOrganizationSettings).mockReturnValue({
      data: mockSettings,
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(hooks.useUpdateOrganizationSettings).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as any);

    renderComponent();

    const nameInput = screen.getByDisplayValue("Test Organization");
    await user.clear(nameInput);
    await user.type(nameInput, "New Organization Name");

    const saveButton = screen.getByText("Save Changes");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith({
        name: "New Organization Name",
        timezone: "UTC",
        language: "en",
      });
    });
  });

  it("should have timezone selector", async () => {
    vi.mocked(hooks.useOrganizationSettings).mockReturnValue({
      data: mockSettings,
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(hooks.useUpdateOrganizationSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    // Verify timezone select is rendered with current value
    const timezoneSelect = screen.getByRole("combobox", { name: /timezone/i });
    expect(timezoneSelect).toBeInTheDocument();
    // UTC appears multiple times (label + visible select + hidden select), check at least one exists
    const utcElements = screen.getAllByText("UTC");
    expect(utcElements.length).toBeGreaterThan(0);
  });

  it("should disable save button while updating", () => {
    vi.mocked(hooks.useOrganizationSettings).mockReturnValue({
      data: mockSettings,
      isPending: false,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(hooks.useUpdateOrganizationSettings).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as any);

    renderComponent();

    const saveButton = screen.getByText("Saving...");
    expect(saveButton).toBeDisabled();
  });
});
