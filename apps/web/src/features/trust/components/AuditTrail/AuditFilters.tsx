/**
 * AuditFilters Component
 *
 * Filter controls for the audit trail viewer
 */

import { useState } from "react";
import { format, subDays, subHours, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ActionResult } from "../../types";

export interface AuditFilterValues {
  searchQuery: string;
  agentId: string;
  action: string;
  result: ActionResult | "";
  startTime: Date | null;
  endTime: Date | null;
}

interface AuditFiltersProps {
  filters: AuditFilterValues;
  onFiltersChange: (filters: AuditFilterValues) => void;
  availableAgents?: Array<{ id: string; name: string }>;
  availableActions?: string[];
}

const TIME_PRESETS = [
  { label: "Last hour", getValue: () => subHours(new Date(), 1) },
  { label: "Last 24 hours", getValue: () => subDays(new Date(), 1) },
  { label: "Last 7 days", getValue: () => subDays(new Date(), 7) },
  { label: "Last 30 days", getValue: () => subDays(new Date(), 30) },
];

export function AuditFilters({
  filters,
  onFiltersChange,
  availableAgents = [],
  availableActions = [],
}: AuditFiltersProps) {
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const updateFilter = <K extends keyof AuditFilterValues>(
    key: K,
    value: AuditFilterValues[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof AuditFilterValues) => {
    if (key === "startTime" || key === "endTime") {
      updateFilter(key, null);
    } else {
      updateFilter(key, "");
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: "",
      agentId: "",
      action: "",
      result: "",
      startTime: null,
      endTime: null,
    });
  };

  const applyTimePreset = (getValue: () => Date) => {
    onFiltersChange({
      ...filters,
      startTime: getValue(),
      endTime: new Date(),
    });
  };

  const activeFilterCount = [
    filters.searchQuery,
    filters.agentId,
    filters.action,
    filters.result,
    filters.startTime,
    filters.endTime,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="text-xs text-muted-foreground">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search actions, resources..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter("searchQuery", e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="w-[180px]">
          <Label className="text-xs text-muted-foreground">Agent</Label>
          <Select
            value={filters.agentId || "all"}
            onValueChange={(value) =>
              updateFilter("agentId", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {availableAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name || agent.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[160px]">
          <Label className="text-xs text-muted-foreground">Action</Label>
          <Select
            value={filters.action || "all"}
            onValueChange={(value) =>
              updateFilter("action", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {availableActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[140px]">
          <Label className="text-xs text-muted-foreground">Result</Label>
          <Select
            value={filters.result || "all"}
            onValueChange={(value) =>
              updateFilter(
                "result",
                value === "all" ? "" : (value as ActionResult)
              )
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All results" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Start Date</Label>
          <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] mt-1 justify-start text-left font-normal",
                  !filters.startTime && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startTime
                  ? format(filters.startTime, "PPP")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startTime || undefined}
                onSelect={(date) => {
                  updateFilter("startTime", date ? startOfDay(date) : null);
                  setIsStartDateOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">End Date</Label>
          <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] mt-1 justify-start text-left font-normal",
                  !filters.endTime && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endTime
                  ? format(filters.endTime, "PPP")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endTime || undefined}
                onSelect={(date) => {
                  updateFilter("endTime", date ? endOfDay(date) : null);
                  setIsEndDateOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          {TIME_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyTimePreset(preset.getValue)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.searchQuery}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("searchQuery")}
                />
              </Badge>
            )}
            {filters.agentId && (
              <Badge variant="secondary" className="gap-1">
                Agent: {filters.agentId.slice(0, 8)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("agentId")}
                />
              </Badge>
            )}
            {filters.action && (
              <Badge variant="secondary" className="gap-1">
                Action: {filters.action}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("action")}
                />
              </Badge>
            )}
            {filters.result && (
              <Badge variant="secondary" className="gap-1">
                Result: {filters.result}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("result")}
                />
              </Badge>
            )}
            {filters.startTime && (
              <Badge variant="secondary" className="gap-1">
                From: {format(filters.startTime, "PP")}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("startTime")}
                />
              </Badge>
            )}
            {filters.endTime && (
              <Badge variant="secondary" className="gap-1">
                To: {format(filters.endTime, "PP")}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("endTime")}
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
