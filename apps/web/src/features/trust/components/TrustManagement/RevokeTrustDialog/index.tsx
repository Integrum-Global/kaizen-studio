/**
 * RevokeTrustDialog Component
 *
 * Confirmation dialog for revoking trust from an agent
 */

import { useState } from "react";
import { AlertTriangle, Loader2, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRevokeTrust } from "../../../hooks";

interface RevokeTrustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName?: string;
  onSuccess?: () => void;
}

export function RevokeTrustDialog({
  open,
  onOpenChange,
  agentId,
  agentName,
  onSuccess,
}: RevokeTrustDialogProps) {
  const { toast } = useToast();
  const { mutate: revokeTrust, isPending } = useRevokeTrust();
  const [reason, setReason] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const expectedConfirmation = "REVOKE";
  const isConfirmed = confirmationText === expectedConfirmation;

  const handleRevoke = () => {
    if (!isConfirmed) return;

    revokeTrust(
      {
        agent_id: agentId,
        reason: reason || "No reason provided",
      },
      {
        onSuccess: () => {
          toast({
            title: "Trust Revoked",
            description: `Successfully revoked trust for agent ${agentName || agentId}`,
          });
          setReason("");
          setConfirmationText("");
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error: Error) => {
          toast({
            title: "Revocation Failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setReason("");
      setConfirmationText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Revoke Trust
          </DialogTitle>
          <DialogDescription>
            This action will permanently revoke trust for this agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. The agent
              will immediately lose all capabilities and any active delegations
              will be invalidated.
            </AlertDescription>
          </Alert>

          {/* Agent Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Agent</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                {agentName && (
                  <div className="font-medium truncate">{agentName}</div>
                )}
                <code className="text-xs text-muted-foreground block truncate">
                  {agentId}
                </code>
              </div>
              <Badge variant="destructive">Will be revoked</Badge>
            </div>
          </div>

          <Separator />

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Revocation (Required for audit)
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for revoking this agent's trust..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Type{" "}
              <span className="font-mono text-red-600">
                {expectedConfirmation}
              </span>{" "}
              to confirm
            </Label>
            <input
              id="confirmation"
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type REVOKE to confirm"
              value={confirmationText}
              onChange={(e) =>
                setConfirmationText(e.target.value.toUpperCase())
              }
              autoComplete="off"
            />
            {confirmationText && !isConfirmed && (
              <p className="text-xs text-red-500">
                Please type {expectedConfirmation} exactly to confirm
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={!isConfirmed || !reason.trim() || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Revoke Trust
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
