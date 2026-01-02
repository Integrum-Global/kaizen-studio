import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  MoreVertical,
  Play,
  Square,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react";
import { DeploymentStatusBadge } from "./DeploymentStatusBadge";
import type { Deployment } from "../types";

interface DeploymentCardProps {
  deployment: Deployment;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onEdit: (deployment: Deployment) => void;
  onDelete: (id: string) => void;
}

const environmentColors = {
  development: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  staging: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  production: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function DeploymentCard({
  deployment,
  onStart,
  onStop,
  onEdit,
  onDelete,
}: DeploymentCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or dropdown
    if (
      (e.target as HTMLElement).closest('[role="menu"]') ||
      (e.target as HTMLElement).closest("button")
    ) {
      return;
    }
    navigate(`/deployments/${deployment.id}`);
  };

  const canStart = ["stopped", "failed", "pending"].includes(deployment.status);
  const canStop = ["active", "deploying"].includes(deployment.status);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg">{deployment.pipelineName}</CardTitle>
            <DeploymentStatusBadge status={deployment.status} />
            <Badge className={environmentColors[deployment.environment]}>
              {deployment.environment}
            </Badge>
          </div>
          <CardDescription>
            Version {deployment.version}
            {deployment.endpoint && (
              <>
                {" • "}
                <a
                  href={deployment.endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {deployment.endpoint}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </>
            )}
          </CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canStart && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onStart(deployment.id);
                }}
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </DropdownMenuItem>
            )}
            {canStop && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onStop(deployment.id);
                }}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(deployment);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Config
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(deployment.id);
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
            <p className="text-muted-foreground">Replicas</p>
            <p className="font-medium">{deployment.config.replicas}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Concurrency</p>
            <p className="font-medium">{deployment.config.maxConcurrency}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Timeout</p>
            <p className="font-medium">{deployment.config.timeout}s</p>
          </div>
          <div>
            <p className="text-muted-foreground">Retries</p>
            <p className="font-medium">{deployment.config.retries}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
