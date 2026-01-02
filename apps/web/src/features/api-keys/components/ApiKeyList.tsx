import { useState } from "react";
import { ApiKeyCard } from "./ApiKeyCard";
import { ApiKeyDialog } from "./ApiKeyDialog";
import { useApiKeys, useRevokeApiKey, useRegenerateApiKey } from "../hooks";
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
import { Search, Filter, Plus } from "lucide-react";
import type { ApiKeyFilters } from "../types";
import { useToast } from "@/hooks/use-toast";
import { ApiKeyRevealDialog } from "./ApiKeyRevealDialog";

export function ApiKeyList() {
  const [filters, setFilters] = useState<ApiKeyFilters>({
    page: 1,
    page_size: 12,
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [regeneratedKey, setRegeneratedKey] = useState<{
    name: string;
    fullKey: string;
  } | null>(null);
  const [showRevealDialog, setShowRevealDialog] = useState(false);

  const { data, isPending, error } = useApiKeys(filters);
  const revokeApiKey = useRevokeApiKey();
  const regenerateApiKey = useRegenerateApiKey();
  const { toast } = useToast();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key: keyof ApiKeyFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast({
        title: "Success",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to regenerate this API key? The old key will be invalidated immediately."
      )
    ) {
      return;
    }

    try {
      const result = await regenerateApiKey.mutateAsync(id);
      setRegeneratedKey({
        name: result.key.name,
        fullKey: result.fullKey,
      });
      setShowRevealDialog(true);
      toast({
        title: "Success",
        description: "API key regenerated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate API key",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await revokeApiKey.mutateAsync(id);
      toast({
        title: "Success",
        description: "API key revoked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke API key",
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
        <ApiKeyListHeader onCreateClick={() => setIsCreateDialogOpen(true)} />
        <ApiKeyListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ApiKeyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load API keys</p>
      </div>
    );
  }

  if (!data || data.keys.length === 0) {
    return (
      <div className="space-y-6">
        <ApiKeyListHeader onCreateClick={() => setIsCreateDialogOpen(true)} />
        <ApiKeyListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No API keys found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search
              ? "Try adjusting your search filters"
              : "Create your first API key to get started"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / data.page_size);
  const hasNext = data.page < totalPages;
  const hasPrev = data.page > 1;

  return (
    <div className="space-y-6">
      <ApiKeyListHeader onCreateClick={() => setIsCreateDialogOpen(true)} />
      <ApiKeyListFilters
        filters={filters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.keys.map((apiKey) => (
          <ApiKeyCard
            key={apiKey.id}
            apiKey={apiKey}
            onRegenerate={handleRegenerate}
            onRevoke={handleRevoke}
            onCopyKey={handleCopyKey}
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

      <ApiKeyDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {regeneratedKey && (
        <ApiKeyRevealDialog
          apiKeyName={regeneratedKey.name}
          fullKey={regeneratedKey.fullKey}
          open={showRevealDialog}
          onOpenChange={(open) => {
            setShowRevealDialog(open);
            if (!open) setRegeneratedKey(null);
          }}
        />
      )}
    </div>
  );
}

interface ApiKeyListHeaderProps {
  onCreateClick: () => void;
}

function ApiKeyListHeader({ onCreateClick }: ApiKeyListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
        <p className="text-muted-foreground">
          Manage API keys for accessing Kaizen Studio
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create API Key
      </Button>
    </div>
  );
}

interface ApiKeyListFiltersProps {
  filters: ApiKeyFilters;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof ApiKeyFilters, value: string) => void;
}

function ApiKeyListFilters({
  filters,
  onSearch,
  onFilterChange,
}: ApiKeyListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search API keys..."
          value={filters.search || ""}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => onFilterChange("status", value)}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ApiKeyCardSkeleton() {
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
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
