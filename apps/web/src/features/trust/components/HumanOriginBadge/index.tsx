/**
 * HumanOriginBadge Component
 *
 * Displays the human who ultimately authorized an agent action.
 * This is a core EATP visual element that answers: "Who is responsible for this?"
 *
 * Usage:
 *   <HumanOriginBadge humanOrigin={auditAnchor.human_origin} />
 *   <HumanOriginBadge humanOrigin={delegation.human_origin} showDetails />
 */

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Building2, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HumanOrigin } from "../../types";

interface HumanOriginBadgeProps {
  humanOrigin: HumanOrigin | null | undefined;
  showDetails?: boolean; // Show full details or compact
  showProvider?: boolean; // Show auth provider icon
  showTimestamp?: boolean; // Show when authenticated
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Map auth providers to icons and colors
const AUTH_PROVIDER_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  okta: { icon: Shield, color: "text-blue-600", label: "Okta" },
  azure_ad: { icon: Building2, color: "text-sky-600", label: "Azure AD" },
  google: { icon: Shield, color: "text-red-500", label: "Google" },
  saml: { icon: Shield, color: "text-purple-600", label: "SAML" },
  oidc: { icon: Shield, color: "text-green-600", label: "OIDC" },
  ldap: { icon: Building2, color: "text-yellow-600", label: "LDAP" },
  session: { icon: User, color: "text-gray-600", label: "Session" },
  custom: { icon: Shield, color: "text-gray-500", label: "Custom" },
};

const SIZE_CONFIG = {
  sm: {
    avatar: "h-6 w-6 text-xs",
    icon: "h-3 w-3",
    text: "text-xs",
    clock: "h-3 w-3",
  },
  md: {
    avatar: "h-8 w-8 text-sm",
    icon: "h-4 w-4",
    text: "text-sm",
    clock: "h-3 w-3",
  },
  lg: {
    avatar: "h-10 w-10 text-base",
    icon: "h-5 w-5",
    text: "text-base",
    clock: "h-4 w-4",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function HumanOriginBadge({
  humanOrigin,
  showDetails = false,
  showProvider = true,
  showTimestamp = false,
  className,
  size = "md",
}: HumanOriginBadgeProps) {
  const sizeStyles = SIZE_CONFIG[size];

  // Handle missing human origin (legacy records)
  if (!humanOrigin) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        <User className={cn(sizeStyles.icon, "mr-1")} />
        Legacy
      </Badge>
    );
  }

  // Get provider config with safe fallback to custom
  const providerKey = humanOrigin.authProvider as string;
  const providerConfig =
    AUTH_PROVIDER_CONFIG[providerKey] ?? AUTH_PROVIDER_CONFIG.custom;
  // providerConfig is guaranteed to be defined since we have custom as fallback
  const ProviderIcon = providerConfig!.icon;

  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar className={sizeStyles.avatar}>
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(humanOrigin.displayName)}
        </AvatarFallback>
      </Avatar>

      {showDetails && (
        <div className="flex flex-col">
          <span className={cn("font-medium", sizeStyles.text)}>
            {humanOrigin.displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {humanOrigin.humanId}
          </span>
        </div>
      )}

      {showProvider && (
        <ProviderIcon className={cn(sizeStyles.icon, providerConfig!.color)} />
      )}

      {showTimestamp && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className={sizeStyles.clock} />
          {formatRelativeTime(humanOrigin.authenticatedAt)}
        </span>
      )}
    </div>
  );

  // Wrap with tooltip for compact view
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent className="p-3">
            <div className="space-y-1">
              <p className="font-medium">{humanOrigin.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {humanOrigin.humanId}
              </p>
              <div className="flex items-center gap-1 text-xs">
                <ProviderIcon className={cn("h-3 w-3", providerConfig!.color)} />
                <span>{providerConfig!.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Authenticated {formatRelativeTime(humanOrigin.authenticatedAt)}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export default HumanOriginBadge;
