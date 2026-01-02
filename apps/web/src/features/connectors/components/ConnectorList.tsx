import { useState } from "react";
import { ConnectorCard } from "./ConnectorCard";
import { ConnectorDialog } from "./ConnectorDialog";
import { ConnectorTestButton } from "./ConnectorTestButton";
import { useConnectors, useDeleteConnector } from "../hooks";
import { Button, Skeleton } from "@/components/ui";
import { Plus } from "lucide-react";
import type { Connector, ConnectorFilters, ConnectorType } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";

export function ConnectorList() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<ConnectorFilters>({
    page: 1,
    page_size: 12,
  });
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [testConnector, setTestConnector] = useState<Connector | null>(null);

  // Include organization_id in the filters - required by backend
  const { data, isPending, error } = useConnectors({
    ...filters,
    organization_id: user?.organization_id,
  });
  const deleteConnector = useDeleteConnector();
  const { toast } = useToast();

  const handleTypeFilter = (type: ConnectorType | "all") => {
    setFilters((prev) => ({
      ...prev,
      connector_type: type === "all" ? undefined : type,
      page: 1,
    }));
  };

  const handleEdit = (connector: Connector) => {
    setSelectedConnector(connector);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connector?")) {
      return;
    }

    try {
      await deleteConnector.mutateAsync(id);
      toast({
        title: "Success",
        description: "Connector deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete connector",
        variant: "destructive",
      });
    }
  };

  const handleTest = (connector: Connector) => {
    setTestConnector(connector);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <ConnectorListFilters
          filters={filters}
          onTypeFilter={handleTypeFilter}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ConnectorCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load connectors</p>
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="space-y-6">
        <ConnectorListFilters
          filters={filters}
          onTypeFilter={handleTypeFilter}
          onCreateClick={() => setIsCreateDialogOpen(true)}
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No connectors found</p>
          <p className="text-sm text-muted-foreground">
            {filters.connector_type
              ? "Try adjusting your filters"
              : "Create your first connector to get started"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Connector
          </Button>
        </div>
        <ConnectorDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / (filters.page_size || 12));
  const hasNext = (filters.page || 1) < totalPages;
  const hasPrev = (filters.page || 1) > 1;

  return (
    <div className="space-y-6">
      <ConnectorListFilters
        filters={filters}
        onTypeFilter={handleTypeFilter}
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.records.map((connector) => (
          <ConnectorCard
            key={connector.id}
            connector={connector}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTest={handleTest}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => handlePageChange(filters.page! - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {filters.page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => handlePageChange(filters.page! + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {selectedConnector && (
        <ConnectorDialog
          connector={selectedConnector}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      <ConnectorDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {testConnector && (
        <ConnectorTestButton
          connector={testConnector}
          onClose={() => setTestConnector(null)}
        />
      )}
    </div>
  );
}

interface ConnectorListFiltersProps {
  filters: ConnectorFilters;
  onTypeFilter: (type: ConnectorType | "all") => void;
  onCreateClick?: () => void;
}

function ConnectorListFilters({
  filters,
  onTypeFilter,
  onCreateClick,
}: ConnectorListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
        <select
          value={filters.connector_type || "all"}
          onChange={(e) =>
            onTypeFilter(e.target.value as ConnectorType | "all")
          }
          className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Types</option>
          <option value="database">Database</option>
          <option value="cloud">Cloud</option>
          <option value="email">Email</option>
          <option value="messaging">Messaging</option>
          <option value="storage">Storage</option>
          <option value="api">API</option>
        </select>
      </div>
      {onCreateClick && (
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Connector
        </Button>
      )}
    </div>
  );
}

function ConnectorCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
