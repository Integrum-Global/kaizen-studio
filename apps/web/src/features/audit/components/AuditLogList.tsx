import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Skeleton,
} from "@/components/ui";
import { Download } from "lucide-react";
import { useAuditLogs } from "../hooks";
import { AuditLogRow } from "./AuditLogRow";
import { AuditFilters } from "./AuditFilters";
import { AuditExportDialog } from "./AuditExportDialog";
import type { AuditFilters as AuditFiltersType } from "../types";
import { useAuthStore } from "@/store/auth";

export function AuditLogList() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<AuditFiltersType>({
    page: 1,
    pageSize: 20,
  });
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Include organization_id in the filters - required by backend
  const { data, isPending, error } = useAuditLogs({
    ...filters,
    organization_id: user?.organization_id,
  });

  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value === "" ? undefined : value,
      page: 1,
    }));
  };

  const handleFilterChange = (
    key: keyof AuditFiltersType,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleDateRangeChange = (startDate?: string, endDate?: string) => {
    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <AuditLogListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load audit logs</p>
      </div>
    );
  }

  if (!data || data.logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <Button onClick={() => setIsExportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <AuditFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
        />

        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No audit logs found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search || filters.action || filters.status
              ? "Try adjusting your search filters"
              : "Audit logs will appear here as actions are performed"}
          </p>
        </div>

        <AuditExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / data.pageSize);
  const hasNext = data.page < totalPages;
  const hasPrev = data.page > 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <Button onClick={() => setIsExportDialogOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <AuditFilters
        filters={filters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onDateRangeChange={handleDateRangeChange}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.pageSize + 1} to{" "}
            {Math.min(data.page * data.pageSize, data.total)} of {data.total}{" "}
            logs
          </p>
          <div className="flex items-center gap-2">
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
        </div>
      )}

      <AuditExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </div>
  );
}

function AuditLogListSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(10)].map((_, i) => (
            <TableRow key={i}>
              <TableHead className="w-12">
                <Skeleton className="h-6 w-6" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-32" />
              </TableHead>
              <TableHead>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableHead>
              <TableHead>
                <Skeleton className="h-6 w-16" />
              </TableHead>
              <TableHead>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableHead>
              <TableHead>
                <Skeleton className="h-6 w-16" />
              </TableHead>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
