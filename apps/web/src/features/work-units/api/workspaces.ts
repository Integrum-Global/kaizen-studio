/**
 * Workspace API Functions
 *
 * API functions for workspace management.
 * Workspaces are purpose-driven collections of work units that can cross departmental boundaries.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { apiClient } from '@/api';
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

  const response = await apiClient.get<WorkspaceSummary[]>(url);
  return response.data;
}

/**
 * Fetch a single workspace by ID
 */
export async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await apiClient.get<Workspace>(`${API_BASE}/workspaces/${id}`);
  return response.data;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<Workspace> {
  const response = await apiClient.post<Workspace>(`${API_BASE}/workspaces`, input);
  return response.data;
}

/**
 * Update an existing workspace
 */
export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput
): Promise<Workspace> {
  const response = await apiClient.patch<Workspace>(`${API_BASE}/workspaces/${id}`, input);
  return response.data;
}

/**
 * Archive a workspace (soft delete)
 */
export async function archiveWorkspace(id: string): Promise<void> {
  await apiClient.post(`${API_BASE}/workspaces/${id}/archive`);
}

/**
 * Restore an archived workspace
 */
export async function restoreWorkspace(id: string): Promise<Workspace> {
  const response = await apiClient.post<Workspace>(`${API_BASE}/workspaces/${id}/restore`);
  return response.data;
}

/**
 * Delete a workspace permanently (owner only)
 */
export async function deleteWorkspace(id: string): Promise<void> {
  await apiClient.delete(`${API_BASE}/workspaces/${id}`);
}

/**
 * Add a member to a workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole
): Promise<void> {
  await apiClient.post(`${API_BASE}/workspaces/${workspaceId}/members`, { userId, role });
}

/**
 * Update a member's role in a workspace
 */
export async function updateWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole
): Promise<void> {
  await apiClient.patch(`${API_BASE}/workspaces/${workspaceId}/members/${userId}`, { role });
}

/**
 * Remove a member from a workspace
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  await apiClient.delete(`${API_BASE}/workspaces/${workspaceId}/members/${userId}`);
}

/**
 * Add a work unit to a workspace (delegates access)
 */
export async function addWorkUnitToWorkspace(
  workspaceId: string,
  workUnitId: string,
  constraints?: Record<string, unknown>
): Promise<void> {
  await apiClient.post(`${API_BASE}/workspaces/${workspaceId}/work-units`, {
    workUnitId,
    constraints,
  });
}

/**
 * Remove a work unit from a workspace (revokes delegation)
 */
export async function removeWorkUnitFromWorkspace(
  workspaceId: string,
  workUnitId: string
): Promise<void> {
  await apiClient.delete(`${API_BASE}/workspaces/${workspaceId}/work-units/${workUnitId}`);
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
