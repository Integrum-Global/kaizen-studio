import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { ConnectorForm } from "./ConnectorForm";
import { useCreateConnector, useUpdateConnector } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type {
  Connector,
  CreateConnectorRequest,
  UpdateConnectorRequest,
} from "../types";

interface ConnectorDialogProps {
  connector?: Connector;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectorDialog({
  connector,
  open,
  onOpenChange,
}: ConnectorDialogProps) {
  const createConnector = useCreateConnector();
  const updateConnector = useUpdateConnector();
  const { toast } = useToast();

  const handleSubmit = async (
    data: CreateConnectorRequest | UpdateConnectorRequest
  ) => {
    try {
      if (connector) {
        await updateConnector.mutateAsync({
          id: connector.id,
          input: data as UpdateConnectorRequest,
        });
        toast({
          title: "Success",
          description: "Connector updated successfully",
        });
      } else {
        await createConnector.mutateAsync(data as CreateConnectorRequest);
        toast({
          title: "Success",
          description: "Connector created successfully",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to save connector",
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
          <DialogTitle>
            {connector ? "Edit Connector" : "Create New Connector"}
          </DialogTitle>
          <DialogDescription>
            {connector
              ? "Update the connector configuration"
              : "Create a new connector to integrate external services"}
          </DialogDescription>
        </DialogHeader>
        <ConnectorForm
          initialData={
            connector
              ? {
                  name: connector.name,
                  connector_type: connector.connector_type,
                  provider: connector.provider,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createConnector.isPending || updateConnector.isPending}
          mode={connector ? "update" : "create"}
        />
      </DialogContent>
    </Dialog>
  );
}
