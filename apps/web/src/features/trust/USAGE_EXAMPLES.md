# Trust Dashboard Usage Examples

## Table of Contents

1. [Basic Dashboard Page](#basic-dashboard-page)
2. [Trust Chain Detail Page](#trust-chain-detail-page)
3. [Status Badge Usage](#status-badge-usage)
4. [Custom Dashboard Layout](#custom-dashboard-layout)
5. [Integration with Navigation](#integration-with-navigation)

## Basic Dashboard Page

Simple dashboard page with navigation callbacks:

```typescript
import { TrustDashboard } from '@/features/trust';
import { useNavigate } from 'react-router-dom';

export function TrustDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6">
      <TrustDashboard
        onEstablishTrust={() => navigate('/trust/establish')}
        onViewAuditTrail={() => navigate('/trust/audit')}
        onAuditEventClick={(event) => navigate(`/trust/audit/${event.id}`)}
      />
    </div>
  );
}
```

## Trust Chain Detail Page

Display a specific trust chain with the viewer:

```typescript
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrustChainViewer, useTrustChain } from '@/features/trust';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function TrustChainDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { data: chain, isPending, error } = useTrustChain(agentId || '');

  if (isPending) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !chain) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Trust Chain</h2>
          <p className="text-muted-foreground mt-2">
            {error?.message || 'Trust chain not found'}
          </p>
          <Button onClick={() => navigate('/trust')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => navigate('/trust')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <TrustChainViewer trustChain={chain} />
    </div>
  );
}
```

## Status Badge Usage

Using the TrustStatusBadge component in lists and cards:

```typescript
import { TrustStatusBadge, useTrustChains, TrustStatus } from '@/features/trust';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TrustChainsList() {
  const { data, isPending } = useTrustChains();

  if (isPending) return <div>Loading...</div>;

  return (
    <div className="grid gap-4">
      {data?.items.map((chain) => {
        // Determine status
        const now = new Date();
        const isExpired = chain.genesis.expires_at
          ? new Date(chain.genesis.expires_at) < now
          : false;
        const status = isExpired ? TrustStatus.EXPIRED : TrustStatus.VALID;

        return (
          <Card key={chain.genesis.agent_id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {chain.genesis.agent_id}
              </CardTitle>
              <TrustStatusBadge status={status} size="md" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Capabilities</p>
                  <p className="font-medium">{chain.capabilities.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delegations</p>
                  <p className="font-medium">{chain.delegations.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Audit Events</p>
                  <p className="font-medium">{chain.audit_anchors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

## Custom Dashboard Layout

Customizing the dashboard with additional panels:

```typescript
import { useState } from 'react';
import { TrustDashboard, TrustChainViewer, useTrustChain } from '@/features/trust';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export function CustomTrustDashboard() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { data: selectedChain } = useTrustChain(selectedAgentId || '');

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      {/* Main Dashboard */}
      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="p-6 h-full overflow-auto">
          <TrustDashboard
            onEstablishTrust={() => console.log('Establish trust')}
            onViewAuditTrail={() => console.log('View audit trail')}
            onAuditEventClick={(event) => setSelectedAgentId(event.agent_id)}
          />
        </div>
      </ResizablePanel>

      {/* Detail Panel */}
      {selectedChain && (
        <>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="p-6 h-full overflow-auto">
              <TrustChainViewer trustChain={selectedChain} />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
```

## Integration with Navigation

Complete routing setup with trust pages:

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TrustDashboardPage } from '@/pages/trust/TrustDashboardPage';
import { TrustChainDetailPage } from '@/pages/trust/TrustChainDetailPage';
import { EstablishTrustPage } from '@/pages/trust/EstablishTrustPage';
import { AuditTrailPage } from '@/pages/trust/AuditTrailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/trust" element={<TrustDashboardPage />} />
        <Route path="/trust/chain/:agentId" element={<TrustChainDetailPage />} />
        <Route path="/trust/establish" element={<EstablishTrustPage />} />
        <Route path="/trust/audit" element={<AuditTrailPage />} />
        <Route path="/trust/audit/:eventId" element={<AuditEventDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Establish Trust Dialog

Modal dialog for establishing new trust:

```typescript
import { useState } from 'react';
import { useEstablishTrust } from '@/features/trust';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';

export function EstablishTrustDialog() {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [authorityId, setAuthorityId] = useState('');

  const { mutate: establishTrust, isPending } = useEstablishTrust();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    establishTrust(
      {
        agent_id: agentId,
        authority_id: authorityId,
        capabilities: [
          {
            capability: 'read:data',
            capability_type: 'access',
          },
        ],
      },
      {
        onSuccess: () => {
          setOpen(false);
          setAgentId('');
          setAuthorityId('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          Establish Trust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Establish Trust</DialogTitle>
          <DialogDescription>
            Create a new trust chain for an agent
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="agentId">Agent ID</Label>
            <Input
              id="agentId"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="agent-123"
              required
            />
          </div>
          <div>
            <Label htmlFor="authorityId">Authority ID</Label>
            <Input
              id="authorityId"
              value={authorityId}
              onChange={(e) => setAuthorityId(e.target.value)}
              placeholder="org-authority-1"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Establishing...' : 'Establish Trust'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Verify Trust Action

Component to verify trust for an action:

```typescript
import { useState } from 'react';
import { useVerifyTrust, VerificationLevel } from '@/features/trust';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

export function VerifyTrustForm() {
  const [agentId, setAgentId] = useState('');
  const [action, setAction] = useState('');
  const [level, setLevel] = useState<VerificationLevel>(VerificationLevel.STANDARD);

  const { mutate: verifyTrust, isPending, data: result } = useVerifyTrust();

  const handleVerify = () => {
    verifyTrust({
      agent_id: agentId,
      action,
      level,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="agentId">Agent ID</Label>
        <Input
          id="agentId"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          placeholder="agent-123"
        />
      </div>

      <div>
        <Label htmlFor="action">Action</Label>
        <Input
          id="action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="read:data"
        />
      </div>

      <div>
        <Label htmlFor="level">Verification Level</Label>
        <Select value={level} onValueChange={(v) => setLevel(v as VerificationLevel)}>
          <SelectTrigger id="level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quick">Quick (~1ms)</SelectItem>
            <SelectItem value="standard">Standard (~5ms)</SelectItem>
            <SelectItem value="full">Full (~50ms)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleVerify} disabled={isPending}>
        {isPending ? 'Verifying...' : 'Verify Trust'}
      </Button>

      {result && (
        <Alert variant={result.valid ? 'default' : 'destructive'}>
          <div className="flex items-center gap-2">
            {result.valid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.valid
                ? `Trust verified! Capability: ${result.capability_used}`
                : `Verification failed: ${result.reason}`}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
}
```

## Real-time Dashboard Updates

Using React Query's refetch interval for live updates:

```typescript
import { TrustDashboard } from '@/features/trust';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function LiveTrustDashboard() {
  const queryClient = useQueryClient();

  // Refetch dashboard stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['trustDashboardStats'] });
    }, 30000);

    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div className="container mx-auto py-6">
      <TrustDashboard
        onEstablishTrust={() => console.log('Establish trust')}
        onViewAuditTrail={() => console.log('View audit trail')}
        onAuditEventClick={(event) => console.log('Event clicked:', event)}
      />
    </div>
  );
}
```

## Error Boundary Integration

Wrapping trust components with error boundary:

```typescript
import { ErrorBoundary } from 'react-error-boundary';
import { TrustDashboard } from '@/features/trust';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Trust Dashboard Error</AlertTitle>
      <AlertDescription>
        {error.message}
        <Button
          onClick={resetErrorBoundary}
          variant="outline"
          size="sm"
          className="mt-2"
        >
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function SafeTrustDashboard() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <TrustDashboard />
    </ErrorBoundary>
  );
}
```

## Tips and Best Practices

### Performance

1. **Use React Query caching**: All hooks use React Query for automatic caching
2. **Lazy load components**: Use `React.lazy()` for code splitting
3. **Memoize callbacks**: React compiler handles this automatically in React 19
4. **Virtual scrolling**: For large audit lists (>100 items), consider react-window

### Accessibility

1. **ARIA labels**: Add descriptive labels to all interactive elements
2. **Keyboard navigation**: Ensure all actions are keyboard accessible
3. **Screen readers**: Use semantic HTML and ARIA attributes
4. **Focus management**: Handle focus state properly in dialogs

### Error Handling

1. **Use error boundaries**: Wrap components in error boundaries
2. **Show user-friendly messages**: Convert technical errors to readable text
3. **Provide recovery actions**: Always offer a way to retry or go back
4. **Log errors**: Send errors to monitoring service (e.g., Sentry)

### State Management

1. **Use React Query for server state**: Don't duplicate in Zustand
2. **Keep UI state local**: Only lift state when necessary
3. **Use URL state for filters**: Preserve user preferences in URL params
4. **Invalidate queries properly**: Refresh data after mutations

---

For more examples, see the [Trust Dashboard Implementation Summary](./TRUST_DASHBOARD_IMPLEMENTATION.md).
