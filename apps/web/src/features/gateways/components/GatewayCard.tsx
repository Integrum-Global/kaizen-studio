import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Activity, ArrowRight, Settings } from "lucide-react";
import type { Gateway } from "../types";

interface GatewayCardProps {
  gateway: Gateway;
  onViewDetails?: (gateway: Gateway) => void;
  onPromote?: (gateway: Gateway) => void;
  onScale?: (gateway: Gateway) => void;
}

const statusColors: Record<
  Gateway["status"],
  "default" | "destructive" | "secondary" | "outline"
> = {
  healthy: "default",
  degraded: "secondary",
  down: "destructive",
  unknown: "outline",
};

const environmentColors: Record<
  Gateway["environment"],
  "default" | "secondary" | "outline"
> = {
  development: "outline",
  staging: "secondary",
  production: "default",
};

export function GatewayCard({
  gateway,
  onViewDetails,
  onPromote,
  onScale,
}: GatewayCardProps) {
  const canPromote = gateway.environment !== "production";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">{gateway.name}</CardTitle>
              <CardDescription className="text-sm">
                {gateway.endpoint}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={environmentColors[gateway.environment]}>
              {gateway.environment}
            </Badge>
            <Badge variant={statusColors[gateway.status]}>
              {gateway.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {gateway.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {gateway.description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <p className="text-muted-foreground">Version</p>
            <p className="font-medium">{gateway.version}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Replicas</p>
            <p className="font-medium">
              {gateway.replicas} / {gateway.maxReplicas}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Scaling</p>
            <p className="font-medium capitalize">{gateway.scalingMode}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(gateway)}
          >
            <Activity className="h-4 w-4 mr-1" />
            Details
          </Button>
          {canPromote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPromote?.(gateway)}
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Promote
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onScale?.(gateway)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Scale
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
