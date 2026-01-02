import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { Calendar } from "@/components/ui/calendar";
import { Search, Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import type { AuditFilters as AuditFiltersType } from "../types";

interface AuditFiltersProps {
  filters: AuditFiltersType;
  onSearch: (value: string) => void;
  onFilterChange: (
    key: keyof AuditFiltersType,
    value: string | undefined
  ) => void;
  onDateRangeChange: (startDate?: string, endDate?: string) => void;
}

export function AuditFilters({
  filters,
  onSearch,
  onFilterChange,
  onDateRangeChange,
}: AuditFiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  );

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onDateRangeChange(
      date ? date.toISOString() : undefined,
      endDate?.toISOString()
    );
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onDateRangeChange(
      startDate?.toISOString(),
      date ? date.toISOString() : undefined
    );
  };

  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onDateRangeChange(undefined, undefined);
  };

  const hasDateRange = startDate || endDate;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={filters.search || ""}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={filters.action || "all"}
            onValueChange={(value) =>
              onFilterChange("action", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="access">Access</SelectItem>
              <SelectItem value="export">Export</SelectItem>
              <SelectItem value="deploy">Deploy</SelectItem>
              <SelectItem value="execute">Execute</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFilterChange("status", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Resource type..."
            value={filters.resource || ""}
            onChange={(e) =>
              onFilterChange(
                "resource",
                e.target.value === "" ? undefined : e.target.value
              )
            }
            className="w-[160px]"
          />

          <Input
            placeholder="Actor..."
            value={filters.actor || ""}
            onChange={(e) =>
              onFilterChange(
                "actor",
                e.target.value === "" ? undefined : e.target.value
              )
            }
            className="w-[140px]"
          />
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {hasDateRange && (
          <Button variant="ghost" size="sm" onClick={clearDateRange}>
            <X className="h-4 w-4 mr-2" />
            Clear Dates
          </Button>
        )}
      </div>
    </div>
  );
}
