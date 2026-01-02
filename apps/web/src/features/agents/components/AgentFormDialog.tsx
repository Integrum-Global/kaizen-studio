import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { AgentForm } from "./AgentForm";
import { useCreateAgent, useUpdateAgent } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type { Agent, CreateAgentInput, UpdateAgentInput } from "../types";

interface AgentFormDialogProps {
  agent?: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentFormDialog({
  agent,
  open,
  onOpenChange,
}: AgentFormDialogProps) {
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const { toast } = useToast();

  const handleSubmit = async (data: CreateAgentInput | UpdateAgentInput) => {
    try {
      if (agent) {
        await updateAgent.mutateAsync({ id: agent.id, data });
        toast({
          title: "Success",
          description: "Agent updated successfully",
        });
      } else {
        await createAgent.mutateAsync(data as CreateAgentInput);
        toast({
          title: "Success",
          description: "Agent created successfully",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save agent",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent ? "Edit Agent" : "Create New Agent"}</DialogTitle>
          <DialogDescription>
            {agent
              ? "Update the configuration for your AI agent"
              : "Configure a new AI agent with your preferred settings"}
          </DialogDescription>
        </DialogHeader>
        <AgentForm
          agent={agent}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createAgent.isPending || updateAgent.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
