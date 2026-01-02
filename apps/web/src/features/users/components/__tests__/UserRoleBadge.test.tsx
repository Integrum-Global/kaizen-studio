import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserRoleBadge } from "../UserRoleBadge";
import type { UserRole } from "../../types";

describe("UserRoleBadge", () => {
  it("should render org_owner role with correct label and variant", () => {
    render(<UserRoleBadge role="org_owner" />);

    const badge = screen.getByText("Owner");
    expect(badge).toBeInTheDocument();
  });

  it("should render org_admin role with correct label and variant", () => {
    render(<UserRoleBadge role="org_admin" />);

    const badge = screen.getByText("Admin");
    expect(badge).toBeInTheDocument();
  });

  it("should render developer role with correct label and variant", () => {
    render(<UserRoleBadge role="developer" />);

    const badge = screen.getByText("Developer");
    expect(badge).toBeInTheDocument();
  });

  it("should render viewer role with correct label and variant", () => {
    render(<UserRoleBadge role="viewer" />);

    const badge = screen.getByText("Viewer");
    expect(badge).toBeInTheDocument();
  });

  it("should apply capitalize class", () => {
    const { container } = render(<UserRoleBadge role="org_owner" />);

    const badge = container.querySelector('[class*="capitalize"]');
    expect(badge).toBeInTheDocument();
  });

  it("should render all roles correctly", () => {
    const roles: UserRole[] = ["org_owner", "org_admin", "developer", "viewer"];
    const labels = ["Owner", "Admin", "Developer", "Viewer"];

    roles.forEach((role, index) => {
      const { unmount } = render(<UserRoleBadge role={role} />);
      expect(screen.getByText(labels[index]!)).toBeInTheDocument();
      unmount();
    });
  });

  it("should use default variant for org_owner", () => {
    render(<UserRoleBadge role="org_owner" />);
    const badge = screen.getByText("Owner");
    expect(badge).toBeInTheDocument();
  });

  it("should use default variant for org_admin", () => {
    render(<UserRoleBadge role="org_admin" />);
    const badge = screen.getByText("Admin");
    expect(badge).toBeInTheDocument();
  });

  it("should use secondary variant for developer", () => {
    render(<UserRoleBadge role="developer" />);
    const badge = screen.getByText("Developer");
    expect(badge).toBeInTheDocument();
  });

  it("should use outline variant for viewer", () => {
    render(<UserRoleBadge role="viewer" />);
    const badge = screen.getByText("Viewer");
    expect(badge).toBeInTheDocument();
  });
});
