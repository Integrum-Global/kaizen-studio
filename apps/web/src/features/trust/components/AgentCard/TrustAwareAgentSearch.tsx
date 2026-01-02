/**
 * TrustAwareAgentSearch Component
 *
 * Agent search with trust filters including:
 * - Search by name/ID
 * - Filter by trust status
 * - Filter by capabilities
 * - Filter by constraints
 * - Sort by trust expiration
 */

import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { AgentSearchFilters, TrustStatus } from "../../types";
import { cn } from "@/lib/utils";

interface TrustAwareAgentSearchProps {
  filters: AgentSearchFilters;
  onFiltersChange: (filters: AgentSearchFilters) => void;
  availableCapabilities?: string[];
  className?: string;
}

const TRUST_STATUS_OPTIONS = [
  { value: TrustStatus.VALID, label: "Valid" },
  { value: TrustStatus.EXPIRED, label: "Expired" },
  { value: TrustStatus.REVOKED, label: "Revoked" },
  { value: TrustStatus.PENDING, label: "Pending" },
  { value: TrustStatus.INVALID, label: "Invalid" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "trust_expiration", label: "Trust Expiration" },
  { value: "capability_count", label: "Capability Count" },
];

export function TrustAwareAgentSearch({
  filters,
  onFiltersChange,
  availableCapabilities = [],
  className,
}: TrustAwareAgentSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const updateFilter = <K extends keyof AgentSearchFilters>(
    key: K,
    value: AgentSearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof AgentSearchFilters) => {
    if (key === "trust_status" || key === "capabilities") {
      updateFilter(key, undefined);
    } else if (key === "has_constraints") {
      updateFilter(key, undefined);
    } else {
      updateFilter(key as any, "");
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      query: "",
      trust_status: undefined,
      capabilities: undefined,
      has_constraints: undefined,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order,
    });
  };

  const toggleTrustStatus = (status: TrustStatus) => {
    const current = filters.trust_status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    updateFilter("trust_status", updated.length > 0 ? updated : undefined);
  };

  const toggleCapability = (capability: string) => {
    const current = filters.capabilities || [];
    const updated = current.includes(capability)
      ? current.filter((c) => c !== capability)
      : [...current, capability];
    updateFilter("capabilities", updated.length > 0 ? updated : undefined);
  };

  const activeFilterCount = [
    filters.trust_status,
    filters.capabilities,
    filters.has_constraints !== undefined,
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end gap-2">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="text-xs text-muted-foreground">
            Search agents
          </Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or ID..."
              value={filters.query}
              onChange={(e) => updateFilter("query", e.target.value)}
              className="pl-10 pr-10"
            />
            {filters.query && (
              <button
                onClick={() => updateFilter("query", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sort By */}
        <div className="w-[180px]">
          <Label className="text-xs text-muted-foreground">Sort by</Label>
          <Select
            value={filters.sort_by || "name"}
            onValueChange={(value) =>
              updateFilter(
                "sort_by",
                value as AgentSearchFilters["sort_by"]
              )
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="w-[120px]">
          <Label className="text-xs text-muted-foreground">Order</Label>
          <Select
            value={filters.sort_order || "asc"}
            onValueChange={(value) =>
              updateFilter(
                "sort_order",
                value as AgentSearchFilters["sort_order"]
              )
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px]" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Trust Status</h4>
                <div className="space-y-2">
                  {TRUST_STATUS_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={filters.trust_status?.includes(option.value)}
                        onCheckedChange={() => toggleTrustStatus(option.value)}
                      />
                      <label
                        htmlFor={`status-${option.value}`}
                        className="ml-2 text-sm cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {availableCapabilities.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Capabilities</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {availableCapabilities.map((capability) => (
                      <div key={capability} className="flex items-center">
                        <Checkbox
                          id={`cap-${capability}`}
                          checked={filters.capabilities?.includes(capability)}
                          onCheckedChange={() => toggleCapability(capability)}
                        />
                        <label
                          htmlFor={`cap-${capability}`}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {capability}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm mb-2">Constraints</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox
                      id="has-constraints"
                      checked={filters.has_constraints === true}
                      onCheckedChange={(checked) =>
                        updateFilter(
                          "has_constraints",
                          checked ? true : undefined
                        )
                      }
                    />
                    <label
                      htmlFor="has-constraints"
                      className="ml-2 text-sm cursor-pointer"
                    >
                      Has constraints
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      id="no-constraints"
                      checked={filters.has_constraints === false}
                      onCheckedChange={(checked) =>
                        updateFilter(
                          "has_constraints",
                          checked ? false : undefined
                        )
                      }
                    />
                    <label
                      htmlFor="no-constraints"
                      className="ml-2 text-sm cursor-pointer"
                    >
                      No constraints
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex-1"
                >
                  Clear all
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filters.trust_status?.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1">
                Status: {status}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleTrustStatus(status)}
                />
              </Badge>
            ))}
            {filters.capabilities?.map((capability) => (
              <Badge key={capability} variant="secondary" className="gap-1">
                {capability}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleCapability(capability)}
                />
              </Badge>
            ))}
            {filters.has_constraints !== undefined && (
              <Badge variant="secondary" className="gap-1">
                {filters.has_constraints ? "Has constraints" : "No constraints"}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("has_constraints")}
                />
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="ml-auto"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
