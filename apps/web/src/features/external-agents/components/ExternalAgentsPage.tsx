import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MoreVertical, Trash2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExternalAgents, useDeleteExternalAgent } from "../hooks";
import { ExternalAgentRegistrationWizard } from "./ExternalAgentRegistrationWizard";
import { ExternalAgentDetailsModal } from "./ExternalAgentDetailsModal";
import type {
  ExternalAgent,
  ExternalAgentStatus,
  ExternalAgentFilters,
} from "../types";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function ExternalAgentsPage() {
  const [filters, setFilters] = useState<ExternalAgentFilters>({
    page_size: 50,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ExternalAgent | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: agents, isPending, error } = useExternalAgents(filters);
  const deleteAgent = useDeleteExternalAgent();
  const { toast } = useToast();

  const handleStatusFilter = (status: ExternalAgentStatus | "all") => {
    setFilters((prev) => ({
      ...prev,
      status: status === "all" ? undefined : status,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchQuery || undefined,
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this external agent?")) {
      return;
    }

    try {
      await deleteAgent.mutateAsync(id);
      toast({
        title: "Success",
        description: "External agent deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to delete external agent",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (agent: ExternalAgent) => {
    setSelectedAgent(agent);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">External Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage external agent integrations and webhooks
          </p>
        </div>
        <Button
          onClick={() => setIsWizardOpen(true)}
          aria-label="Register External Agent"
        >
          <Plus className="mr-2 h-4 w-4" />
          Register External Agent
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <form onSubmit={handleSearch} className="flex-1 max-w-md w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search agents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search external agents"
            />
          </div>
        </form>

        <select
          value={filters.status || "all"}
          onChange={(e) =>
            handleStatusFilter(e.target.value as ExternalAgentStatus | "all")
          }
          className="flex h-10 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {/* Table */}
      {isPending ? (
        <ExternalAgentsTableSkeleton />
      ) : error ? (
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <p className="text-destructive">Failed to load external agents</p>
        </div>
      ) : !agents || agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg space-y-4">
          <p className="text-muted-foreground text-lg">
            No external agents found
          </p>
          <p className="text-sm text-muted-foreground">
            {filters.status || filters.search
              ? "Try adjusting your filters"
              : "Register your first external agent to get started"}
          </p>
          <Button onClick={() => setIsWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Register External Agent
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Invocation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow
                  key={agent.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(agent)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleViewDetails(agent);
                    }
                  }}
                  aria-label={`View details for ${agent.name}`}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div>{agent.name}</div>
                      {agent.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {agent.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {agent.provider}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={agent.status} />
                  </TableCell>
                  <TableCell>
                    {agent.last_invocation_at ? (
                      <span className="text-sm">
                        {formatDistanceToNow(
                          new Date(agent.last_invocation_at),
                          {
                            addSuffix: true,
                          }
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Never
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Actions for ${agent.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(agent);
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(agent.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modals */}
      <ExternalAgentRegistrationWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
      />

      {selectedAgent && (
        <ExternalAgentDetailsModal
          agent={selectedAgent}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ExternalAgentStatus }) {
  const variants = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    inactive:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    deleted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      {status}
    </Badge>
  );
}

function ExternalAgentsTableSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Invocation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
