import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from "@/components/ui";
import {
  MoreVertical,
  Trash2,
  Edit,
  Database,
  Cloud,
  Mail,
  MessageSquare,
  HardDrive,
  Globe,
} from "lucide-react";
import type { Connector, ConnectorType } from "../types";

interface ConnectorCardProps {
  connector: Connector;
  onEdit: (connector: Connector) => void;
  onDelete: (id: string) => void;
  onTest: (connector: Connector) => void;
}

const connectorIcons: Record<ConnectorType, React.ComponentType<any>> = {
  database: Database,
  cloud: Cloud,
  email: Mail,
  messaging: MessageSquare,
  storage: HardDrive,
  api: Globe,
};

const statusVariants: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  connected: "default",
  active: "default",
  disconnected: "secondary",
  inactive: "secondary",
  error: "destructive",
  pending: "outline",
};

export function ConnectorCard({
  connector,
  onEdit,
  onDelete,
  onTest,
}: ConnectorCardProps) {
  const Icon = connectorIcons[connector.connector_type];

  return (
    <Card className="hover:shadow-lg transition-all hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{connector.name}</CardTitle>
            <Badge variant={statusVariants[connector.status]}>
              {connector.status}
            </Badge>
          </div>
          <CardDescription className="capitalize">
            {connector.connector_type} connector • {connector.provider}
          </CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTest(connector)}>
              Test Connection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(connector)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(connector.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Created {new Date(connector.created_at).toLocaleDateString()}
          </span>
          {connector.last_tested_at && (
            <>
              <span>•</span>
              <span>
                Tested {new Date(connector.last_tested_at).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
