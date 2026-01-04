/**
 * TeamPicker - Team-specific picker with multi-select support
 * Uses the useTeams hook to fetch teams from the backend
 */

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X, Loader2, Users } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { ResourceReference } from "../types";
import { useTeams } from "@/features/teams/hooks";

interface TeamPickerProps {
  value: ResourceReference | null;
  onChange: (ref: ResourceReference | null) => void;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Filter teams by search term (client-side filtering)
 */
function filterTeams(
  teams: Array<{ id: string; name: string; description?: string }>,
  searchTerm: string
) {
  if (!searchTerm) return teams;

  const term = searchTerm.toLowerCase();
  return teams.filter(
    (t) =>
      t.name.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term)
  );
}

export function TeamPicker({
  value,
  onChange,
  multiple = false,
  disabled = false,
  placeholder = "Select teams...",
}: TeamPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch teams from the backend
  const { data, isPending, error } = useTeams();

  // Transform teams data
  const allTeams = useMemo(() => {
    return (data?.records ?? []).map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description || "",
    }));
  }, [data?.records]);

  // Filter teams by search term
  const teams = useMemo(
    () => filterTeams(allTeams, searchTerm),
    [allTeams, searchTerm]
  );

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

  const handleSelect = (team: { id: string; name: string }) => {
    if (multiple) {
      // Multi-select: toggle selection
      const newIds = new Set(selectedIds);
      const newNames = [...displayNames];

      if (newIds.has(team.id)) {
        newIds.delete(team.id);
        const nameIndex = newNames.indexOf(team.name);
        if (nameIndex > -1) newNames.splice(nameIndex, 1);
      } else {
        newIds.add(team.id);
        newNames.push(team.name);
      }

      if (newIds.size === 0 || newNames.length === 0) {
        onChange(null);
      } else {
        onChange({
          $ref: "resource",
          type: "team",
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
        type: "team",
        selector: { id: team.id },
        display: {
          name: team.name,
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
        type: "team",
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
      {/* Selected teams display with badges and remove buttons */}
      {displayNames.length > 0 && (
        <div className="flex flex-wrap gap-1 min-h-[32px] p-1 border rounded-md bg-background">
          {displayNames.map((name, index) => {
            const id = multiple
              ? value?.selector.ids?.[index]
              : value?.selector.id;
            return (
              <Badge key={id || index} variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (id) handleRemove(id, name);
                  }}
                  className="hover:bg-muted rounded ml-1"
                  disabled={disabled}
                  aria-label={`Remove ${name}`}
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
            <span className="text-muted-foreground">{placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search teams..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {isPending ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading teams...
                  </span>
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">
                  {error.message || "Failed to load teams"}
                </div>
              ) : (
                <>
                  <CommandEmpty>No teams found.</CommandEmpty>
                  <CommandGroup>
                    {teams.map((team) => (
                      <CommandItem
                        key={team.id}
                        value={team.name}
                        onSelect={() => handleSelect(team)}
                        className="flex items-center gap-2"
                      >
                        {multiple ? (
                          <Checkbox
                            checked={selectedIds.has(team.id)}
                            className="mr-2"
                          />
                        ) : (
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedIds.has(team.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium truncate">
                              {team.name}
                            </span>
                          </div>
                          {team.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {team.description}
                            </div>
                          )}
                        </div>
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
