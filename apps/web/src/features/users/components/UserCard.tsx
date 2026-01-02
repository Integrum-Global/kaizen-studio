import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Avatar,
  AvatarFallback,
} from "@/components/ui";
import { MoreVertical, Trash2, Edit, ShieldCheck } from "lucide-react";
import type { User } from "../types";
import { UserRoleBadge } from "./UserRoleBadge";

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const statusVariants: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  active: "default",
  suspended: "destructive",
  deleted: "secondary",
};

export function UserCard({
  user,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-lg transition-all hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{user.name}</CardTitle>
              {user.mfa_enabled && (
                <ShieldCheck className="h-4 w-4 text-green-600" />
              )}
            </div>
            <CardDescription>{user.email}</CardDescription>
            <div className="flex items-center gap-2 flex-wrap">
              <UserRoleBadge role={user.role} />
              <Badge variant={statusVariants[user.status]}>{user.status}</Badge>
            </div>
          </div>
        </div>

        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canEdit && canDelete && <DropdownMenuSeparator />}
              {canDelete && user.role !== "org_owner" && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(user.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span>Created {new Date(user.created_at).toLocaleDateString()}</span>
          {user.last_login_at && (
            <>
              <span>•</span>
              <span>
                Last login {new Date(user.last_login_at).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
