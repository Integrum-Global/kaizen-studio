/**
 * GenesisRecordCard Component
 *
 * Displays the genesis record of a trust chain
 */

import { format } from "date-fns";
import { Copy, Check, Shield } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AuthorityType, type GenesisRecord } from "../../types";

interface GenesisRecordCardProps {
  genesis: GenesisRecord;
}

const authorityTypeConfig = {
  [AuthorityType.ORGANIZATION]: {
    label: "Organization",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [AuthorityType.SYSTEM]: {
    label: "System",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  [AuthorityType.HUMAN]: {
    label: "Human",
    className: "bg-green-100 text-green-800 border-green-200",
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function GenesisRecordCard({ genesis }: GenesisRecordCardProps) {
  const authorityConfig = authorityTypeConfig[genesis.authority_type];

  // Truncate signature for display
  const truncatedSignature =
    genesis.signature.length > 16
      ? `${genesis.signature.slice(0, 8)}...${genesis.signature.slice(-8)}`
      : genesis.signature;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg">Genesis Record</CardTitle>
          <p className="text-sm text-muted-foreground">
            Trust origin and authority
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authority */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Authority
          </label>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-mono">{genesis.authority_id}</p>
            <Badge className={authorityConfig.className}>
              {authorityConfig.label}
            </Badge>
          </div>
        </div>

        {/* Agent ID */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Agent ID
          </label>
          <p className="text-sm font-mono mt-1">{genesis.agent_id}</p>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Created
            </label>
            <p className="text-sm mt-1">
              {format(new Date(genesis.created_at), "PPp")}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Expires
            </label>
            <p className="text-sm mt-1">
              {genesis.expires_at
                ? format(new Date(genesis.expires_at), "PPp")
                : "Never"}
            </p>
          </div>
        </div>

        {/* Signature */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Signature ({genesis.signature_algorithm})
          </label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
              {truncatedSignature}
            </code>
            <CopyButton text={genesis.signature} />
          </div>
        </div>

        {/* Metadata */}
        {Object.keys(genesis.metadata || {}).length > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Metadata
            </label>
            <div className="mt-1 bg-muted rounded-lg p-3">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(genesis.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
