import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PermissionGate, PermissionDenied } from "../PermissionGate";

// Mock the hooks
vi.mock("../../hooks", () => ({
  useCanPerform: vi.fn(),
}));

import { useCanPerform } from "../../hooks";

const mockUseCanPerform = useCanPerform as ReturnType<typeof vi.fn>;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("PermissionGate", () => {
  it("renders children when permission is allowed", () => {
    mockUseCanPerform.mockReturnValue({
      data: { allowed: true },
      isLoading: false,
    });

    renderWithProviders(
      <PermissionGate resource="agent" action="create">
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders fallback when permission is denied", () => {
    mockUseCanPerform.mockReturnValue({
      data: { allowed: false },
      isLoading: false,
    });

    renderWithProviders(
      <PermissionGate
        resource="agent"
        action="delete"
        fallback={<span>Access Denied</span>}
      >
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("renders nothing by default when permission is denied", () => {
    mockUseCanPerform.mockReturnValue({
      data: { allowed: false },
      isLoading: false,
    });

    const { container } = renderWithProviders(
      <PermissionGate resource="agent" action="delete">
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it("renders nothing while loading by default", () => {
    mockUseCanPerform.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderWithProviders(
      <PermissionGate resource="agent" action="create">
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(container.textContent).toBe("");
  });

  it("renders loading indicator when showLoading is true", () => {
    mockUseCanPerform.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithProviders(
      <PermissionGate resource="agent" action="create" showLoading>
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.getByText("...")).toBeInTheDocument();
  });
});

describe("PermissionDenied", () => {
  it("renders default message", () => {
    render(<PermissionDenied />);

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You don't have permission to access this resource.")
    ).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<PermissionDenied message="Custom access denied message" />);

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("Custom access denied message")
    ).toBeInTheDocument();
  });
});
