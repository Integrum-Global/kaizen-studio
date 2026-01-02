import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { RefreshCw } from "lucide-react";
import type { TimeRange, MetricFilter } from "../types";

interface MetricsFiltersProps {
  filters: MetricFilter;
  onFiltersChange: (filters: MetricFilter) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "1h", label: "Last hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "agents", label: "Agents" },
  { value: "executions", label: "Executions" },
  { value: "performance", label: "Performance" },
  { value: "users", label: "Users" },
  { value: "usage", label: "Usage" },
  { value: "errors", label: "Errors" },
];

export function MetricsFilters({
  filters,
  onFiltersChange,
  onRefresh,
  isRefreshing = false,
}: MetricsFiltersProps) {
  const handleTimeRangeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      timeRange: value as TimeRange,
    });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category: value === "all" ? undefined : value,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        {/* Time Range Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Time Range
          </label>
          <Select
            value={filters.timeRange}
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Category
          </label>
          <Select
            value={filters.category || "all"}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground invisible">
            Actions
          </label>
          <Button
            variant="outline"
            size="default"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
