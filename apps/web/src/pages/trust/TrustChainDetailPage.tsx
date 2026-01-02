import { useParams, useNavigate } from "react-router-dom";
import { Button, Skeleton } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import { TrustChainViewer } from "@/features/trust";
import { useTrustChain } from "@/features/trust";

export function TrustChainDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { data: trustChain, isPending, error } = useTrustChain(agentId!);

  if (isPending) {
    return <TrustChainDetailSkeleton />;
  }

  if (error || !trustChain) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/trust")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Trust Dashboard
        </Button>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load trust chain</p>
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
            onClick={() => navigate("/trust")}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Trust Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Trust Chain: {trustChain.genesis.agent_id}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Detailed view of the agent's trust chain and verification status
          </p>
        </div>
      </div>

      {/* Trust Chain Viewer */}
      <TrustChainViewer trustChain={trustChain} />
    </div>
  );
}

function TrustChainDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
