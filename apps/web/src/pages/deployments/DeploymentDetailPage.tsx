import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
} from "@/components/ui";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Square,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  useDeployment,
  useDeleteDeployment,
  useStartDeployment,
  useStopDeployment,
} from "@/features/deployments/hooks";
import {
  DeploymentDialog,
  DeploymentStatusBadge,
} from "@/features/deployments/components";
import { useToast } from "@/hooks/use-toast";

const environmentColors = {
  development: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  staging: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  production: "bg-red-500/10 text-red-500 border-red-500/20",
};

const environmentLabels = {
  development: "Development",
  staging: "Staging",
  production: "Production",
};

export function DeploymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deployment, isPending, error } = useDeployment(id!);
  const deleteDeployment = useDeleteDeployment();
  const startDeployment = useStartDeployment();
  const stopDeployment = useStopDeployment();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this deployment? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDeployment.mutateAsync(id!);
      toast({
        title: "Success",
        description: "Deployment deleted successfully",
      });
      navigate("/deployments");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deployment",
        variant: "destructive",
      });
    }
  };

  const handleStart = async () => {
    try {
      await startDeployment.mutateAsync(id!);
      toast({
        title: "Success",
        description: "Deployment started successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start deployment",
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    try {
      await stopDeployment.mutateAsync(id!);
      toast({
        title: "Success",
        description: "Deployment stopped successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop deployment",
        variant: "destructive",
      });
    }
  };

  const handleCopyEndpoint = () => {
    if (deployment?.endpoint) {
      navigator.clipboard.writeText(deployment.endpoint);
      toast({
        title: "Copied",
        description: "Endpoint URL copied to clipboard",
      });
    }
  };

  if (isPending) {
    return <DeploymentDetailSkeleton />;
  }

  if (error || !deployment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/deployments")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deployments
        </Button>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load deployment</p>
        </div>
      </div>
    );
  }

  const canStart = ["stopped", "failed", "pending"].includes(deployment.status);
  const canStop = ["active", "deploying"].includes(deployment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => navigate("/deployments")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deployments
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">
              {deployment.pipelineName}
            </h1>
            <DeploymentStatusBadge status={deployment.status} />
            <Badge className={environmentColors[deployment.environment]}>
              {environmentLabels[deployment.environment]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Version {deployment.version}
            {deployment.endpoint && (
              <>
                {" • "}
                <a
                  href={deployment.endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:underline"
                >
                  {deployment.endpoint}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {canStart && (
            <Button variant="outline" onClick={handleStart}>
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          )}
          {canStop && (
            <Button variant="outline" onClick={handleStop}>
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Config
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Endpoint */}
          {deployment.endpoint && (
            <Card>
              <CardHeader>
                <CardTitle>Endpoint</CardTitle>
                <CardDescription>
                  Access your deployment through this URL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted p-3 rounded-md text-sm font-mono">
                    {deployment.endpoint}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyEndpoint}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={deployment.endpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Deployment runtime settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Replicas</p>
                  <p className="font-medium">{deployment.config.replicas}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Max Concurrency
                  </p>
                  <p className="font-medium">
                    {deployment.config.maxConcurrency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeout</p>
                  <p className="font-medium">
                    {deployment.config.timeout} seconds
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retries</p>
                  <p className="font-medium">{deployment.config.retries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Configuration values passed to the deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(deployment.config.environment).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(deployment.config.environment).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <code className="text-sm font-mono font-medium">
                          {key}
                        </code>
                        <code className="text-sm font-mono text-muted-foreground">
                          {value}
                        </code>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No environment variables configured
                </p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>
                Deployment creation and modification details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline ID</p>
                <p className="font-medium font-mono text-xs">
                  {deployment.pipelineId}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium font-mono text-xs">
                  {deployment.createdBy}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {new Date(deployment.createdAt).toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Updated At</p>
                <p className="font-medium">
                  {new Date(deployment.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Logs</CardTitle>
              <CardDescription>
                Real-time logs from your deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Logs coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Deployment performance and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Metrics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <DeploymentDialog
        deployment={deployment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}

function DeploymentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
