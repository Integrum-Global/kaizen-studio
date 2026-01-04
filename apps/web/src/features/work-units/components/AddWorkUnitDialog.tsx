/**
 * AddWorkUnitDialog
 *
 * Dialog for adding existing work units to a workspace.
 * Shows a searchable list of available work units and allows
 * selection for adding to the workspace.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Boxes, Circle, Layers } from 'lucide-react';
import { useWorkUnits, useAddWorkUnit } from '../hooks';
import { TrustStatusBadge } from './TrustStatusBadge';
import type { WorkUnit, WorkspaceWorkUnit } from '../types';

interface AddWorkUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  /** Work units already in the workspace - to filter them out */
  existingWorkUnits: WorkspaceWorkUnit[];
}

export function AddWorkUnitDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  existingWorkUnits,
}: AddWorkUnitDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch available work units
  const { data: workUnitsData, isLoading } = useWorkUnits({ search }, 1, 50);

  // Add work unit mutation
  const addWorkUnit = useAddWorkUnit();

  // Filter out work units already in workspace
  const existingIds = useMemo(
    () => new Set(existingWorkUnits.map((wu) => wu.workUnitId)),
    [existingWorkUnits]
  );

  const availableWorkUnits = useMemo(() => {
    if (!workUnitsData?.items) return [];
    return workUnitsData.items.filter((wu) => !existingIds.has(wu.id));
  }, [workUnitsData, existingIds]);

  // Handle selection toggle
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Handle add work units
  const handleAdd = async () => {
    const promises = Array.from(selectedIds).map((workUnitId) =>
      addWorkUnit.mutateAsync({
        workspaceId,
        workUnitId,
      })
    );

    try {
      await Promise.all(promises);
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearch('');
      setSelectedIds(new Set());
    }
    onOpenChange(newOpen);
  };

  const isSubmitting = addWorkUnit.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl"
        aria-labelledby="add-work-unit-title"
        aria-describedby="add-work-unit-description"
      >
        <DialogHeader>
          <DialogTitle id="add-work-unit-title">Add Work Units</DialogTitle>
          <DialogDescription id="add-work-unit-description">
            Add existing work units to &quot;{workspaceName}&quot;.
            Select the work units you want to include.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search work units..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Work Units List */}
        <ScrollArea className="h-[300px] border rounded-lg">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-5 h-5 rounded" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : availableWorkUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <Boxes className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-center">
                {search
                  ? 'No matching work units found'
                  : 'All work units are already in this workspace'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {availableWorkUnits.map((workUnit) => (
                <WorkUnitRow
                  key={workUnit.id}
                  workUnit={workUnit}
                  selected={selectedIds.has(workUnit.id)}
                  onToggle={() => toggleSelection(workUnit.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Selection Summary */}
        {selectedIds.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedIds.size} work unit{selectedIds.size !== 1 ? 's' : ''} selected
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : `Add ${selectedIds.size || ''} Work Unit${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual work unit row in the selection list
 */
function WorkUnitRow({
  workUnit,
  selected,
  onToggle,
}: {
  workUnit: WorkUnit;
  selected: boolean;
  onToggle: () => void;
}) {
  const Icon = workUnit.type === 'atomic' ? Circle : Layers;

  return (
    <label
      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
      data-testid={`work-unit-option-${workUnit.id}`}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        aria-label={`Select ${workUnit.name}`}
      />

      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{workUnit.name}</span>
          <Badge variant="secondary" className="text-xs capitalize">
            {workUnit.type}
          </Badge>
        </div>
        {workUnit.description && (
          <p className="text-sm text-muted-foreground truncate">
            {workUnit.description}
          </p>
        )}
      </div>

      <TrustStatusBadge status={workUnit.trustInfo.status} size="sm" />
    </label>
  );
}

export default AddWorkUnitDialog;
