import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { ApiKeyForm } from "./ApiKeyForm";
import { ApiKeyRevealDialog } from "./ApiKeyRevealDialog";
import { useCreateApiKey } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type { CreateApiKeyInput } from "../types";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const createApiKey = useCreateApiKey();
  const { toast } = useToast();
  const [newApiKey, setNewApiKey] = useState<{
    name: string;
    fullKey: string;
  } | null>(null);
  const [showRevealDialog, setShowRevealDialog] = useState(false);

  const handleSubmit = async (data: CreateApiKeyInput) => {
    try {
      const result = await createApiKey.mutateAsync(data);
      setNewApiKey({
        name: result.key.name,
        fullKey: result.fullKey,
      });
      onOpenChange(false);
      setShowRevealDialog(true);
      toast({
        title: "Success",
        description: "API key created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleRevealDialogClose = () => {
    setShowRevealDialog(false);
    setNewApiKey(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key to access the Kaizen Studio API
            </DialogDescription>
          </DialogHeader>
          <ApiKeyForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createApiKey.isPending}
          />
        </DialogContent>
      </Dialog>

      {newApiKey && (
        <ApiKeyRevealDialog
          apiKeyName={newApiKey.name}
          fullKey={newApiKey.fullKey}
          open={showRevealDialog}
          onOpenChange={handleRevealDialogClose}
        />
      )}
    </>
  );
}
