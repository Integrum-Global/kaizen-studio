/**
 * SourceAgentStep Component
 *
 * Step 1: Select the source agent (delegator) for trust delegation
 */

import { Search, User } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrustChains } from "../../../../hooks";
import type { TrustChain } from "../../../../types";
import { cn } from "@/lib/utils";

interface SourceAgentStepProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function SourceAgentStep({
  value,
  onChange,
  error,
}: SourceAgentStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: trustChainsData, isLoading } = useTrustChains();

  // Filter trust chains by search query
  const eligibleChains = trustChainsData?.items?.filter((chain: TrustChain) => {
    const matchesSearch =
      !searchQuery ||
      chain.genesis.agent_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">
          Select Source Agent (Delegator)
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the agent that will delegate its trust to another agent.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by agent ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Manual UUID input */}
      <div className="space-y-2">
        <Label>Or enter Agent ID directly</Label>
        <Input
          placeholder="00000000-0000-0000-0000-000000000000"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* Agent list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : eligibleChains && eligibleChains.length > 0 ? (
          eligibleChains.map((chain: TrustChain) => (
            <Card
              key={chain.genesis.agent_id}
              className={cn(
                "p-3 cursor-pointer transition-colors",
                value === chain.genesis.agent_id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "hover:bg-accent"
              )}
              onClick={() => onChange(chain.genesis.agent_id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono block truncate">
                    {chain.genesis.agent_id}
                  </code>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {chain.capabilities.length} capabilities
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </div>
                {value === chain.genesis.agent_id && (
                  <Badge className="bg-blue-500">Selected</Badge>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No agents found</p>
            <p className="text-xs mt-1">Enter an agent ID manually above</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
