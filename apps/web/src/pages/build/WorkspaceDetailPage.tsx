import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkUnitGrid,
  WorkUnitFilters,
  WorkUnitDetailPanel,
  AddWorkUnitDialog,
  InviteMemberDialog,
} from '@/features/work-units';
import type { WorkUnit, WorkUnitFiltersState } from '@/features/work-units';
import {
  useWorkspaceDetail,
  useWorkUnitRuns,
  useRunWorkUnit,
} from '@/features/work-units/hooks';
import { useUserLevel } from '@/contexts/UserLevelContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Settings, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Workspace Detail Page
 *
 * Shows the contents of a specific workspace with its work units.
 * Part of the EATP Ontology "Build" section.
 */
export function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { level: userLevel } = useUserLevel();

  // Fetch workspace details
  const { data: workspace, isLoading } = useWorkspaceDetail(workspaceId);

  const [selectedUnit, setSelectedUnit] = useState<WorkUnit | null>(null);
  const [filters, setFilters] = useState<WorkUnitFiltersState>({});
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [loadingWorkUnitId, setLoadingWorkUnitId] = useState<string | undefined>();
  const [loadingAction, setLoadingAction] = useState<'run' | 'configure' | 'delegate' | undefined>();

  // Fetch recent runs for selected work unit
  const { data: recentRuns } = useWorkUnitRuns(selectedUnit?.id);

  // Run work unit mutation
  const runWorkUnit = useRunWorkUnit();

  // Convert workspace work units to WorkUnit array for the grid
  const workUnits: WorkUnit[] = workspace?.workUnits?.map((wu) => ({
    id: wu.workUnitId,
    name: wu.workUnitName,
    description: '',
    type: wu.workUnitType,
    capabilities: [],
    trustInfo: { status: wu.trustStatus },
    createdBy: wu.addedBy,
    createdAt: wu.addedAt,
    updatedAt: wu.addedAt,
    workspaceId: workspace.id,
    workspace: { id: workspace.id, name: workspace.name, color: workspace.color },
  })) ?? [];

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

  // Handle configure action
  const handleConfigure = useCallback((workUnit: WorkUnit) => {
    // TODO: Open configuration dialog or navigate to configuration page
    console.log('Configure work unit:', workUnit.id);
  }, []);

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

  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Workspace not found</p>
        <Button variant="outline" onClick={() => navigate('/build/workspaces')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/build/workspaces')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{workspace.name}</h1>
            <p className="text-muted-foreground">
              {workspace.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowInviteDialog(true)}>
            <Users className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Work Unit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b">
        <WorkUnitFilters
          filters={filters}
          onFiltersChange={setFilters}
          showWorkspaceFilter={false}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={userLevel}
          isLoading={false}
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

      {/* Dialogs */}
      {workspaceId && (
        <>
          <AddWorkUnitDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            workspaceId={workspaceId}
            workspaceName={workspace.name}
            existingWorkUnits={workspace.workUnits ?? []}
          />
          <InviteMemberDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            workspaceId={workspaceId}
            workspaceName={workspace.name}
            existingMembers={workspace.members ?? []}
          />
        </>
      )}
    </div>
  );
}
