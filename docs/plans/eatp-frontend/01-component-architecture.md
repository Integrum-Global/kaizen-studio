# EATP Frontend: Component Architecture

## Document Control
- **Version**: 1.0
- **Date**: 2025-12-15
- **Status**: Planning
- **Author**: Kaizen Studio Team

---

## Overview

This document defines the React component architecture for EATP frontend features. All components follow the existing Kaizen Studio patterns using Shadcn/ui, Zustand, and React Query.

---

## Feature Structure

```
src/features/trust/
├── api/
│   ├── index.ts
│   ├── trust.ts           # Trust chain CRUD
│   ├── delegations.ts     # Delegation operations
│   ├── audit.ts           # Audit trail queries
│   └── authorities.ts     # Authority management
├── components/
│   ├── index.ts
│   ├── TrustDashboard/
│   │   ├── TrustDashboard.tsx
│   │   ├── TrustStats.tsx
│   │   └── RecentAuditEvents.tsx
│   ├── TrustChain/
│   │   ├── TrustChainViewer.tsx
│   │   ├── TrustChainGraph.tsx
│   │   ├── GenesisRecordCard.tsx
│   │   ├── CapabilityCard.tsx
│   │   └── DelegationCard.tsx
│   ├── TrustManagement/
│   │   ├── EstablishTrustForm.tsx
│   │   ├── DelegationWizard.tsx
│   │   ├── CapabilityEditor.tsx
│   │   ├── ConstraintEditor.tsx
│   │   └── RevokeTrustDialog.tsx
│   ├── AuditTrail/
│   │   ├── AuditTrailViewer.tsx
│   │   ├── AuditEventCard.tsx
│   │   ├── AuditFilters.tsx
│   │   └── AuditExport.tsx
│   ├── TrustStatus/
│   │   ├── TrustStatusBadge.tsx
│   │   ├── TrustVerificationResult.tsx
│   │   └── TrustExpirationWarning.tsx
│   └── common/
│       ├── CapabilityTag.tsx
│       ├── ConstraintTag.tsx
│       ├── AgentAvatar.tsx
│       └── TrustIcon.tsx
├── hooks/
│   ├── useTrustChain.ts
│   ├── useDelegations.ts
│   ├── useAuditTrail.ts
│   └── useTrustVerification.ts
├── store/
│   └── trust.ts           # Zustand store for trust state
├── types/
│   └── index.ts           # Trust-related types
└── utils/
    ├── formatters.ts      # Trust data formatters
    └── validators.ts      # Trust validation utilities
```

---

## Core Components

### 1. TrustDashboard

**Purpose**: Central hub for trust monitoring and management.

```tsx
// src/features/trust/components/TrustDashboard/TrustDashboard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrustStats } from './TrustStats';
import { RecentAuditEvents } from './RecentAuditEvents';
import { TrustChainGraph } from '../TrustChain/TrustChainGraph';
import { useTrustStats } from '../../hooks/useTrustStats';
import { useRecentAuditEvents } from '../../hooks/useAuditTrail';

export function TrustDashboard() {
  const { stats, isLoading: statsLoading } = useTrustStats();
  const { events, isLoading: eventsLoading } = useRecentAuditEvents({ limit: 10 });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <TrustStats
          title="Trusted Agents"
          value={stats?.trustedAgents ?? 0}
          trend={stats?.agentTrend}
          loading={statsLoading}
        />
        <TrustStats
          title="Active Delegations"
          value={stats?.activeDelegations ?? 0}
          trend={stats?.delegationTrend}
          loading={statsLoading}
        />
        <TrustStats
          title="Audit Events Today"
          value={stats?.auditEventsToday ?? 0}
          loading={statsLoading}
        />
      </div>

      {/* Trust Chain Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Trust Chain Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <TrustChainGraph />
        </CardContent>
      </Card>

      {/* Recent Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentAuditEvents events={events} loading={eventsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. TrustChainViewer

**Purpose**: Display complete trust chain for an agent.

```tsx
// src/features/trust/components/TrustChain/TrustChainViewer.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenesisRecordCard } from './GenesisRecordCard';
import { CapabilityCard } from './CapabilityCard';
import { DelegationCard } from './DelegationCard';
import { TrustStatusBadge } from '../TrustStatus/TrustStatusBadge';
import { useTrustChain } from '../../hooks/useTrustChain';
import type { TrustChain } from '../../types';

interface TrustChainViewerProps {
  agentId: string;
}

export function TrustChainViewer({ agentId }: TrustChainViewerProps) {
  const { chain, isLoading, error } = useTrustChain(agentId);

  if (isLoading) return <TrustChainSkeleton />;
  if (error) return <TrustChainError error={error} />;
  if (!chain) return <NoTrustChain agentId={agentId} />;

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trust Chain</h2>
        <TrustStatusBadge status={chain.status} />
      </div>

      {/* Chain Details */}
      <Tabs defaultValue="genesis">
        <TabsList>
          <TabsTrigger value="genesis">Genesis</TabsTrigger>
          <TabsTrigger value="capabilities">
            Capabilities ({chain.capabilities.length})
          </TabsTrigger>
          <TabsTrigger value="delegations">
            Delegations ({chain.delegations.length})
          </TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
        </TabsList>

        <TabsContent value="genesis">
          <GenesisRecordCard genesis={chain.genesis} />
        </TabsContent>

        <TabsContent value="capabilities">
          <div className="space-y-2">
            {chain.capabilities.map((cap) => (
              <CapabilityCard key={cap.id} capability={cap} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="delegations">
          <div className="space-y-2">
            {chain.delegations.map((del) => (
              <DelegationCard key={del.id} delegation={del} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="constraints">
          <ConstraintEnvelopeCard envelope={chain.constraintEnvelope} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3. EstablishTrustForm

**Purpose**: Form for establishing initial trust for an agent.

```tsx
// src/features/trust/components/TrustManagement/EstablishTrustForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CapabilityEditor } from './CapabilityEditor';
import { ConstraintEditor } from './ConstraintEditor';
import { useEstablishTrust } from '../../hooks/useTrustOperations';
import { useAuthorities } from '../../hooks/useAuthorities';

const establishTrustSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  authorityId: z.string().min(1, 'Authority is required'),
  capabilities: z.array(z.object({
    capability: z.string(),
    capabilityType: z.enum(['ACCESS', 'ACTION', 'DELEGATION']),
    constraints: z.array(z.string()),
    scope: z.record(z.any()).optional(),
  })).min(1, 'At least one capability is required'),
  constraints: z.array(z.string()),
  expiresAt: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

type EstablishTrustFormValues = z.infer<typeof establishTrustSchema>;

interface EstablishTrustFormProps {
  agentId?: string;
  onSuccess?: () => void;
}

export function EstablishTrustForm({ agentId, onSuccess }: EstablishTrustFormProps) {
  const { authorities } = useAuthorities();
  const { establishTrust, isLoading } = useEstablishTrust();

  const form = useForm<EstablishTrustFormValues>({
    resolver: zodResolver(establishTrustSchema),
    defaultValues: {
      agentId: agentId || '',
      authorityId: '',
      capabilities: [],
      constraints: [],
      metadata: {},
    },
  });

  async function onSubmit(values: EstablishTrustFormValues) {
    await establishTrust(values);
    onSuccess?.();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Agent ID */}
        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="agent-name-001" disabled={!!agentId} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Authority */}
        <FormField
          control={form.control}
          name="authorityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authorities?.map((auth) => (
                    <SelectItem key={auth.id} value={auth.id}>
                      {auth.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Capabilities */}
        <FormField
          control={form.control}
          name="capabilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capabilities</FormLabel>
              <FormControl>
                <CapabilityEditor
                  capabilities={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Global Constraints */}
        <FormField
          control={form.control}
          name="constraints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Global Constraints</FormLabel>
              <FormControl>
                <ConstraintEditor
                  constraints={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expiration */}
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expires At (Optional)</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Establishing Trust...' : 'Establish Trust'}
        </Button>
      </form>
    </Form>
  );
}
```

### 4. DelegationWizard

**Purpose**: Multi-step wizard for creating delegations.

```tsx
// src/features/trust/components/TrustManagement/DelegationWizard.tsx

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SelectDelegator } from './wizard/SelectDelegator';
import { SelectDelegatee } from './wizard/SelectDelegatee';
import { SelectCapabilities } from './wizard/SelectCapabilities';
import { ConfigureConstraints } from './wizard/ConfigureConstraints';
import { ReviewDelegation } from './wizard/ReviewDelegation';
import { useCreateDelegation } from '../../hooks/useDelegations';
import type { DelegationFormData } from '../../types';

interface DelegationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedDelegator?: string;
  preselectedDelegatee?: string;
}

const STEPS = [
  { id: 'delegator', title: 'Select Delegator' },
  { id: 'delegatee', title: 'Select Delegatee' },
  { id: 'capabilities', title: 'Choose Capabilities' },
  { id: 'constraints', title: 'Configure Constraints' },
  { id: 'review', title: 'Review & Create' },
];

export function DelegationWizard({
  open,
  onOpenChange,
  preselectedDelegator,
  preselectedDelegatee,
}: DelegationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<DelegationFormData>>({
    delegatorId: preselectedDelegator,
    delegateeId: preselectedDelegatee,
    capabilities: [],
    constraints: [],
  });

  const { createDelegation, isLoading } = useCreateDelegation();

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function updateFormData(data: Partial<DelegationFormData>) {
    setFormData((prev) => ({ ...prev, ...data }));
  }

  function handleNext() {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleCreate() {
    await createDelegation(formData as DelegationFormData);
    onOpenChange(false);
  }

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <SelectDelegator
            selected={formData.delegatorId}
            onSelect={(id) => updateFormData({ delegatorId: id })}
          />
        );
      case 1:
        return (
          <SelectDelegatee
            selected={formData.delegateeId}
            delegatorId={formData.delegatorId!}
            onSelect={(id) => updateFormData({ delegateeId: id })}
          />
        );
      case 2:
        return (
          <SelectCapabilities
            delegatorId={formData.delegatorId!}
            selected={formData.capabilities!}
            onSelect={(caps) => updateFormData({ capabilities: caps })}
          />
        );
      case 3:
        return (
          <ConfigureConstraints
            inheritedConstraints={[]} // Get from delegator
            selected={formData.constraints!}
            onChange={(cons) => updateFormData({ constraints: cons })}
          />
        );
      case 4:
        return <ReviewDelegation data={formData as DelegationFormData} />;
      default:
        return null;
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!formData.delegatorId;
      case 1: return !!formData.delegateeId;
      case 2: return formData.capabilities!.length > 0;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{STEPS[currentStep].title}</DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="mb-4" />

        <div className="min-h-[300px]">{renderStep()}</div>

        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Delegation'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 5. AuditTrailViewer

**Purpose**: Searchable, filterable audit log viewer.

```tsx
// src/features/trust/components/AuditTrail/AuditTrailViewer.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuditFilters } from './AuditFilters';
import { AuditEventCard } from './AuditEventCard';
import { AuditExport } from './AuditExport';
import { useAuditTrail } from '../../hooks/useAuditTrail';
import { useDebounce } from '@/hooks/useDebounce';
import type { AuditFilters as AuditFiltersType } from '../../types';

export function AuditTrailViewer() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AuditFiltersType>({});

  const debouncedSearch = useDebounce(search, 300);

  const {
    events,
    isLoading,
    hasMore,
    loadMore,
    total
  } = useAuditTrail({
    search: debouncedSearch,
    ...filters,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Audit Trail</CardTitle>
        <AuditExport filters={filters} />
      </CardHeader>

      <CardContent>
        {/* Search & Filters */}
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search audit events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <AuditFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {events.length} of {total} events
        </p>

        {/* Event List */}
        <div className="space-y-2">
          {isLoading ? (
            <AuditEventsSkeleton />
          ) : events.length === 0 ? (
            <NoAuditEvents />
          ) : (
            events.map((event) => (
              <AuditEventCard key={event.id} event={event} />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={loadMore}
          >
            Load More
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## State Management

### Trust Store (Zustand)

```tsx
// src/features/trust/store/trust.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TrustChain, Delegation, AuditEvent } from '../types';

interface TrustState {
  // Selected items
  selectedAgentId: string | null;
  selectedDelegationId: string | null;

  // UI state
  isEstablishModalOpen: boolean;
  isDelegationWizardOpen: boolean;
  isAuditDetailOpen: boolean;

  // Cached data (for optimistic updates)
  trustChains: Record<string, TrustChain>;
  recentDelegations: Delegation[];

  // Actions
  setSelectedAgent: (agentId: string | null) => void;
  setSelectedDelegation: (delegationId: string | null) => void;
  openEstablishModal: () => void;
  closeEstablishModal: () => void;
  openDelegationWizard: () => void;
  closeDelegationWizard: () => void;
  updateTrustChain: (agentId: string, chain: TrustChain) => void;
  addDelegation: (delegation: Delegation) => void;
}

export const useTrustStore = create<TrustState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedAgentId: null,
      selectedDelegationId: null,
      isEstablishModalOpen: false,
      isDelegationWizardOpen: false,
      isAuditDetailOpen: false,
      trustChains: {},
      recentDelegations: [],

      // Actions
      setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
      setSelectedDelegation: (delegationId) => set({ selectedDelegationId: delegationId }),
      openEstablishModal: () => set({ isEstablishModalOpen: true }),
      closeEstablishModal: () => set({ isEstablishModalOpen: false }),
      openDelegationWizard: () => set({ isDelegationWizardOpen: true }),
      closeDelegationWizard: () => set({ isDelegationWizardOpen: false }),

      updateTrustChain: (agentId, chain) =>
        set((state) => ({
          trustChains: { ...state.trustChains, [agentId]: chain }
        })),

      addDelegation: (delegation) =>
        set((state) => ({
          recentDelegations: [delegation, ...state.recentDelegations.slice(0, 9)]
        })),
    }),
    { name: 'trust-store' }
  )
);
```

---

## API Integration

### Trust API Client

```tsx
// src/features/trust/api/trust.ts

import apiClient from '@/api';
import type { TrustChain, EstablishTrustInput, VerificationResult } from '../types';

export const trustApi = {
  /**
   * Get trust chain for an agent
   */
  getTrustChain: async (agentId: string): Promise<TrustChain | null> => {
    const response = await apiClient.get<{ data: TrustChain | null }>(
      `/api/v1/trust/chains/${agentId}`
    );
    return response.data.data;
  },

  /**
   * Establish trust for an agent
   */
  establish: async (input: EstablishTrustInput): Promise<TrustChain> => {
    const response = await apiClient.post<{ data: TrustChain }>(
      '/api/v1/trust/establish',
      input
    );
    return response.data.data;
  },

  /**
   * Verify agent trust for an action
   */
  verify: async (
    agentId: string,
    action: string,
    resource?: string,
    level?: 'QUICK' | 'STANDARD' | 'FULL'
  ): Promise<VerificationResult> => {
    const response = await apiClient.post<{ data: VerificationResult }>(
      '/api/v1/trust/verify',
      { agentId, action, resource, level }
    );
    return response.data.data;
  },

  /**
   * Revoke trust for an agent
   */
  revoke: async (agentId: string, reason: string): Promise<void> => {
    await apiClient.delete(`/api/v1/trust/chains/${agentId}`, {
      data: { reason }
    });
  },
};
```

---

## Custom Hooks

### useTrustChain

```tsx
// src/features/trust/hooks/useTrustChain.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trustApi } from '../api/trust';
import { useTrustStore } from '../store/trust';

export function useTrustChain(agentId: string) {
  const queryClient = useQueryClient();
  const updateTrustChain = useTrustStore((state) => state.updateTrustChain);

  const query = useQuery({
    queryKey: ['trust-chain', agentId],
    queryFn: () => trustApi.getTrustChain(agentId),
    staleTime: 30000, // 30 seconds
    onSuccess: (data) => {
      if (data) {
        updateTrustChain(agentId, data);
      }
    },
  });

  return {
    chain: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useEstablishTrust() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: trustApi.establish,
    onSuccess: (data, variables) => {
      // Invalidate trust chain query
      queryClient.invalidateQueries(['trust-chain', variables.agentId]);
      // Invalidate trust stats
      queryClient.invalidateQueries(['trust-stats']);
    },
  });

  return {
    establishTrust: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    error: mutation.error,
  };
}
```

---

## Types

```tsx
// src/features/trust/types/index.ts

export type AuthorityType = 'ORGANIZATION' | 'SYSTEM' | 'HUMAN';
export type CapabilityType = 'ACCESS' | 'ACTION' | 'DELEGATION';
export type ActionResult = 'SUCCESS' | 'FAILURE' | 'DENIED' | 'PARTIAL';
export type TrustStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'PENDING';

export interface GenesisRecord {
  id: string;
  agentId: string;
  authorityId: string;
  authorityType: AuthorityType;
  createdAt: string;
  expiresAt: string | null;
  signatureHash: string;
  signatureAlgorithm: string;
  metadata: Record<string, unknown>;
}

export interface CapabilityAttestation {
  id: string;
  capability: string;
  capabilityType: CapabilityType;
  constraints: string[];
  attesterId: string;
  attestedAt: string;
  expiresAt: string | null;
  scope: Record<string, unknown>;
}

export interface DelegationRecord {
  id: string;
  delegatorId: string;
  delegateeId: string;
  taskId: string;
  capabilitiesDelegated: string[];
  constraintSubset: string[];
  delegatedAt: string;
  expiresAt: string | null;
  parentDelegationId: string | null;
}

export interface ConstraintEnvelope {
  id: string;
  agentId: string;
  activeConstraints: Constraint[];
  computedAt: string;
  validUntil: string;
  constraintHash: string;
}

export interface Constraint {
  id: string;
  constraintType: string;
  value: unknown;
  source: string;
  priority: number;
}

export interface AuditAnchor {
  id: string;
  agentId: string;
  action: string;
  resource: string | null;
  timestamp: string;
  trustChainHash: string;
  result: ActionResult;
  parentAnchorId: string | null;
}

export interface TrustChain {
  genesis: GenesisRecord;
  capabilities: CapabilityAttestation[];
  delegations: DelegationRecord[];
  constraintEnvelope: ConstraintEnvelope;
  auditAnchors: AuditAnchor[];
  status: TrustStatus;
}

export interface EstablishTrustInput {
  agentId: string;
  authorityId: string;
  capabilities: {
    capability: string;
    capabilityType: CapabilityType;
    constraints: string[];
    scope?: Record<string, unknown>;
  }[];
  constraints: string[];
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export interface DelegationFormData {
  delegatorId: string;
  delegateeId: string;
  taskId: string;
  capabilities: string[];
  constraints: string[];
  expiresAt?: string;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  capabilityUsed?: string;
  effectiveConstraints: string[];
  violations?: { constraintId: string; reason: string }[];
}

export interface AuditFilters {
  agentId?: string;
  action?: string;
  result?: ActionResult;
  startTime?: string;
  endTime?: string;
}
```

---

## Next Steps

1. **Document 02**: Trust Visualization Components
2. **Document 03**: Management Interfaces
3. Create component storybook stories
4. Implement base components
