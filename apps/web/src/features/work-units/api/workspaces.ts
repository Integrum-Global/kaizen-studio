/**
 * Workspace API Functions
 *
 * API functions for workspace management.
 * Workspaces are purpose-driven collections of work units that can cross departmental boundaries.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import type {
  Workspace,
  WorkspaceSummary,
  WorkspaceFilters,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceMemberRole,
} from '../types';

// API base URL - would be configured from environment in production
const API_BASE = '/api/v1';

/**
 * Fetch all workspaces for the current user
 */
export async function fetchWorkspaces(
  filters?: WorkspaceFilters
): Promise<WorkspaceSummary[]> {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set('search', filters.search);
  }
  if (filters?.workspaceType && filters.workspaceType !== 'all') {
    params.set('type', filters.workspaceType);
  }
  if (filters?.includeArchived) {
    params.set('includeArchived', 'true');
  }
  if (filters?.ownerId) {
    params.set('ownerId', filters.ownerId);
  }

  const queryString = params.toString();
  const url = `${API_BASE}/workspaces${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single workspace by ID
 */
export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await fetch(`${API_BASE}/workspaces/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch workspace: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<Workspace> {
  const response = await fetch(`${API_BASE}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create workspace: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing workspace
 */
export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput
): Promise<Workspace> {
  const response = await fetch(`${API_BASE}/workspaces/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to update workspace: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Archive a workspace (soft delete)
 */
export async function archiveWorkspace(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/workspaces/${id}/archive`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to archive workspace: ${response.statusText}`);
  }
}

/**
 * Restore an archived workspace
 */
export async function restoreWorkspace(id: string): Promise<Workspace> {
  const response = await fetch(`${API_BASE}/workspaces/${id}/restore`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to restore workspace: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a workspace permanently (owner only)
 */
export async function deleteWorkspace(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/workspaces/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete workspace: ${response.statusText}`);
  }
}

/**
 * Add a member to a workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/members`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, role }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add member: ${response.statusText}`);
  }
}

/**
 * Update a member's role in a workspace
 */
export async function updateWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/members/${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update member: ${response.statusText}`);
  }
}

/**
 * Remove a member from a workspace
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/members/${userId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to remove member: ${response.statusText}`);
  }
}

/**
 * Add a work unit to a workspace (delegates access)
 */
export async function addWorkUnitToWorkspace(
  workspaceId: string,
  workUnitId: string,
  constraints?: Record<string, unknown>
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/work-units`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workUnitId, constraints }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add work unit: ${response.statusText}`);
  }
}

/**
 * Remove a work unit from a workspace (revokes delegation)
 */
export async function removeWorkUnitFromWorkspace(
  workspaceId: string,
  workUnitId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/workspaces/${workspaceId}/work-units/${workUnitId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to remove work unit: ${response.statusText}`);
  }
}

/**
 * Get the icon for a workspace type
 */
export function getWorkspaceTypeIcon(type: string): string {
  switch (type) {
    case 'permanent':
      return 'building-2'; // Building icon for departments
    case 'temporary':
      return 'folder-clock'; // Folder with clock for projects
    case 'personal':
      return 'star'; // Star for favorites
    default:
      return 'folder';
  }
}

/**
 * Get the label for a workspace type
 */
export function getWorkspaceTypeLabel(type: string): string {
  switch (type) {
    case 'permanent':
      return 'Permanent';
    case 'temporary':
      return 'Temporary';
    case 'personal':
      return 'Personal';
    default:
      return type;
  }
}
