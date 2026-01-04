/**
 * ValueChainsPage
 *
 * Level 3 (Value Chain Owner) page displaying enterprise-wide value chains.
 * Shows value chain cards with department flows, trust health, and enterprise overview.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ValueChainCard,
  EnterpriseOverview,
  useValueChains,
  useEnterpriseMetrics,
} from '@/features/value-chains';
import type { ValueChainsFilter, TrustStatus, ValueChain } from '@/features/value-chains';

/**
 * Empty state component
 */
function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  const navigate = useNavigate();

  if (hasFilter) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No matching value chains</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No value chains yet</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Create your first enterprise value chain to get started
      </p>
      <Button className="mt-4" onClick={() => navigate('/work/value-chains/new')}>
        <Plus className="h-4 w-4 mr-2" />
        New Value Chain
      </Button>
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 rounded-lg" />
      ))}
    </div>
  );
}

/**
 * ValueChainsPage Component
 */
export function ValueChainsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ValueChainsFilter>({
    status: 'all',
    trustStatus: 'all',
    searchQuery: '',
  });

  // Fetch data
  const {
    data: valueChainsResponse,
    isLoading: isLoadingValueChains,
    refetch: refetchValueChains,
  } = useValueChains(filter);

  const {
    data: metricsResponse,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useEnterpriseMetrics();

  const valueChains = valueChainsResponse?.valueChains ?? [];
  const metrics = metricsResponse?.metrics;

  const isLoading = isLoadingValueChains || isLoadingMetrics;
  const hasFilter = Boolean(
    filter.searchQuery ||
    (filter.status && filter.status !== 'all') ||
    (filter.trustStatus && filter.trustStatus !== 'all')
  );

  // Handlers
  const handleRefresh = () => {
    refetchValueChains();
    refetchMetrics();
  };

  const handleSearchChange = (value: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: value }));
  };

  const handleStatusChange = (value: string) => {
    setFilter((prev) => ({
      ...prev,
      status: value as ValueChainsFilter['status'],
    }));
  };

  const handleTrustStatusChange = (value: string) => {
    setFilter((prev) => ({
      ...prev,
      trustStatus: value as TrustStatus | 'all',
    }));
  };

  const handleViewChain = (id: string) => {
    navigate(`/work/value-chains/${id}`);
  };

  const handleTrustMap = (id: string) => {
    navigate(`/work/value-chains/${id}/trust-map`);
  };

  const handleCompliance = (id: string) => {
    navigate(`/govern/compliance?valueChainId=${id}`);
  };

  const handleAudit = (id: string) => {
    navigate(`/govern/activity?valueChainId=${id}`);
  };

  const handleActiveTrustClick = () => {
    setFilter((prev) => ({ ...prev, trustStatus: 'valid' }));
  };

  const handleExpiringClick = () => {
    setFilter((prev) => ({ ...prev, trustStatus: 'expiring' }));
  };

  const handleIssuesClick = () => {
    navigate('/govern/compliance?filter=issues');
  };

  return (
    <div className="space-y-6 p-6" data-testid="value-chains-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Value Chains</h1>
          <p className="text-sm text-muted-foreground">
            Enterprise-wide processes spanning departments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/work/value-chains/new')}>
            <Plus className="h-4 w-4 mr-1" />
            New Value Chain
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search value chains..."
            value={filter.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter.trustStatus || 'all'} onValueChange={handleTrustStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trust Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trust</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Enterprise Overview */}
          {metrics && (
            <EnterpriseOverview
              metrics={metrics}
              onActiveTrustClick={handleActiveTrustClick}
              onExpiringClick={handleExpiringClick}
              onIssuesClick={handleIssuesClick}
            />
          )}

          {/* Value Chains List */}
          {valueChains.length === 0 ? (
            <EmptyState hasFilter={hasFilter} />
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {valueChains.length} Value Chain{valueChains.length !== 1 ? 's' : ''}
              </h3>
              <div className="grid gap-4">
                {valueChains.map((valueChain: ValueChain) => (
                  <ValueChainCard
                    key={valueChain.id}
                    valueChain={valueChain}
                    onViewChain={() => handleViewChain(valueChain.id)}
                    onTrustMap={() => handleTrustMap(valueChain.id)}
                    onCompliance={() => handleCompliance(valueChain.id)}
                    onAudit={() => handleAudit(valueChain.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ValueChainsPage;
