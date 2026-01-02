import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Server } from "lucide-react";
import { GatewayCard } from "./GatewayCard";
import { useGateways } from "../hooks";
import type {
  Gateway,
  GatewayFilter,
  GatewayEnvironment,
  GatewayStatus,
} from "../types";

interface GatewayListProps {
  onViewDetails?: (gateway: Gateway) => void;
  onPromote?: (gateway: Gateway) => void;
  onScale?: (gateway: Gateway) => void;
}

export function GatewayList({
  onViewDetails,
  onPromote,
  onScale,
}: GatewayListProps) {
  const [filters, setFilters] = useState<GatewayFilter>({});
  const { data, isLoading } = useGateways(filters);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleEnvironmentChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      environment: value === "all" ? undefined : (value as GatewayEnvironment),
    }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : (value as GatewayStatus),
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  const gateways = data?.records || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search gateways..."
            className="pl-9"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Select
          value={filters.environment || "all"}
          onValueChange={handleEnvironmentChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="down">Down</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {gateways.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No gateways found</h3>
            <p className="text-muted-foreground text-center">
              {filters.search || filters.environment || filters.status
                ? "Try adjusting your filters"
                : "Get started by creating your first gateway"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gateways.map((gateway) => (
            <GatewayCard
              key={gateway.id}
              gateway={gateway}
              onViewDetails={onViewDetails}
              onPromote={onPromote}
              onScale={onScale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
