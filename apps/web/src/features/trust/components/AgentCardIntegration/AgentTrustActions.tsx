/**
 * AgentTrustActions Component
 *
 * Quick actions for agent trust management:
 * - Establish Trust: If no trust exists
 * - Delegate Trust: If has trust
 * - Revoke Trust: If has trust
 * - Verify Trust: Verify current trust status
 *
 * Each action has loading states and error handling
 */

import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  useAgentTrustSummary,
  useVerifyTrust,
  useRevokeTrust,
} from "../../hooks";
import { TrustStatus, VerificationLevel } from "../../types";
import { cn } from "@/lib/utils";

interface AgentTrustActionsProps {
  agentId: string;
  onEstablishTrust?: (agentId: string) => void;
  onDelegateTrust?: (agentId: string) => void;
  onRevokeTrust?: (agentId: string) => void;
  compact?: boolean;
  className?: string;
}

export function AgentTrustActions({
  agentId,
  onEstablishTrust,
  onDelegateTrust,
  onRevokeTrust,
  compact = false,
  className,
}: AgentTrustActionsProps) {
  const [verifyingTrust, setVerifyingTrust] = useState(false);
  const { toast } = useToast();
  const { data: trustSummary, refetch } = useAgentTrustSummary(agentId);
  const verifyMutation = useVerifyTrust();
  const revokeMutation = useRevokeTrust();

  const hasTrust = trustSummary?.status === TrustStatus.VALID;
  const canDelegate = hasTrust;
  const canRevoke = hasTrust || trustSummary?.status === TrustStatus.EXPIRED;

  const handleVerifyTrust = async () => {
    setVerifyingTrust(true);
    try {
      const result = await verifyMutation.mutateAsync({
        agent_id: agentId,
        action: "verify_status",
        level: VerificationLevel.STANDARD,
      });

      if (result.valid) {
        toast({
          title: "Trust Verified",
          description: "Agent trust is valid and active",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.reason || "Trust verification failed",
          variant: "destructive",
        });
      }

      await refetch();
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify trust",
        variant: "destructive",
      });
    } finally {
      setVerifyingTrust(false);
    }
  };

  const handleRevokeTrust = async () => {
    if (onRevokeTrust) {
      onRevokeTrust(agentId);
      return;
    }

    try {
      await revokeMutation.mutateAsync({
        agent_id: agentId,
        reason: "Manual revocation",
      });

      toast({
        title: "Trust Revoked",
        description: "Agent trust has been revoked successfully",
      });

      await refetch();
    } catch (error: any) {
      toast({
        title: "Revocation Error",
        description: error.message || "Failed to revoke trust",
        variant: "destructive",
      });
    }
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Shield className="h-4 w-4 mr-2" />
            Trust Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!hasTrust && onEstablishTrust && (
            <>
              <DropdownMenuItem onClick={() => onEstablishTrust(agentId)}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Establish Trust
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {canDelegate && onDelegateTrust && (
            <DropdownMenuItem onClick={() => onDelegateTrust(agentId)}>
              <Shield className="h-4 w-4 mr-2" />
              Delegate Trust
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={handleVerifyTrust}
            disabled={verifyingTrust}
          >
            {verifyingTrust ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldAlert className="h-4 w-4 mr-2" />
            )}
            Verify Trust
          </DropdownMenuItem>

          {canRevoke && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleRevokeTrust}
                disabled={revokeMutation.isPending}
                className="text-destructive focus:text-destructive"
              >
                {revokeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShieldX className="h-4 w-4 mr-2" />
                )}
                Revoke Trust
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!hasTrust && onEstablishTrust && (
        <Button
          variant="default"
          size="sm"
          onClick={() => onEstablishTrust(agentId)}
          className="w-full"
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          Establish Trust
        </Button>
      )}

      {canDelegate && onDelegateTrust && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelegateTrust(agentId)}
          className="w-full"
        >
          <Shield className="h-4 w-4 mr-2" />
          Delegate Trust
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleVerifyTrust}
        disabled={verifyingTrust}
        className="w-full"
      >
        {verifyingTrust ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ShieldAlert className="h-4 w-4 mr-2" />
        )}
        Verify Trust
      </Button>

      {canRevoke && (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRevokeTrust}
          disabled={revokeMutation.isPending}
          className="w-full"
        >
          {revokeMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShieldX className="h-4 w-4 mr-2" />
          )}
          Revoke Trust
        </Button>
      )}
    </div>
  );
}
