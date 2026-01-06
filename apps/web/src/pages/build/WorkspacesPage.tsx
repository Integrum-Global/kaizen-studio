import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceCard } from '@/features/work-units';
import {
  useWorkspaceList,
  useCreateWorkspace,
  useUpdateWorkspace,
  useArchiveWorkspace,
} from '@/features/work-units/hooks';
import type {
  WorkspaceType,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceSummary,
} from '@/features/work-units/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Workspaces Page
 *
 * Level 2 experience for managing workspaces (collections of work units).
 * Part of the EATP Ontology "Build" section.
 */
export function WorkspacesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState<CreateWorkspaceInput>({
    name: '',
    description: '',
    workspaceType: 'permanent',
  });

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceSummary | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateWorkspaceInput>({
    name: '',
    description: '',
  });

  // Archive confirmation state
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archivingWorkspace, setArchivingWorkspace] = useState<WorkspaceSummary | null>(null);

  // Fetch workspaces with search filter
  const { data: workspacesData, isLoading } = useWorkspaceList({
    search: searchQuery || undefined,
  });

  // Create workspace mutation
  const createWorkspace = useCreateWorkspace();

  // Update workspace mutation
  const updateWorkspace = useUpdateWorkspace();

  // Archive workspace mutation
  const archiveWorkspace = useArchiveWorkspace();

  const workspaces = workspacesData ?? [];

  const handleCreateWorkspace = async () => {
    if (newWorkspace.name.trim()) {
      try {
        await createWorkspace.mutateAsync(newWorkspace);
        setShowCreateDialog(false);
        setNewWorkspace({ name: '', description: '', workspaceType: 'permanent' });
      } catch {
        // Error handled by mutation
      }
    }
  };

  const handleOpenWorkspace = (workspace: WorkspaceSummary) => {
    navigate(`/build/workspaces/${workspace.id}`);
  };

  const handleEditWorkspace = (workspace: WorkspaceSummary) => {
    setEditingWorkspace(workspace);
    setEditFormData({
      name: workspace.name,
      description: workspace.description || '',
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (editingWorkspace && editFormData.name?.trim()) {
      try {
        await updateWorkspace.mutateAsync({
          id: editingWorkspace.id,
          input: editFormData,
        });
        setShowEditDialog(false);
        setEditingWorkspace(null);
      } catch {
        // Error handled by mutation
      }
    }
  };

  const handleArchiveWorkspace = (workspace: WorkspaceSummary) => {
    setArchivingWorkspace(workspace);
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = async () => {
    if (archivingWorkspace) {
      try {
        await archiveWorkspace.mutateAsync(archivingWorkspace.id);
        setShowArchiveConfirm(false);
        setArchivingWorkspace(null);
      } catch {
        // Error handled by mutation
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          <p className="text-muted-foreground">
            Organize your work units into workspaces
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workspace
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-2'
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No workspaces match your search' : 'No workspaces yet'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workspace
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-2'
            }
          >
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={{
                  id: workspace.id,
                  name: workspace.name,
                  description: workspace.description,
                  workspaceType: workspace.workspaceType,
                  color: workspace.color,
                  ownerName: workspace.ownerName,
                  memberCount: workspace.memberCount,
                  workUnitCount: workspace.workUnitCount,
                  expiresAt: workspace.expiresAt,
                  isArchived: workspace.isArchived,
                  isPersonal: workspace.isPersonal,
                }}
                onOpen={() => handleOpenWorkspace(workspace)}
                onEdit={() => handleEditWorkspace(workspace)}
                onArchive={() => handleArchiveWorkspace(workspace)}
                onClick={() => handleOpenWorkspace(workspace)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to organize your work units.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newWorkspace.name}
                onChange={(e) =>
                  setNewWorkspace({ ...newWorkspace, name: e.target.value })
                }
                placeholder="My Workspace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newWorkspace.description || ''}
                onChange={(e) =>
                  setNewWorkspace({ ...newWorkspace, description: e.target.value })
                }
                placeholder="Describe the purpose of this workspace..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaceType">Type</Label>
              <Select
                value={newWorkspace.workspaceType}
                onValueChange={(value: WorkspaceType) =>
                  setNewWorkspace({ ...newWorkspace, workspaceType: value })
                }
              >
                <SelectTrigger id="workspaceType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!newWorkspace.name.trim() || createWorkspace.isPending}
            >
              {createWorkspace.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update the workspace details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="Workspace name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ''}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                placeholder="Describe the purpose of this workspace..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={!editFormData.name?.trim() || updateWorkspace.isPending}
            >
              {updateWorkspace.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{archivingWorkspace?.name}"?
              This will hide it from the workspace list. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={archiveWorkspace.isPending}
            >
              {archiveWorkspace.isPending ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
