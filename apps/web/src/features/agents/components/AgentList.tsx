import { useState } from "react";
import { AgentCard } from "./AgentCard";
import { AgentFormDialog } from "./AgentFormDialog";
import { useAgents, useDeleteAgent, useDuplicateAgent } from "../hooks";
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
import type { Agent, AgentFilters } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";

export function AgentList() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<AgentFilters>({
    page: 1,
    page_size: 12,
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Include organization_id in the filters - required by backend
  const { data, isPending, error } = useAgents({
    ...filters,
    organization_id: user?.organization_id,
  });
  const deleteAgent = useDeleteAgent();
  const duplicateAgent = useDuplicateAgent();
  const { toast } = useToast();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof AgentFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsEditDialogOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateAgent.mutateAsync(id);
      toast({
        title: "Success",
        description: "Agent duplicated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate agent",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) {
      return;
    }

    try {
      await deleteAgent.mutateAsync(id);
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
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
        <AgentListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load agents</p>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="space-y-6">
        <AgentListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No agents found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search
              ? "Try adjusting your search filters"
              : "Create your first agent to get started"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgentListFilters
        filters={filters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.items.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_prev}
            onClick={() => handlePageChange(filters.page! - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_next}
            onClick={() => handlePageChange(filters.page! + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {selectedAgent && (
        <AgentFormDialog
          agent={selectedAgent}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  );
}

interface AgentListFiltersProps {
  filters: AgentFilters;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof AgentFilters, value: string) => void;
}

function AgentListFilters({
  filters,
  onSearch,
  onFilterChange,
}: AgentListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={filters.search || ""}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={filters.type || "all"}
          onValueChange={(value) => onFilterChange("type", value)}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="completion">Completion</SelectItem>
            <SelectItem value="embedding">Embedding</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.provider || "all"}
          onValueChange={(value) => onFilterChange("provider", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="azure">Azure</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function AgentCardSkeleton() {
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
