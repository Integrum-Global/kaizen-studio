/**
 * AuthorityManager Component
 *
 * Main authority management page with list, filters, and actions
 */

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthoritiesFiltered } from "../../hooks";
import { AuthorityType } from "../../types";
import type { Authority, AuthorityFilters } from "../../types";
import { AuthorityCard } from "./AuthorityCard";
import { CreateAuthorityDialog } from "./CreateAuthorityDialog";
import { EditAuthorityDialog } from "./EditAuthorityDialog";
import { DeactivateAuthorityDialog } from "./DeactivateAuthorityDialog";
import { AuthorityDetailView } from "./AuthorityDetailView";

export function AuthorityManager() {
  const [filters, setFilters] = useState<AuthorityFilters>({
    search: "",
    type: undefined,
    isActive: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: authorities, isPending } = useAuthoritiesFiltered(filters);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(
    null
  );
  const [detailViewAuthorityId, setDetailViewAuthorityId] = useState<
    string | null
  >(null);

  const handleEdit = (authority: Authority) => {
    setSelectedAuthority(authority);
    setEditDialogOpen(true);
  };

  const handleDeactivate = (authority: Authority) => {
    setSelectedAuthority(authority);
    setDeactivateDialogOpen(true);
  };

  const handleViewDetails = (authority: Authority) => {
    setDetailViewAuthorityId(authority.id);
  };

  // If showing detail view, render that instead
  if (detailViewAuthorityId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setDetailViewAuthorityId(null)}>
          ← Back to Authorities
        </Button>
        <AuthorityDetailView
          authorityId={detailViewAuthorityId}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Authority Management
          </h1>
          <p className="text-muted-foreground">
            Manage authorities that establish trust for agents
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Authority
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search authorities..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Type Filter */}
        <Select
          value={filters.type || "all"}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              type: value === "all" ? undefined : (value as AuthorityType),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={AuthorityType.ORGANIZATION}>
              Organization
            </SelectItem>
            <SelectItem value={AuthorityType.SYSTEM}>System</SelectItem>
            <SelectItem value={AuthorityType.HUMAN}>Human</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={
            filters.isActive === undefined
              ? "all"
              : filters.isActive
                ? "active"
                : "inactive"
          }
          onValueChange={(value) =>
            setFilters({
              ...filters,
              isActive: value === "all" ? undefined : value === "active",
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-") as [
              "name" | "createdAt" | "agentCount",
              "asc" | "desc",
            ];
            setFilters({ ...filters, sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="agentCount-desc">Most Agents</SelectItem>
            <SelectItem value="agentCount-asc">Fewest Agents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Authority Grid */}
      {isPending ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : authorities && authorities.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {authorities.map((authority) => (
            <AuthorityCard
              key={authority.id}
              authority={authority}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No Authorities Found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.type || filters.isActive !== undefined
              ? "Try adjusting your filters"
              : "Get started by creating your first authority"}
          </p>
          {!filters.search &&
            !filters.type &&
            filters.isActive === undefined && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Authority
              </Button>
            )}
        </div>
      )}

      {/* Dialogs */}
      <CreateAuthorityDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditAuthorityDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        authority={selectedAuthority}
      />

      <DeactivateAuthorityDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        authority={selectedAuthority}
      />
    </div>
  );
}
