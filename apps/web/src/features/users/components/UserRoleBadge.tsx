import { Badge } from "@/components/ui";
import type { UserRole } from "../types";

interface UserRoleBadgeProps {
  role: UserRole;
}

const roleVariants: Record<
  UserRole,
  "default" | "destructive" | "secondary" | "outline"
> = {
  org_owner: "default",
  org_admin: "default",
  developer: "secondary",
  viewer: "outline",
};

const roleLabels: Record<UserRole, string> = {
  org_owner: "Owner",
  org_admin: "Admin",
  developer: "Developer",
  viewer: "Viewer",
};

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <Badge variant={roleVariants[role]} className="capitalize">
      {roleLabels[role]}
    </Badge>
  );
}
