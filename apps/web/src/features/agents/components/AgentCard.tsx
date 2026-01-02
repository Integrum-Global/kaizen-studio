import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
} from "@/components/ui";
import { MoreVertical, Copy, Edit, Trash2 } from "lucide-react";
import type { Agent } from "../types";

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
};

const typeLabels = {
  chat: "Chat",
  completion: "Completion",
  embedding: "Embedding",
  custom: "Custom",
};

const providerLabels = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  azure: "Azure",
  custom: "Custom",
};

export function AgentCard({
  agent,
  onEdit,
  onDuplicate,
  onDelete,
}: AgentCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the dropdown menu
    if (
      (e.target as HTMLElement).closest('[role="menu"]') ||
      (e.target as HTMLElement).closest('button[aria-haspopup="menu"]')
    ) {
      return;
    }
    navigate(`/agents/${agent.id}`);
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              {agent.name || "Unnamed Agent"}
            </CardTitle>
            <Badge
              className={statusColors[agent.status] || statusColors.inactive}
            >
              {agent.status || "unknown"}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {agent.description}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" aria-label="Agent actions">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(agent);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(agent.id);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(agent.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">
              {typeLabels[agent.type] || agent.type || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Provider</p>
            <p className="font-medium">
              {providerLabels[agent.provider] || agent.provider || "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{agent.model || "Not set"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tools</p>
            <p className="font-medium">
              {(agent.tools || []).filter((t) => t.enabled).length} enabled
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
