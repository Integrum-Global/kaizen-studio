import { useState } from "react";
import { DeploymentCard } from "./DeploymentCard";
import { DeploymentDialog } from "./DeploymentDialog";
import {
  useDeployments,
  useDeleteDeployment,
  useStartDeployment,
  useStopDeployment,
} from "../hooks";
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import { Search, Filter } from "lucide-react";
import type { Deployment, DeploymentFilters } from "../types";
import { useToast } from "@/hooks/use-toast";

export function DeploymentList() {
  const [filters, setFilters] = useState<DeploymentFilters>({
    page: 1,
    page_size: 12,
  });
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data, isPending, error } = useDeployments(filters);
  const deleteDeployment = useDeleteDeployment();
  const startDeployment = useStartDeployment();
  const stopDeployment = useStopDeployment();
  const { toast } = useToast();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof DeploymentFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleEdit = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setIsEditDialogOpen(true);
  };

  const handleStart = async (id: string) => {
    try {
      await startDeployment.mutateAsync(id);
      toast({
        title: "Success",
        description: "Deployment started successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start deployment",
        variant: "destructive",
      });
    }
  };

  const handleStop = async (id: string) => {
    try {
      await stopDeployment.mutateAsync(id);
      toast({
        title: "Success",
        description: "Deployment stopped successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop deployment",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deployment?")) {
      return;
    }

    try {
      await deleteDeployment.mutateAsync(id);
      toast({
        title: "Success",
        description: "Deployment deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deployment",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <DeploymentListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <DeploymentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load deployments</p>
      </div>
    );
  }

  if (!data || data.deployments.length === 0) {
    return (
      <div className="space-y-6">
        <DeploymentListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No deployments found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search
              ? "Try adjusting your search filters"
              : "Create your first deployment to get started"}
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / data.page_size);
  const hasNext = data.page < totalPages;
  const hasPrev = data.page > 1;

  return (
    <div className="space-y-6">
      <DeploymentListFilters
        filters={filters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.deployments.map((deployment) => (
          <DeploymentCard
            key={deployment.id}
            deployment={deployment}
            onStart={handleStart}
            onStop={handleStop}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
            Page {data.page} of {totalPages}
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

      {selectedDeployment && (
        <DeploymentDialog
          deployment={selectedDeployment}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  );
}

interface DeploymentListFiltersProps {
  filters: DeploymentFilters;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof DeploymentFilters, value: string) => void;
}

function DeploymentListFilters({
  filters,
  onSearch,
  onFilterChange,
}: DeploymentListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search deployments..."
          value={filters.search || ""}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={filters.environment || "all"}
          onValueChange={(value) => onFilterChange("environment", value)}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onFilterChange("status", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="deploying">Deploying</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DeploymentCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
