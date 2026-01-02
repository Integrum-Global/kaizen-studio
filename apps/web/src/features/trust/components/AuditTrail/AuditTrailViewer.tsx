/**
 * AuditTrailViewer Component
 *
 * Main component for viewing and searching the audit trail
 */

import { useState, useMemo, useCallback } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditTrail } from "../../hooks";
import { AuditEventCard } from "./AuditEventCard";
import { AuditFilters, type AuditFilterValues } from "./AuditFilters";
import { AuditExport } from "./AuditExport";
import type { ActionResult } from "../../types";

interface AuditTrailViewerProps {
  initialAgentId?: string;
  onAgentClick?: (agentId: string) => void;
  pageSize?: number;
}

const defaultFilters: AuditFilterValues = {
  searchQuery: "",
  agentId: "",
  action: "",
  result: "",
  startTime: null,
  endTime: null,
};

export function AuditTrailViewer({
  initialAgentId,
  onAgentClick,
  pageSize = 20,
}: AuditTrailViewerProps) {
  const [filters, setFilters] = useState<AuditFilterValues>({
    ...defaultFilters,
    agentId: initialAgentId || "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Build query from filters
  const query = useMemo(
    () => ({
      agent_id: filters.agentId || undefined,
      action: filters.action || undefined,
      result: (filters.result as ActionResult) || undefined,
      start_time: filters.startTime?.toISOString(),
      end_time: filters.endTime?.toISOString(),
      page: currentPage,
      page_size: pageSize,
    }),
    [filters, currentPage, pageSize]
  );

  const { data, isLoading, error, refetch, isFetching } = useAuditTrail(query);

  // Client-side search filtering (for search query)
  const filteredEvents = useMemo(() => {
    if (!data?.items) return [];

    if (!filters.searchQuery) return data.items;

    const searchLower = filters.searchQuery.toLowerCase();
    return data.items.filter(
      (event) =>
        event.action.toLowerCase().includes(searchLower) ||
        event.resource?.toLowerCase().includes(searchLower) ||
        event.agent_id.toLowerCase().includes(searchLower)
    );
  }, [data?.items, filters.searchQuery]);

  // Extract unique agents and actions for filter dropdowns
  const availableAgents = useMemo(() => {
    if (!data?.items) return [];
    const agentIds = new Set(data.items.map((e) => e.agent_id));
    return Array.from(agentIds).map((id) => ({ id, name: "" }));
  }, [data?.items]);

  const availableActions = useMemo(() => {
    if (!data?.items) return [];
    return Array.from(new Set(data.items.map((e) => e.action)));
  }, [data?.items]);

  const handleFiltersChange = useCallback((newFilters: AuditFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const handleLoadMore = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const hasMore = data?.items && data.items.length === pageSize;
  const totalCount = data?.total || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load audit trail</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            {totalCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {totalCount} event{totalCount !== 1 ? "s" : ""} total
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            <AuditExport
              events={filteredEvents}
              isLoading={isLoading}
              filename="audit-trail"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <AuditFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableAgents={availableAgents}
          availableActions={availableActions}
        />

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No audit events found</h3>
            <p className="text-muted-foreground">
              {filters.searchQuery ||
              filters.agentId ||
              filters.action ||
              filters.result ||
              filters.startTime ||
              filters.endTime
                ? "Try adjusting your filters to see more results"
                : "Audit events will appear here as agents perform actions"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <AuditEventCard
                  key={event.id}
                  event={event}
                  onAgentClick={onAgentClick}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
