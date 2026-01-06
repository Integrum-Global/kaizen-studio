import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WorkUnitGrid,
  WorkUnitFilters,
  WorkUnitDetailPanel,
  WorkUnitCreateWizard,
} from '@/features/work-units';
import type { WorkUnit, WorkUnitFiltersState } from '@/features/work-units';
import type { CreateWorkUnitFormData } from '@/features/work-units/components/wizard';
import {
  useWorkUnits,
  useWorkUnitRuns,
  useRunWorkUnit,
  useWorkspaces,
  useCreateWorkUnit,
  useDelegatees,
} from '@/features/work-units/hooks';
import { DelegationWizard, TrustChainViewer, useTrustChain } from '@/features/trust';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  // Delegation wizard state
  const [showDelegateWizard, setShowDelegateWizard] = useState(false);
  const [delegateWorkUnitId, setDelegateWorkUnitId] = useState<string | undefined>();

  // Trust chain viewer state
  const [showTrustChain, setShowTrustChain] = useState(false);
  const [trustChainAgentId, setTrustChainAgentId] = useState<string | undefined>();

  // Fetch work units with filters
  const { data: workUnitsData, isLoading } = useWorkUnits(filters);
  const workUnits = workUnitsData?.items ?? [];

  // Fetch available workspaces for filtering
  const { data: workspacesData } = useWorkspaces();
  const workspaceRefs = workspacesData?.map((ws) => ({ id: ws.id, name: ws.name })) ?? [];

  // Fetch available delegatees for the create wizard
  const { data: delegateesData } = useDelegatees();

  // Fetch recent runs for selected work unit
  const { data: recentRuns } = useWorkUnitRuns(selectedUnit?.id);

  // Fetch trust chain when viewing
  const { data: trustChainData } = useTrustChain(trustChainAgentId ?? '');

  // Run work unit mutation
  const runWorkUnit = useRunWorkUnit();

  // Create work unit mutation
  const createWorkUnit = useCreateWorkUnit();

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

  // Handle delegate action - opens delegation wizard
  const handleDelegate = useCallback((workUnit: WorkUnit) => {
    setDelegateWorkUnitId(workUnit.id);
    setShowDelegateWizard(true);
  }, []);

  // Handle view trust action - opens trust chain viewer
  const handleViewTrust = useCallback((workUnit: WorkUnit) => {
    setTrustChainAgentId(workUnit.id);
    setShowTrustChain(true);
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

  // Handle create work unit submission
  const handleCreateSubmit = useCallback(async (formData: CreateWorkUnitFormData) => {
    await createWorkUnit.mutateAsync({
      name: formData.name,
      description: formData.description,
      type: formData.type,
      capabilities: formData.capabilities,
      workspaceId: formData.workspaceId,
      tags: formData.tags,
    });
    setShowCreateWizard(false);
  }, [createWorkUnit]);

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
        <Button onClick={() => setShowCreateWizard(true)}>
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

      {/* Create Work Unit Wizard */}
      <WorkUnitCreateWizard
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSubmit={handleCreateSubmit}
        userLevel={userLevel}
        workspaces={workspaceRefs}
        delegatees={delegateesData ?? []}
        isSubmitting={createWorkUnit.isPending}
      />

      {/* Delegation Wizard Dialog */}
      <Dialog open={showDelegateWizard} onOpenChange={setShowDelegateWizard}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delegate Work Unit</DialogTitle>
          </DialogHeader>
          <DelegationWizard
            initialSourceAgentId={delegateWorkUnitId}
            onSuccess={() => {
              setShowDelegateWizard(false);
              setDelegateWorkUnitId(undefined);
            }}
            onCancel={() => {
              setShowDelegateWizard(false);
              setDelegateWorkUnitId(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Trust Chain Viewer Dialog */}
      <Dialog open={showTrustChain} onOpenChange={setShowTrustChain}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trust Chain</DialogTitle>
          </DialogHeader>
          {trustChainData && <TrustChainViewer trustChain={trustChainData} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
