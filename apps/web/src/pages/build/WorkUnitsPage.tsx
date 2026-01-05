import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WorkUnitGrid,
  WorkUnitFilters,
  WorkUnitDetailPanel,
} from '@/features/work-units';
import type { WorkUnit, WorkUnitFiltersState } from '@/features/work-units';
import { useWorkUnits, useWorkUnitRuns, useRunWorkUnit, useWorkspaces } from '@/features/work-units/hooks';
import { useUserLevel } from '@/contexts/UserLevelContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * Work Units Page
 *
 * Level 2 experience for managing work units (projects, teams, processes).
 * Part of the EATP Ontology "Build" section.
 */
export function WorkUnitsPage() {
  const navigate = useNavigate();
  const { level: userLevel } = useUserLevel();
  const [selectedUnit, setSelectedUnit] = useState<WorkUnit | null>(null);
  const [filters, setFilters] = useState<WorkUnitFiltersState>({});
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [loadingWorkUnitId, setLoadingWorkUnitId] = useState<string | undefined>();
  const [loadingAction, setLoadingAction] = useState<'run' | 'configure' | 'delegate' | undefined>();

  // Fetch work units with filters
  const { data: workUnitsData, isLoading } = useWorkUnits(filters);
  const workUnits = workUnitsData?.items ?? [];

  // Fetch available workspaces for filtering
  const { data: workspacesData } = useWorkspaces();
  const workspaceRefs = workspacesData?.map((ws) => ({ id: ws.id, name: ws.name })) ?? [];

  // Fetch recent runs for selected work unit
  const { data: recentRuns } = useWorkUnitRuns(selectedUnit?.id);

  // Run work unit mutation
  const runWorkUnit = useRunWorkUnit();

  // Handle work unit click - opens detail panel
  const handleWorkUnitClick = useCallback((workUnit: WorkUnit) => {
    setSelectedUnit(workUnit);
    setDetailPanelOpen(true);
  }, []);

  // Handle run action
  const handleRun = useCallback(async (workUnit: WorkUnit) => {
    setLoadingWorkUnitId(workUnit.id);
    setLoadingAction('run');
    try {
      await runWorkUnit.mutateAsync({ workUnitId: workUnit.id });
    } finally {
      setLoadingWorkUnitId(undefined);
      setLoadingAction(undefined);
    }
  }, [runWorkUnit]);

  // Handle configure action - navigate to the appropriate editor
  const handleConfigure = useCallback((workUnit: WorkUnit) => {
    // Close detail panel before navigating
    setDetailPanelOpen(false);
    setSelectedUnit(null);

    // Navigate to appropriate editor based on work unit type
    if (workUnit.type === 'atomic') {
      // Atomic work units (agents) - use agent editor
      navigate(`/agents/${workUnit.id}`);
    } else if (workUnit.type === 'composite') {
      // Composite work units (pipelines) - use pipeline editor with drag-and-drop
      navigate(`/pipelines/${workUnit.id}`);
    }
  }, [navigate]);

  // Handle delegate action
  const handleDelegate = useCallback((workUnit: WorkUnit) => {
    // TODO: Open delegation wizard
    console.log('Delegate work unit:', workUnit.id);
  }, []);

  // Handle view trust action
  const handleViewTrust = useCallback((workUnit: WorkUnit) => {
    // TODO: Open trust chain viewer
    console.log('View trust for work unit:', workUnit.id);
  }, []);

  // Handle close detail panel
  const handleCloseDetailPanel = useCallback(() => {
    setDetailPanelOpen(false);
    setSelectedUnit(null);
  }, []);

  // Handle view run result
  const handleViewRun = useCallback((runId: string) => {
    // TODO: Navigate to run details page
    console.log('View run:', runId);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Work Units</h1>
          <p className="text-muted-foreground">
            Manage your projects, teams, and processes
          </p>
        </div>
        <Button onClick={() => console.log('TODO: Open create work unit dialog')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Work Unit
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b">
        <WorkUnitFilters
          filters={filters}
          onFiltersChange={setFilters}
          workspaces={workspaceRefs}
          showWorkspaceFilter={true}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={userLevel}
          isLoading={isLoading}
          hasMore={workUnitsData?.hasMore}
          total={workUnitsData?.total}
          onWorkUnitClick={handleWorkUnitClick}
          onRun={handleRun}
          onConfigure={handleConfigure}
          onDelegate={handleDelegate}
          onViewTrust={handleViewTrust}
          loadingWorkUnitId={loadingWorkUnitId}
          loadingAction={loadingAction}
        />
      </div>

      {/* Detail Panel */}
      <WorkUnitDetailPanel
        workUnit={selectedUnit}
        isOpen={detailPanelOpen}
        onClose={handleCloseDetailPanel}
        userLevel={userLevel}
        recentRuns={recentRuns}
        onRun={() => selectedUnit && handleRun(selectedUnit)}
        onConfigure={() => selectedUnit && handleConfigure(selectedUnit)}
        onDelegate={() => selectedUnit && handleDelegate(selectedUnit)}
        onViewTrustChain={() => selectedUnit && handleViewTrust(selectedUnit)}
        onViewRun={handleViewRun}
        isLoading={loadingWorkUnitId === selectedUnit?.id}
      />
    </div>
  );
}
