import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoleCard } from "../RoleCard";
import type { Role } from "../../types";

const mockRole: Role = {
  id: "role-1",
  name: "Test Role",
  description: "A test role for testing",
  permissions: [
    { id: "p1", resource: "agent", action: "create" },
    { id: "p2", resource: "agent", action: "read" },
    { id: "p3", resource: "pipeline", action: "read" },
  ],
  isSystem: false,
  memberCount: 5,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("RoleCard", () => {
  it("renders role information", () => {
    render(<RoleCard role={mockRole} />);

    expect(screen.getByText("Test Role")).toBeInTheDocument();
    expect(screen.getByText("A test role for testing")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // permissions count
    expect(screen.getByText("2")).toBeInTheDocument(); // resources count
    expect(screen.getByText("5")).toBeInTheDocument(); // member count
  });

  it("renders resource badges", () => {
    render(<RoleCard role={mockRole} />);

    expect(screen.getByText("agent")).toBeInTheDocument();
    expect(screen.getByText("pipeline")).toBeInTheDocument();
  });

  it("displays system badge for system roles", () => {
    const systemRole: Role = { ...mockRole, isSystem: true };
    render(<RoleCard role={systemRole} />);

    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("calls onViewMembers when members button clicked", () => {
    const onViewMembers = vi.fn();
    render(<RoleCard role={mockRole} onViewMembers={onViewMembers} />);

    fireEvent.click(screen.getByRole("button", { name: /members/i }));
    expect(onViewMembers).toHaveBeenCalledWith(mockRole);
  });

  it("calls onEdit when edit button clicked", () => {
    const onEdit = vi.fn();
    render(<RoleCard role={mockRole} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockRole);
  });

  it("hides edit and delete buttons for system roles", () => {
    const systemRole: Role = { ...mockRole, isSystem: true };
    render(<RoleCard role={systemRole} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: /edit/i })
    ).not.toBeInTheDocument();
  });

  it('shows "+X more" badge when many resources', () => {
    const roleWithManyResources: Role = {
      ...mockRole,
      permissions: [
        { id: "p1", resource: "agent", action: "create" },
        { id: "p2", resource: "pipeline", action: "read" },
        { id: "p3", resource: "deployment", action: "read" },
        { id: "p4", resource: "gateway", action: "read" },
        { id: "p5", resource: "team", action: "read" },
        { id: "p6", resource: "user", action: "read" },
        { id: "p7", resource: "settings", action: "read" },
      ],
    };

    render(<RoleCard role={roleWithManyResources} />);

    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });
});
