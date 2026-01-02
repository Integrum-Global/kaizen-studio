import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Pencil, Trash2 } from "lucide-react";
import type { Role } from "../types";

interface RoleCardProps {
  role: Role;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onViewMembers?: (role: Role) => void;
}

export function RoleCard({
  role,
  onEdit,
  onDelete,
  onViewMembers,
}: RoleCardProps) {
  const permissionCount = role.permissions.length;
  const resourceCount = new Set(role.permissions.map((p) => p.resource)).size;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {role.name}
                {role.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </CardTitle>
              {role.description && (
                <CardDescription>{role.description}</CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground">Permissions</p>
            <p className="font-medium">{permissionCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Resources</p>
            <p className="font-medium">{resourceCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Members</p>
            <p className="font-medium">{role.memberCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {Array.from(new Set(role.permissions.map((p) => p.resource)))
            .slice(0, 5)
            .map((resource) => (
              <Badge key={resource} variant="outline" className="text-xs">
                {resource}
              </Badge>
            ))}
          {resourceCount > 5 && (
            <Badge variant="outline" className="text-xs">
              +{resourceCount - 5} more
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewMembers?.(role)}
          >
            <Users className="h-4 w-4 mr-1" />
            Members
          </Button>
          {!role.isSystem && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(role)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete?.(role)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
