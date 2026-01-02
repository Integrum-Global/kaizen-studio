import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
  Alert,
  AlertDescription,
} from "@/components/ui";
import { ArrowLeft, Edit, Trash2, Play, Send, Loader2, AlertCircle } from "lucide-react";
import { useAgent, useDeleteAgent } from "@/features/agents/hooks";
import { AgentFormDialog } from "@/features/agents/components";
import { agentsApi } from "@/features/agents/api";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@/features/agents/types";

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

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agent, isPending, error } = useAgent(id!);
  const deleteAgent = useDeleteAgent();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this agent? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteAgent.mutateAsync(id!);
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
      navigate("/agents");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    }
  };

  if (isPending) {
    return <AgentDetailSkeleton />;
  }

  if (error || !agent) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/agents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Button>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load agent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => navigate("/agents")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <Badge className={statusColors[agent.status]}>{agent.status}</Badge>
          </div>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setIsTestDialogOpen(true)}>
            <Play className="mr-2 h-4 w-4" />
            Test
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Agent model and provider settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{typeLabels[agent.type]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium">
                    {providerLabels[agent.provider]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{agent.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-medium">{agent.temperature}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Tokens</p>
                  <p className="font-medium">
                    {agent.max_tokens.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Organization ID
                  </p>
                  <p className="font-medium font-mono text-xs">
                    {agent.organization_id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Instructions that guide the agent's behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.system_prompt ? (
                <pre className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">
                  {agent.system_prompt}
                </pre>
              ) : (
                <p className="text-muted-foreground">
                  No system prompt configured
                </p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>
                Agent creation and modification details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium font-mono text-xs">
                  {agent.created_by}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {new Date(agent.created_at).toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Updated At</p>
                <p className="font-medium">
                  {new Date(agent.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <CardTitle>Available Tools</CardTitle>
              <CardDescription>
                Tools and capabilities available to this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.tools.length > 0 ? (
                <div className="space-y-3">
                  {agent.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tool.name}</p>
                          <Badge
                            variant={tool.enabled ? "default" : "secondary"}
                          >
                            {tool.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No tools configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Usage Metrics</CardTitle>
              <CardDescription>
                Agent performance and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Metrics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <AgentFormDialog
        agent={agent}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Test Dialog */}
      <AgentTestDialog
        agent={agent}
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
      />
    </div>
  );
}

interface AgentTestDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AgentTestDialog({ agent, open, onOpenChange }: AgentTestDialogProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<{
    can_execute: boolean;
    message: string;
    provider: string;
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const { toast } = useToast();

  // Check execution status when dialog opens
  useEffect(() => {
    if (open) {
      setStatusLoading(true);
      agentsApi
        .getExecutionStatus(agent.id)
        .then((status) => {
          setExecutionStatus({
            can_execute: status.can_execute,
            message: status.message,
            provider: status.provider,
          });
        })
        .catch(() => {
          setExecutionStatus({
            can_execute: false,
            message: "Failed to check execution status",
            provider: "unknown",
          });
        })
        .finally(() => setStatusLoading(false));
    }
  }, [open, agent.id]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call the real agent execution API
      const result = await agentsApi.execute(
        agent.id,
        userMessage,
        conversationHistory.length > 0 ? conversationHistory : undefined
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.content },
      ]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            "Failed to execute agent";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Test Agent: {agent.name}</DialogTitle>
          <DialogDescription>
            Send messages to test the agent's responses using {agent.model}
          </DialogDescription>
        </DialogHeader>

        {/* Execution Status Alert */}
        {!statusLoading && executionStatus && !executionStatus.can_execute && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {executionStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/30">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Send a message to start testing the agent</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background border rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 mt-4">
          <Textarea
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            disabled={isLoading || !executionStatus?.can_execute}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || !executionStatus?.can_execute}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AgentDetailSkeleton() {
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
