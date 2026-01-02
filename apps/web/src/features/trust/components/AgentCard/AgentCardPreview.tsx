/**
 * AgentCardPreview Component
 *
 * Trust-aware agent card preview showing complete agent information
 * including trust status, capabilities, protocols, and endpoints
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustStatusBadge } from "../TrustStatusBadge";
import { AgentWithTrust } from "../../types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AgentCardPreviewProps {
  agentId: string;
  className?: string;
  onViewTrustChain?: (agentId: string) => void;
}

async function fetchAgentWithTrust(
  agentId: string
): Promise<AgentWithTrust> {
  const response = await fetch(
    `/api/v1/trust/agents/${agentId}/with-trust`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch agent trust information");
  }
  return response.json();
}

function AgentCardPreviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}

export function AgentCardPreview({
  agentId,
  className,
  onViewTrustChain,
}: AgentCardPreviewProps) {
  const [isCapabilitiesExpanded, setIsCapabilitiesExpanded] = useState(false);
  const [isEndpointsExpanded, setIsEndpointsExpanded] = useState(false);

  const { data: agent, isPending, error } = useQuery({
    queryKey: ["agent-with-trust", agentId],
    queryFn: () => fetchAgentWithTrust(agentId),
  });

  if (isPending) {
    return <AgentCardPreviewSkeleton />;
  }

  if (error || !agent) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">
            Failed to load agent information
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxVisibleCapabilities = 5;
  const visibleCapabilities = isCapabilitiesExpanded
    ? agent.capabilities
    : agent.capabilities.slice(0, maxVisibleCapabilities);
  const hasMoreCapabilities =
    agent.capabilities.length > maxVisibleCapabilities;

  const maxVisibleEndpoints = 3;
  const visibleEndpoints = isEndpointsExpanded
    ? agent.endpoints
    : agent.endpoints.slice(0, maxVisibleEndpoints);
  const hasMoreEndpoints = agent.endpoints.length > maxVisibleEndpoints;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">ID: {agent.id}</p>
          </div>
          <TrustStatusBadge status={agent.trust_status} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trust Chain Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Trust Information</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {agent.established_by && (
              <div>
                <span className="text-muted-foreground">Established by:</span>
                <p className="font-medium truncate">{agent.established_by}</p>
              </div>
            )}
            {agent.expires_at && (
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(agent.expires_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Capabilities */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Capabilities ({agent.capabilities.length})
            </h4>
            {hasMoreCapabilities && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCapabilitiesExpanded(!isCapabilitiesExpanded)}
                className="h-6 px-2 text-xs"
              >
                {isCapabilitiesExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show all
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleCapabilities.map((capability, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {capability}
              </Badge>
            ))}
          </div>
        </div>

        {/* Supported Protocols */}
        {agent.protocols.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Supported Protocols ({agent.protocols.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {agent.protocols.map((protocol, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {protocol}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {agent.constraints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Constraints ({agent.constraints.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {agent.constraints.map((constraint, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs border-yellow-300 text-yellow-700"
                >
                  {constraint}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Interaction Endpoints */}
        {agent.endpoints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Endpoints ({agent.endpoints.length})
              </h4>
              {hasMoreEndpoints && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEndpointsExpanded(!isEndpointsExpanded)}
                  className="h-6 px-2 text-xs"
                >
                  {isEndpointsExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show all
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-1">
              {visibleEndpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium">{endpoint.name}</p>
                    <p className="text-muted-foreground truncate">
                      {endpoint.url}
                    </p>
                  </div>
                  <a
                    href={endpoint.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Trust Chain Button */}
        {onViewTrustChain && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewTrustChain(agent.id)}
            className="w-full"
          >
            View Trust Chain
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
