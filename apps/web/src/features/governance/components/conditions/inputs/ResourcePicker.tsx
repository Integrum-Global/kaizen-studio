/**
 * ResourcePicker - Dynamic resource selection with search
 * Allows selecting agents, gateways, deployments, teams, or users
 */

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ResourceReference } from "../types";
import type { ResourceType } from "../../../types";

// Import real hooks from feature modules
import { useAgents } from "@/features/agents/hooks";
import { useGateways } from "@/features/gateways/hooks";
import { useDeployments } from "@/features/deployments/hooks";
import { useTeams } from "@/features/teams/hooks";

export type PickerResourceType = ResourceType | "team" | "user" | "workspace";

interface Resource {
  id: string;
  name: string;
  description?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

interface ResourcePickerProps {
  resourceType: PickerResourceType;
  value: ResourceReference | null;
  onChange: (value: ResourceReference | null) => void;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Resource type display configuration
 */
const resourceConfig: Record<PickerResourceType, { label: string; searchPlaceholder: string }> = {
  agent: { label: "Agent", searchPlaceholder: "Search agents..." },
  pipeline: { label: "Pipeline", searchPlaceholder: "Search pipelines..." },
  deployment: { label: "Deployment", searchPlaceholder: "Search deployments..." },
  gateway: { label: "Gateway", searchPlaceholder: "Search gateways..." },
  team: { label: "Team", searchPlaceholder: "Search teams..." },
  user: { label: "User", searchPlaceholder: "Search users..." },
  workspace: { label: "Workspace", searchPlaceholder: "Search workspaces..." },
  settings: { label: "Settings", searchPlaceholder: "Search settings..." },
  billing: { label: "Billing", searchPlaceholder: "Search billing..." },
  audit: { label: "Audit", searchPlaceholder: "Search audit..." },
};

/**
 * Hook for fetching resources from real backend APIs
 */
function useResourceData(resourceType: PickerResourceType) {
  // Fetch all resource types - hooks must be called unconditionally
  const agentsQuery = useAgents();
  const gatewaysQuery = useGateways();
  const deploymentsQuery = useDeployments();
  const teamsQuery = useTeams();

  // Transform data to common Resource interface based on resource type
  // Note: Each API has different response structure:
  // - Agents: PaginatedResponse<Agent> with .items
  // - Gateways: GatewayResponse with .records
  // - Deployments: DeploymentResponse with .deployments
  // - Teams: TeamResponse with .records
  const resources = useMemo((): Resource[] => {
    switch (resourceType) {
      case "agent":
        return (agentsQuery.data?.items ?? []).map((agent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description || "",
          status: agent.status || "",
        }));
      case "gateway":
        return (gatewaysQuery.data?.records ?? []).map((gateway) => ({
          id: gateway.id,
          name: gateway.name,
          description: gateway.description || gateway.environment || "",
          status: gateway.status || "",
        }));
      case "deployment":
        return (deploymentsQuery.data?.deployments ?? []).map((deployment) => ({
          id: deployment.id,
          name: deployment.pipelineName || `Deployment ${deployment.id.slice(0, 8)}`,
          description: deployment.environment || "",
          status: deployment.status || "",
        }));
      case "team":
        return (teamsQuery.data?.records ?? []).map((team) => ({
          id: team.id,
          name: team.name,
          description: team.description || "",
          status: "",
        }));
      default:
        // For unsupported types (user, workspace, pipeline, etc.), return empty
        return [];
    }
  }, [resourceType, agentsQuery.data?.items, gatewaysQuery.data?.records, deploymentsQuery.data?.deployments, teamsQuery.data?.records]);

  // Get loading state for current resource type
  const isLoading = useMemo(() => {
    switch (resourceType) {
      case "agent": return agentsQuery.isPending;
      case "gateway": return gatewaysQuery.isPending;
      case "deployment": return deploymentsQuery.isPending;
      case "team": return teamsQuery.isPending;
      default: return false;
    }
  }, [resourceType, agentsQuery.isPending, gatewaysQuery.isPending, deploymentsQuery.isPending, teamsQuery.isPending]);

  // Get error for current resource type
  const error = useMemo(() => {
    let queryError: Error | null = null;
    switch (resourceType) {
      case "agent": queryError = agentsQuery.error; break;
      case "gateway": queryError = gatewaysQuery.error; break;
      case "deployment": queryError = deploymentsQuery.error; break;
      case "team": queryError = teamsQuery.error; break;
    }
    return queryError?.message ?? null;
  }, [resourceType, agentsQuery.error, gatewaysQuery.error, deploymentsQuery.error, teamsQuery.error]);

  return { resources, isLoading, error };
}

/**
 * Filter resources by search term (client-side filtering)
 */
function filterResources(resources: Resource[], searchTerm: string): Resource[] {
  if (!searchTerm) return resources;

  const term = searchTerm.toLowerCase();
  return resources.filter(
    (r) =>
      r.name.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term)
  );
}

export function ResourcePicker({
  resourceType,
  value,
  onChange,
  multiple = false,
  disabled = false,
  placeholder,
}: ResourcePickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch resources from real backend APIs
  const { resources: allResources, isLoading, error } = useResourceData(resourceType);

  // Filter resources by search term (client-side)
  const resources = useMemo(
    () => filterResources(allResources, searchTerm),
    [allResources, searchTerm]
  );

  const config = resourceConfig[resourceType];

  // Get selected IDs
  const selectedIds = useMemo(() => {
    if (!value) return new Set<string>();
    if (value.selector.ids) return new Set(value.selector.ids);
    if (value.selector.id) return new Set([value.selector.id]);
    return new Set<string>();
  }, [value]);

  // Get display names
  const displayNames = useMemo(() => {
    if (!value?.display) return [];
    if (value.display.names) return value.display.names;
    if (value.display.name) return [value.display.name];
    return [];
  }, [value]);

  const handleSelect = (resource: Resource) => {
    if (multiple) {
      // Multi-select: toggle selection
      const newIds = new Set(selectedIds);
      const newNames = [...displayNames];

      if (newIds.has(resource.id)) {
        newIds.delete(resource.id);
        const nameIndex = newNames.indexOf(resource.name);
        if (nameIndex > -1) newNames.splice(nameIndex, 1);
      } else {
        newIds.add(resource.id);
        newNames.push(resource.name);
      }

      if (newIds.size === 0 || newNames.length === 0) {
        onChange(null);
      } else {
        onChange({
          $ref: "resource",
          type: resourceType,
          selector: { ids: Array.from(newIds) },
          display: {
            name: newNames[0] as string,
            names: newNames,
            status: "valid",
            validatedAt: new Date().toISOString(),
          },
        });
      }
    } else {
      // Single select: replace selection
      onChange({
        $ref: "resource",
        type: resourceType,
        selector: { id: resource.id },
        display: {
          name: resource.name,
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      });
      setOpen(false);
    }
  };

  const handleRemove = (id: string, name: string) => {
    if (!multiple) {
      onChange(null);
      return;
    }

    const newIds = new Set(selectedIds);
    const newNames = displayNames.filter((n) => n !== name);
    newIds.delete(id);

    if (newIds.size === 0 || newNames.length === 0) {
      onChange(null);
    } else {
      onChange({
        $ref: "resource",
        type: resourceType,
        selector: { ids: Array.from(newIds) },
        display: {
          name: newNames[0] as string,
          names: newNames,
          status: "valid",
          validatedAt: new Date().toISOString(),
        },
      });
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="flex-1 space-y-2">
      {/* Selected items display */}
      {displayNames.length > 0 && (
        <div className="flex flex-wrap gap-1 min-h-[32px] p-1 border rounded-md bg-background">
          {displayNames.map((name, index) => {
            const id = multiple
              ? value?.selector.ids?.[index]
              : value?.selector.id;
            return (
              <Badge key={id || index} variant="secondary" className="gap-1">
                {name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (id) handleRemove(id, name);
                  }}
                  className="hover:bg-muted rounded"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Picker trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="text-muted-foreground">
              {placeholder || config.searchPlaceholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={config.searchPlaceholder}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : (
                <>
                  <CommandEmpty>No {config.label.toLowerCase()}s found.</CommandEmpty>
                  <CommandGroup>
                    {resources.map((resource) => (
                      <CommandItem
                        key={resource.id}
                        value={resource.name}
                        onSelect={() => handleSelect(resource)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedIds.has(resource.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{resource.name}</div>
                          {resource.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {resource.description}
                            </div>
                          )}
                        </div>
                        {resource.status && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {resource.status}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear all button for multi-select */}
      {multiple && displayNames.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto py-1 px-2 text-xs text-muted-foreground"
          onClick={handleClear}
          disabled={disabled}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
