import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { MoreVertical, Pencil, Trash2, Users, Building2 } from "lucide-react";
import type { Organization } from "../types";

interface OrganizationCardProps {
  organization: Organization;
  onEdit?: (organization: Organization) => void;
  onDelete?: (id: string) => void;
  onViewUsers?: (organization: Organization) => void;
}

const statusColors: Record<string, "default" | "destructive" | "secondary"> = {
  active: "default",
  suspended: "destructive",
};

const planBadgeColors: Record<string, "default" | "secondary" | "outline"> = {
  free: "secondary",
  pro: "default",
  enterprise: "outline",
};

export function OrganizationCard({
  organization,
  onEdit,
  onDelete,
  onViewUsers,
}: OrganizationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {organization.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground truncate">
                {organization.slug}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewUsers && (
                <DropdownMenuItem onClick={() => onViewUsers(organization)}>
                  <Users className="mr-2 h-4 w-4" />
                  View Users
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(organization)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {(onViewUsers || onEdit) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(organization.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusColors[organization.status] || "secondary"}>
            {organization.status}
          </Badge>
          <Badge variant={planBadgeColors[organization.plan_tier] || "secondary"}>
            {organization.plan_tier}
          </Badge>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Created {new Date(organization.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
