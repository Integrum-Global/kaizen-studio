import { useState } from "react";
import { UserCard } from "./UserCard";
import { UserDialog } from "./UserDialog";
import { useUsers, useDeleteUser, useCurrentUser } from "../hooks";
import { Button, Skeleton } from "@/components/ui";
import { Plus } from "lucide-react";
import type { User, UserFilters, UserRole, UserStatus } from "../types";
import { useToast } from "@/hooks/use-toast";

export function UserList() {
  const [filters, setFilters] = useState<UserFilters>({
    limit: 50,
    offset: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isPending, error } = useUsers(filters);
  const { data: currentUser } = useCurrentUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();

  const isAdmin =
    currentUser?.role === "org_owner" || currentUser?.role === "org_admin";

  const handleRoleFilter = (role: UserRole | "all") => {
    setFilters((prev: UserFilters) => ({
      ...prev,
      role: role === "all" ? undefined : role,
      offset: 0,
    }));
  };

  const handleStatusFilter = (status: UserStatus | "all") => {
    setFilters((prev: UserFilters) => ({
      ...prev,
      status: status === "all" ? undefined : status,
      offset: 0,
    }));
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await deleteUser.mutateAsync(id);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <UserListFilters
          filters={filters}
          onRoleFilter={handleRoleFilter}
          onStatusFilter={handleStatusFilter}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load users</p>
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="space-y-6">
        <UserListFilters
          filters={filters}
          onRoleFilter={handleRoleFilter}
          onStatusFilter={handleStatusFilter}
          onCreateClick={
            isAdmin ? () => setIsCreateDialogOpen(true) : undefined
          }
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No users found</p>
          <p className="text-sm text-muted-foreground">
            {filters.role || filters.status
              ? "Try adjusting your filters"
              : "Add users to your organization"}
          </p>
          {isAdmin && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          )}
        </div>
        {isAdmin && (
          <UserDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserListFilters
        filters={filters}
        onRoleFilter={handleRoleFilter}
        onStatusFilter={handleStatusFilter}
        onCreateClick={isAdmin ? () => setIsCreateDialogOpen(true) : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.records.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={isAdmin || currentUser?.id === user.id}
            canDelete={isAdmin && currentUser?.id !== user.id}
          />
        ))}
      </div>

      {selectedUser && (
        <UserDialog
          user={selectedUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      {isAdmin && (
        <UserDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      )}
    </div>
  );
}

interface UserListFiltersProps {
  filters: UserFilters;
  onRoleFilter: (role: UserRole | "all") => void;
  onStatusFilter: (status: UserStatus | "all") => void;
  onCreateClick?: () => void;
}

function UserListFilters({
  filters,
  onRoleFilter,
  onStatusFilter,
  onCreateClick,
}: UserListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
        <select
          value={filters.role || "all"}
          onChange={(e) => onRoleFilter(e.target.value as UserRole | "all")}
          className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Roles</option>
          <option value="org_owner">Owner</option>
          <option value="org_admin">Admin</option>
          <option value="developer">Developer</option>
          <option value="viewer">Viewer</option>
        </select>

        <select
          value={filters.status || "all"}
          onChange={(e) => onStatusFilter(e.target.value as UserStatus | "all")}
          className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      {onCreateClick && (
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      )}
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
