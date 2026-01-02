/**
 * TrustChainViewer Component
 *
 * Displays complete trust chain with tabs for different views
 */

import { Shield, Key, Users, Lock, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type TrustChain,
  type AuditAnchor,
  type Constraint,
} from "../../types";
import { GenesisRecordCard } from "./GenesisRecordCard";
import { CapabilityCard } from "./CapabilityCard";
import { DelegationCard } from "./DelegationCard";

interface TrustChainViewerProps {
  trustChain: TrustChain;
}

function ConstraintsTab({ constraints }: { constraints: Constraint[] }) {
  if (constraints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Lock className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No active constraints</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {constraints.map((constraint) => (
        <Card key={constraint.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <Badge variant="outline" className="mb-2">
                  {constraint.constraint_type}
                </Badge>
                <p className="text-sm font-medium">
                  Priority: {constraint.priority}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Value</label>
                <div className="mt-1 bg-muted rounded p-2">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(constraint.value, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="text-xs">
                <label className="text-muted-foreground">Source</label>
                <p className="font-mono">{constraint.source}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AuditTab({ audits }: { audits: AuditAnchor[] }) {
  if (audits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No audit records yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {audits.map((audit) => (
        <Card key={audit.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{audit.action}</p>
                  {audit.resource && (
                    <p className="text-xs text-muted-foreground truncate">
                      Resource: {audit.resource}
                    </p>
                  )}
                </div>
                <Badge
                  className={
                    audit.result === "success"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : audit.result === "denied"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }
                >
                  {audit.result}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-muted-foreground">Timestamp</label>
                  <p>{new Date(audit.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Chain Hash</label>
                  <p className="font-mono truncate">
                    {audit.trust_chain_hash.slice(0, 12)}...
                  </p>
                </div>
              </div>
              {Object.keys(audit.context || {}).length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">
                    Context
                  </label>
                  <div className="mt-1 bg-muted rounded p-2">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(audit.context, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TrustChainViewer({ trustChain }: TrustChainViewerProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Trust Chain</h2>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-sm text-muted-foreground">Chain Hash:</p>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {trustChain.chain_hash}
          </code>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="genesis" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="genesis" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Genesis</span>
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Capabilities</span>
            <Badge variant="outline" className="ml-1">
              {trustChain.capabilities.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="delegations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Delegations</span>
            <Badge variant="outline" className="ml-1">
              {trustChain.delegations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="constraints" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Constraints</span>
            <Badge variant="outline" className="ml-1">
              {trustChain.constraint_envelope?.active_constraints.length ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
            <Badge variant="outline" className="ml-1">
              {trustChain.audit_anchors.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="genesis" className="mt-6">
          <GenesisRecordCard genesis={trustChain.genesis} />
        </TabsContent>

        <TabsContent value="capabilities" className="mt-6">
          {trustChain.capabilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No capabilities attested
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {trustChain.capabilities.map((capability) => (
                <CapabilityCard key={capability.id} capability={capability} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="delegations" className="mt-6">
          {trustChain.delegations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No delegations created
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {trustChain.delegations.map((delegation) => (
                <DelegationCard key={delegation.id} delegation={delegation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="constraints" className="mt-6">
          <ConstraintsTab
            constraints={
              trustChain.constraint_envelope?.active_constraints ?? []
            }
          />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditTab audits={trustChain.audit_anchors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
