import { useState } from "react";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrganizationMembership } from "@/types/auth";

/**
 * Organization Switcher Component
 *
 * Allows users with multiple organizations to switch between them.
 * Shows current organization and provides a dropdown to switch.
 */
export function OrganizationSwitcher() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    organizations,
    activeOrganization,
    setOrganizations,
    switchOrganization,
  } = useAuthStore();

  // Fetch organizations on mount
  const { isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: async () => {
      const response = await authApi.getOrganizations();
      setOrganizations(response.organizations);
      return response.organizations;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Switch organization mutation
  const switchMutation = useMutation({
    mutationFn: async (orgId: string) => {
      return authApi.switchOrganization({ organization_id: orgId });
    },
    onSuccess: (data) => {
      switchOrganization(data.active_organization, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      });

      // Invalidate all queries to refetch with new org context
      queryClient.invalidateQueries();

      toast({
        title: "Organization switched",
        description: `Now viewing ${data.active_organization.name}`,
      });

      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to switch organization",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSwitch = (org: OrganizationMembership) => {
    if (org.id === activeOrganization?.id) {
      setOpen(false);
      return;
    }
    switchMutation.mutate(org.id);
  };

  // Don't show if only one organization
  if (organizations.length <= 1 && !isLoadingOrgs) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 max-w-[200px]"
          disabled={isLoadingOrgs || switchMutation.isPending}
        >
          {isLoadingOrgs || switchMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span className="truncate">
            {activeOrganization?.name || "Select Organization"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org)}
            className="flex items-center justify-between cursor-pointer"
            disabled={switchMutation.isPending}
          >
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="font-medium truncate">{org.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {org.role.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {org.is_primary && (
                <Badge variant="secondary" className="text-xs">
                  Primary
                </Badge>
              )}
              {org.id === activeOrganization?.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
