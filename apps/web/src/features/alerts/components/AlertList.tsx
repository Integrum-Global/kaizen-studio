import { useState } from "react";
import { AlertCard } from "./AlertCard";
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from "../hooks";
import {
  Input,
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Search, Filter, Plus } from "lucide-react";
import type {
  AlertFilters,
  AlertSeverity,
  AlertStatus,
  AlertMetric,
} from "../types";
import { alertSeverityLabels, alertMetricLabels } from "../types";
import { useToast } from "@/hooks/use-toast";

interface AlertListProps {
  onCreateRule?: () => void;
  onViewHistory?: (alertId: string) => void;
}

export function AlertList({ onCreateRule, onViewHistory }: AlertListProps) {
  const [filters, setFilters] = useState<AlertFilters>({
    page: 1,
    page_size: 12,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isPending, error } = useAlerts(filters);
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const { toast } = useToast();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleSeverityFilter = (severity: AlertSeverity | "all") => {
    setFilters((prev) => ({
      ...prev,
      severity: severity === "all" ? undefined : severity,
      page: 1,
    }));
  };

  const handleStatusFilter = (status: AlertStatus | "all") => {
    setFilters((prev) => ({
      ...prev,
      status: status === "all" ? undefined : status,
      page: 1,
    }));
  };

  const handleMetricFilter = (metric: AlertMetric | "all") => {
    setFilters((prev) => ({
      ...prev,
      metric: metric === "all" ? undefined : metric,
      page: 1,
    }));
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert.mutateAsync({ id, input: {} });
      toast({
        title: "Success",
        description: "Alert acknowledged successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert.mutateAsync(id);
      toast({
        title: "Success",
        description: "Alert resolved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      page_size: 12,
    });
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <AlertListFilters
          filters={filters}
          showFilters={showFilters}
          onSearch={handleSearch}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onSeverityFilter={handleSeverityFilter}
          onStatusFilter={handleStatusFilter}
          onMetricFilter={handleMetricFilter}
          onClearFilters={clearFilters}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <AlertCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load alerts</p>
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="space-y-6">
        <AlertListFilters
          filters={filters}
          showFilters={showFilters}
          onSearch={handleSearch}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onSeverityFilter={handleSeverityFilter}
          onStatusFilter={handleStatusFilter}
          onMetricFilter={handleMetricFilter}
          onClearFilters={clearFilters}
          onCreateRule={onCreateRule}
        />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No alerts found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search ||
            filters.severity ||
            filters.status ||
            filters.metric
              ? "Try adjusting your filters"
              : "No alerts have been triggered yet"}
          </p>
          {onCreateRule && (
            <Button onClick={onCreateRule}>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert Rule
            </Button>
          )}
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / (filters.page_size || 12));
  const hasNext = (filters.page || 1) < totalPages;
  const hasPrev = (filters.page || 1) > 1;

  return (
    <div className="space-y-6">
      <AlertListFilters
        filters={filters}
        showFilters={showFilters}
        onSearch={handleSearch}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onSeverityFilter={handleSeverityFilter}
        onStatusFilter={handleStatusFilter}
        onMetricFilter={handleMetricFilter}
        onClearFilters={clearFilters}
        onCreateRule={onCreateRule}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.records.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onViewHistory={onViewHistory}
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
    </div>
  );
}

interface AlertListFiltersProps {
  filters: AlertFilters;
  showFilters: boolean;
  onSearch: (value: string) => void;
  onToggleFilters: () => void;
  onSeverityFilter: (severity: AlertSeverity | "all") => void;
  onStatusFilter: (status: AlertStatus | "all") => void;
  onMetricFilter: (metric: AlertMetric | "all") => void;
  onClearFilters: () => void;
  onCreateRule?: () => void;
}

function AlertListFilters({
  filters,
  showFilters,
  onSearch,
  onToggleFilters,
  onSeverityFilter,
  onStatusFilter,
  onMetricFilter,
  onClearFilters,
  onCreateRule,
}: AlertListFiltersProps) {
  const hasActiveFilters = !!(
    filters.severity ||
    filters.status ||
    filters.metric
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={filters.search || ""}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={onToggleFilters}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs">
                {
                  [filters.severity, filters.status, filters.metric].filter(
                    Boolean
                  ).length
                }
              </span>
            )}
          </Button>
          {onCreateRule && (
            <Button onClick={onCreateRule}>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Severity</label>
            <Select
              value={filters.severity || "all"}
              onValueChange={(value) =>
                onSeverityFilter(value as AlertSeverity | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {Object.entries(alertSeverityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                onStatusFilter(value as AlertStatus | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Metric</label>
            <Select
              value={filters.metric || "all"}
              onValueChange={(value) =>
                onMetricFilter(value as AlertMetric | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All metrics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metrics</SelectItem>
                {Object.entries(alertMetricLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="border-t pt-2">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
