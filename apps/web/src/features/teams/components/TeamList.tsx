import { useState } from "react";
import { TeamCard } from "./TeamCard";
import { TeamDialog } from "./TeamDialog";
import { useTeams, useDeleteTeam } from "../hooks";
import { Input, Button, Skeleton } from "@/components/ui";
import { Search } from "lucide-react";
import type { Team, TeamFilters } from "../types";
import { useToast } from "@/hooks/use-toast";

export function TeamList() {
  const [filters, setFilters] = useState<TeamFilters>({
    page: 1,
    page_size: 12,
  });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data, isPending, error } = useTeams(filters);
  const deleteTeam = useDeleteTeam();
  const { toast } = useToast();

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) {
      return;
    }

    try {
      await deleteTeam.mutateAsync(id);
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <TeamListFilters filters={filters} onSearch={handleSearch} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load teams</p>
      </div>
    );
  }

  if (!data || data.records.length === 0) {
    return (
      <div className="space-y-6">
        <TeamListFilters filters={filters} onSearch={handleSearch} />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground text-lg">No teams found</p>
          <p className="text-sm text-muted-foreground">
            {filters.search
              ? "Try adjusting your search filters"
              : "Create your first team using the button above"}
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / (filters.page_size || 12));
  const hasNext = (filters.page || 1) < totalPages;
  const hasPrev = (filters.page || 1) > 1;

  return (
    <div className="space-y-6">
      <TeamListFilters filters={filters} onSearch={handleSearch} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.records.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onEdit={handleEdit}
            onDelete={handleDelete}
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

      {selectedTeam && (
        <TeamDialog
          team={selectedTeam}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </div>
  );
}

interface TeamListFiltersProps {
  filters: TeamFilters;
  onSearch: (value: string) => void;
}

function TeamListFilters({ filters, onSearch }: TeamListFiltersProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search teams..."
        value={filters.search || ""}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}

function TeamCardSkeleton() {
  return (
    <div className="space-y-4 border rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
