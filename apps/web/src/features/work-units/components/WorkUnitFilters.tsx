/**
 * WorkUnitFilters Component
 *
 * Provides search and filtering controls for work units.
 * Includes search input, type filter, trust status filter, and workspace filter.
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WorkUnitFilters as FilterState, WorkspaceRef } from '../types';

export interface WorkUnitFiltersProps {
  /**
   * Current filter values
   */
  filters: FilterState;

  /**
   * Handler for filter changes
   */
  onFiltersChange: (filters: FilterState) => void;

  /**
   * Available workspaces for filtering
   */
  workspaces?: WorkspaceRef[];

  /**
   * Whether to show the workspace filter
   */
  showWorkspaceFilter?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * WorkUnitFilters provides search and filter controls.
 *
 * Layout:
 * - Search input (full width on mobile, partial on desktop)
 * - Type tabs (All | Atomic | Composite)
 * - Trust status dropdown
 * - Workspace dropdown (optional)
 */
export function WorkUnitFilters({
  filters,
  onFiltersChange,
  workspaces = [],
  showWorkspaceFilter = true,
  className,
}: WorkUnitFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      type: value === 'all' ? undefined : (value as 'atomic' | 'composite'),
    });
  };

  const handleTrustStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      trustStatus: value === 'all' ? undefined : (value as FilterState['trustStatus']),
    });
  };

  const handleWorkspaceChange = (value: string) => {
    onFiltersChange({
      ...filters,
      workspaceId: value === 'all' ? undefined : value,
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search work units..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
          data-testid="work-unit-search"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Type Tabs */}
        <Tabs
          value={filters.type || 'all'}
          onValueChange={handleTypeChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            <TabsTrigger value="all" data-testid="filter-type-all">
              All
            </TabsTrigger>
            <TabsTrigger value="atomic" data-testid="filter-type-atomic">
              Atomic
            </TabsTrigger>
            <TabsTrigger value="composite" data-testid="filter-type-composite">
              Composite
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Trust Status Filter */}
        <Select
          value={filters.trustStatus || 'all'}
          onValueChange={handleTrustStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="filter-trust-status">
            <SelectValue placeholder="Trust Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Workspace Filter */}
        {showWorkspaceFilter && workspaces.length > 0 && (
          <Select
            value={filters.workspaceId || 'all'}
            onValueChange={handleWorkspaceChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="filter-workspace">
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workspaces</SelectItem>
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}

export default WorkUnitFilters;
