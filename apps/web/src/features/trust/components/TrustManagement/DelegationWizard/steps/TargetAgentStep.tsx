/**
 * TargetAgentStep Component
 *
 * Step 2: Select the target agent (delegatee) for trust delegation
 */

import { Search, UserPlus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface TargetAgentStepProps {
  value: string;
  onChange: (value: string) => void;
  sourceAgentId: string;
  error?: string;
}

// In a real app, this would come from an API
const KNOWN_AGENTS = [
  {
    id: "agent-001",
    name: "Data Processor",
    description: "Handles data processing tasks",
  },
  {
    id: "agent-002",
    name: "Report Generator",
    description: "Generates reports",
  },
  {
    id: "agent-003",
    name: "Notification Service",
    description: "Sends notifications",
  },
];

export function TargetAgentStep({
  value,
  onChange,
  sourceAgentId,
  error,
}: TargetAgentStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = KNOWN_AGENTS.filter((agent) => {
    const matchesSearch =
      !searchQuery ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Exclude the source agent
    const isNotSource = agent.id !== sourceAgentId;
    return matchesSearch && isNotSource;
  });

  const isValidUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">
          Select Target Agent (Delegatee)
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the agent that will receive the delegated trust. This agent
          will be able to use the delegated capabilities.
        </p>
      </div>

      {sourceAgentId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Delegating from: <code className="text-xs">{sourceAgentId}</code>
          </AlertDescription>
        </Alert>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
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
          className={cn(value && !isValidUUID(value) && "border-yellow-500")}
        />
        {value && !isValidUUID(value) && (
          <p className="text-xs text-yellow-600">
            Please enter a valid UUID format
          </p>
        )}
      </div>

      {/* Agent list */}
      <div className="space-y-2 max-h-[250px] overflow-y-auto">
        {filteredAgents.length > 0 ? (
          filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className={cn(
                "p-3 cursor-pointer transition-colors",
                value === agent.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "hover:bg-accent"
              )}
              onClick={() => onChange(agent.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{agent.name}</div>
                  <code className="text-xs text-muted-foreground block truncate">
                    {agent.id}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    {agent.description}
                  </p>
                </div>
                {value === agent.id && (
                  <Badge className="bg-blue-500">Selected</Badge>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No agents found</p>
            <p className="text-xs mt-1">Enter a custom agent ID above</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
