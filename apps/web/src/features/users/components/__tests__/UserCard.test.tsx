import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserCard } from "../UserCard";
import type { User } from "../../types";

describe("UserCard", () => {
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

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render user with basic information", () => {
    const user = createMockUser({
      name: "John Doe",
      email: "john@example.com",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("should render user avatar with initials", () => {
    const user = createMockUser({
      name: "John Doe",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should render single initial for single name", () => {
    const user = createMockUser({
      name: "John",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("should render user role badge", () => {
    const user = createMockUser({
      role: "org_owner",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("should render active status badge", () => {
    const user = createMockUser({
      status: "active",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("should render suspended status badge with correct variant", () => {
    const user = createMockUser({
      status: "suspended",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const badge = screen.getByText("suspended");
    expect(badge).toBeInTheDocument();
  });

  it("should render deleted status badge with correct variant", () => {
    const user = createMockUser({
      status: "deleted",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const badge = screen.getByText("deleted");
    expect(badge).toBeInTheDocument();
  });

  it("should display MFA enabled icon when mfa_enabled is true", () => {
    const user = createMockUser({
      mfa_enabled: true,
    });

    const { container } = render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const mfaIcon = container.querySelector(".text-green-600");
    expect(mfaIcon).toBeInTheDocument();
  });

  it("should not display MFA icon when mfa_enabled is false", () => {
    const user = createMockUser({
      mfa_enabled: false,
    });

    const { container } = render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const mfaIcon = container.querySelector(".text-green-600");
    expect(mfaIcon).not.toBeInTheDocument();
  });

  it("should display created date", () => {
    const user = createMockUser({
      created_at: "2024-01-15T10:30:00Z",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText(/Created/i)).toBeInTheDocument();
  });

  it("should display last login date when available", () => {
    const user = createMockUser({
      last_login_at: "2024-01-20T10:30:00Z",
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText(/Last login/i)).toBeInTheDocument();
  });

  it("should not display last login date when not available", () => {
    const user = createMockUser({
      last_login_at: undefined,
    });

    render(
      <UserCard user={user} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.queryByText(/Last login/i)).not.toBeInTheDocument();
  });

  it("should call onEdit when Edit is clicked", async () => {
    const user = userEvent.setup();
    const mockUser = createMockUser();

    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Edit
    const editButton = screen.getByText("Edit");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it("should call onDelete when Delete is clicked", async () => {
    const user = userEvent.setup();
    const mockUser = createMockUser();

    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canDelete={true}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Delete
    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockUser.id);
  });

  it("should not show Edit option when canEdit is false", async () => {
    const user = userEvent.setup();
    const mockUser = createMockUser();

    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={false}
        canDelete={true}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("should not show Delete option when canDelete is false", async () => {
    const user = userEvent.setup();
    const mockUser = createMockUser();

    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={false}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("should not show Delete option for org_owner role", async () => {
    const user = userEvent.setup();
    const mockUser = createMockUser({
      role: "org_owner",
    });

    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={true}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("should not show menu button when canEdit and canDelete are false", () => {
    const mockUser = createMockUser();

    render(
      <UserCard
        user={mockUser}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={false}
        canDelete={false}
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should apply hover styles to card", () => {
    const mockUser = createMockUser();

    const { container } = render(
      <UserCard user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const card = container.querySelector('[class*="hover:shadow-lg"]');
    expect(card).toBeInTheDocument();
  });

  it("should render different user roles correctly", () => {
    const roles = ["org_owner", "org_admin", "developer", "viewer"] as const;
    const labels = ["Owner", "Admin", "Developer", "Viewer"];

    roles.forEach((role, index) => {
      const mockUser = createMockUser({ role });
      const { unmount } = render(
        <UserCard user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );
      expect(screen.getByText(labels[index]!)).toBeInTheDocument();
      unmount();
    });
  });

  it("should render different user statuses correctly", () => {
    const statuses = ["active", "suspended", "deleted"] as const;

    statuses.forEach((status) => {
      const mockUser = createMockUser({ status });
      const { unmount } = render(
        <UserCard user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />
      );
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    });
  });

  it("should truncate initials to 2 characters for long names", () => {
    const mockUser = createMockUser({
      name: "John Michael Alexander Doe",
    });

    render(
      <UserCard user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    // Should only show "JM" (first 2 initials)
    expect(screen.getByText("JM")).toBeInTheDocument();
  });

  it("should display user information in correct sections", () => {
    const mockUser = createMockUser({
      name: "Jane Smith",
      email: "jane@example.com",
      status: "active",
      role: "developer",
    });

    render(
      <UserCard user={mockUser} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    // Name and email should be in header
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();

    // Role and status badges should be visible
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();

    // Created date should be in content section
    expect(screen.getByText(/Created/i)).toBeInTheDocument();
  });
});
