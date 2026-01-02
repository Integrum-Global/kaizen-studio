/**
 * AuthoritySelector Component
 *
 * Searchable dropdown for selecting an organizational authority
 */

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthorities } from "../../../hooks";
import type { AuthorityType } from "../../../types";

interface AuthoritySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
}

const authorityTypeColors: Record<AuthorityType, string> = {
  organization: "bg-blue-500",
  system: "bg-purple-500",
  human: "bg-green-500",
};

const authorityTypeLabels: Record<AuthorityType, string> = {
  organization: "ORG",
  system: "SYS",
  human: "USER",
};

export function AuthoritySelector({
  value,
  onValueChange,
  error,
}: AuthoritySelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: authorities, isPending } = useAuthorities();

  const selectedAuthority = authorities?.find((auth) => auth.id === value);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error && "border-red-500",
              !value && "text-muted-foreground"
            )}
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading authorities...
              </div>
            ) : selectedAuthority ? (
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-white",
                    authorityTypeColors[selectedAuthority.authority_type]
                  )}
                >
                  {authorityTypeLabels[selectedAuthority.authority_type]}
                </Badge>
                {selectedAuthority.name}
              </div>
            ) : (
              "Select authority..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search authorities..." />
            <CommandEmpty>No authority found.</CommandEmpty>
            <CommandGroup>
              {authorities?.map((authority) => (
                <CommandItem
                  key={authority.id}
                  value={authority.id}
                  onSelect={() => {
                    onValueChange(authority.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === authority.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Badge
                      className={cn(
                        "text-white",
                        authorityTypeColors[authority.authority_type]
                      )}
                    >
                      {authorityTypeLabels[authority.authority_type]}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium">{authority.name}</div>
                      {authority.metadata?.description && (
                        <div className="text-xs text-muted-foreground">
                          {authority.metadata.description}
                        </div>
                      )}
                    </div>
                    {!authority.is_active && (
                      <Badge variant="outline" className="text-red-500">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
