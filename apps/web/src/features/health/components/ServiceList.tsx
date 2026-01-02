import { useState } from "react";
import { ServiceStatus } from "./ServiceStatus";
import { useServices } from "../hooks";
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
import { Search, Filter, RefreshCw } from "lucide-react";
import type { HealthFilters } from "../types";

export function ServiceList() {
  const [filters, setFilters] = useState<HealthFilters>({});
  const {
    data: services,
    isPending,
    error,
    refetch,
  } = useServices(filters, 30000);

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: keyof HealthFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <ServiceListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Failed to load services</p>
        <Button onClick={handleRefresh} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="space-y-6">
        <ServiceListFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No services found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search || filters.status
              ? "Try adjusting your filters"
              : "No services are being monitored"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ServiceListFilters
        filters={filters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceStatus
            key={service.id}
            service={{
              ...service,
              lastCheck: service.lastCheck ?? new Date().toISOString(),
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ServiceListFiltersProps {
  filters: HealthFilters;
  onSearch: (value: string) => void;
  onFilterChange: (key: keyof HealthFilters, value: string) => void;
  onRefresh: () => void;
}

function ServiceListFilters({
  filters,
  onSearch,
  onFilterChange,
  onRefresh,
}: ServiceListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
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
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="down">Down</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onRefresh} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
