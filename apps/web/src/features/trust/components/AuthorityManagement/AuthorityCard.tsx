/**
 * AuthorityCard Component
 *
 * Individual authority display card with actions
 */

import {
  Building2,
  User,
  Shield,
  MoreVertical,
  Edit,
  Power,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Authority } from "../../types";

interface AuthorityCardProps {
  authority: Authority;
  onEdit?: (authority: Authority) => void;
  onDeactivate?: (authority: Authority) => void;
  onViewDetails?: (authority: Authority) => void;
}

const AUTHORITY_TYPE_ICONS = {
  organization: Building2,
  system: Shield,
  human: User,
};

const AUTHORITY_TYPE_LABELS = {
  organization: "Organization",
  system: "System",
  human: "Human",
};

const AUTHORITY_TYPE_COLORS = {
  organization: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  system: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  human: "bg-green-500/10 text-green-700 dark:text-green-300",
};

export function AuthorityCard({
  authority,
  onEdit,
  onDeactivate,
  onViewDetails,
}: AuthorityCardProps) {
  const Icon = AUTHORITY_TYPE_ICONS[authority.type];

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-md cursor-pointer",
        !authority.isActive && "opacity-60"
      )}
      onClick={() => onViewDetails?.(authority)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg",
                AUTHORITY_TYPE_COLORS[authority.type]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{authority.name}</h3>
              <Badge
                variant="outline"
                className={cn("mt-1", AUTHORITY_TYPE_COLORS[authority.type])}
              >
                {AUTHORITY_TYPE_LABELS[authority.type]}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(authority)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(authority)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeactivate?.(authority)}
                className={cn(
                  authority.isActive ? "text-destructive" : "text-green-600"
                )}
              >
                <Power className="h-4 w-4 mr-2" />
                {authority.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {authority.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {authority.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">
                {authority.agentCount}
              </span>{" "}
              agents
            </div>
            <div>
              Created {format(new Date(authority.createdAt), "MMM d, yyyy")}
            </div>
          </div>

          <Badge
            variant={authority.isActive ? "default" : "secondary"}
            className={cn(
              authority.isActive
                ? "bg-green-500/10 text-green-700 dark:text-green-300"
                : ""
            )}
          >
            {authority.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Parent Authority */}
        {authority.parentAuthorityId && (
          <div className="text-xs text-muted-foreground pt-1">
            Child of {authority.parentAuthorityId.slice(0, 8)}...
          </div>
        )}

        {/* Certificate Hash */}
        {authority.certificateHash && (
          <div className="text-xs text-muted-foreground font-mono pt-1">
            Cert: {authority.certificateHash.slice(0, 16)}...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
