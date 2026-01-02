/**
 * CapabilityCard Component
 *
 * Displays a single capability attestation
 */

import { format } from "date-fns";
import { Key, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CapabilityType, type CapabilityAttestation } from "../../types";

interface CapabilityCardProps {
  capability: CapabilityAttestation;
}

const capabilityTypeConfig = {
  [CapabilityType.ACCESS]: {
    label: "Access",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Key,
  },
  [CapabilityType.ACTION]: {
    label: "Action",
    className: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Lock,
  },
  [CapabilityType.DELEGATION]: {
    label: "Delegation",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: Key,
  },
};

export function CapabilityCard({ capability }: CapabilityCardProps) {
  const typeConfig = capabilityTypeConfig[capability.capability_type];
  const Icon = typeConfig.icon;

  const isExpired = capability.expires_at
    ? new Date(capability.expires_at) < new Date()
    : false;

  return (
    <Card className={isExpired ? "opacity-60" : ""}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">
            {capability.capability}
          </CardTitle>
          <Badge className={typeConfig.className}>{typeConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Constraints */}
        {capability.constraints.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Constraints
            </label>
            <div className="flex flex-wrap gap-1 mt-1">
              {capability.constraints.map((constraint, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {constraint}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Scope */}
        {capability.scope && Object.keys(capability.scope).length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Scope
            </label>
            <div className="mt-1 bg-muted rounded p-2">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(capability.scope, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Attestation Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-muted-foreground">Attester</label>
            <p className="font-mono truncate">{capability.attester_id}</p>
          </div>
          <div>
            <label className="text-muted-foreground">Attested</label>
            <p>{format(new Date(capability.attested_at), "PP")}</p>
          </div>
        </div>

        {capability.expires_at && (
          <div className="text-xs">
            <label className="text-muted-foreground">Expires</label>
            <p className={isExpired ? "text-red-600 font-medium" : ""}>
              {format(new Date(capability.expires_at), "PP")}
              {isExpired && " (Expired)"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
