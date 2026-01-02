import { useState } from "react";
import { OrganizationCard } from "./OrganizationCard";
import { OrganizationDialog } from "./OrganizationDialog";
import { useOrganizations, useDeleteOrganization } from "../hooks";
import { Input, Button, Skeleton } from "@/components/ui";
import { Search, Plus } from "lucide-react";
import type { Organization, OrganizationFilters, OrganizationStatus } from "../types";
import { useToast } from "@/hooks/use-toast";

interface OrganizationListProps {
  onViewUsers?: (organization: Organization) => void;
}

export function OrganizationList({ onViewUsers }: OrganizationListProps) {
  const [filters, setFilters] = useState<OrganizationFilters>({
    limit: 50,
    offset: 0,
  });
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isPending, error } = useOrganizations(filters);
  const deleteOrganization = useDeleteOrganization();
  const { toast } = useToast();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, offset: 0 }));
  };

  const handleStatusFilter = (status: OrganizationStatus | "all") => {
    setFilters((prev) => ({
      ...prev,
      status: status === "all" ? undefined : status,
      offset: 0,
    }));
  };

  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this organization? This will also delete all associated data."
      )
    ) {
      return;
    }

    try {
      await deleteOrganization.mutateAsync(id);
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <OrganizationListFilters
          filters={filters}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onCreateClick={() => setIsCreateDialogOpen(true)}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <OrganizationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load organizations</p>
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="space-y-6">
        <OrganizationListFilters
          filters={filters}
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onCreateClick={() => setIsCreateDialogOpen(true)}
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No organizations found</p>
          <p className="text-sm text-muted-foreground">
            {filters.status || filters.search
              ? "Try adjusting your filters"
              : "Create your first organization"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>
        <OrganizationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OrganizationListFilters
        filters={filters}
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.records.map((organization) => (
          <OrganizationCard
            key={organization.id}
            organization={organization}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewUsers={onViewUsers}
          />
        ))}
      </div>

      {selectedOrganization && (
        <OrganizationDialog
          organization={selectedOrganization}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      <OrganizationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

interface OrganizationListFiltersProps {
  filters: OrganizationFilters;
  onSearch: (value: string) => void;
  onStatusFilter: (status: OrganizationStatus | "all") => void;
  onCreateClick: () => void;
}

function OrganizationListFilters({
  filters,
  onSearch,
  onStatusFilter,
  onCreateClick,
}: OrganizationListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={filters.search || ""}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filters.status || "all"}
          onChange={(e) =>
            onStatusFilter(e.target.value as OrganizationStatus | "all")
          }
          className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create Organization
      </Button>
    </div>
  );
}

function OrganizationCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
