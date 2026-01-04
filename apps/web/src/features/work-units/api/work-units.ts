/**
 * Work Units API
 *
 * API client for work unit operations.
 */

import type {
  WorkUnit,
  WorkUnitListResponse,
  WorkUnitFilters,
  CreateWorkUnitInput,
  UpdateWorkUnitInput,
  RunResult,
} from '../types';

const API_BASE = '/api/v1/work-units';

/**
 * Fetch work units with optional filters
 */
export async function fetchWorkUnits(
  filters?: WorkUnitFilters,
  page = 1,
  pageSize = 20
): Promise<WorkUnitListResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  if (filters?.search) params.set('search', filters.search);
  if (filters?.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters?.trustStatus && filters.trustStatus !== 'all') {
    params.set('trustStatus', filters.trustStatus);
  }
  if (filters?.workspaceId) params.set('workspaceId', filters.workspaceId);
  if (filters?.tags?.length) params.set('tags', filters.tags.join(','));

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch work units: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single work unit by ID
 */
export async function fetchWorkUnit(id: string): Promise<WorkUnit> {
  const response = await fetch(`${API_BASE}/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch work unit: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new work unit
 */
export async function createWorkUnit(input: CreateWorkUnitInput): Promise<WorkUnit> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create work unit: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a work unit
 */
export async function updateWorkUnit(
  id: string,
  input: UpdateWorkUnitInput
): Promise<WorkUnit> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to update work unit: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a work unit
 */
export async function deleteWorkUnit(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete work unit: ${response.statusText}`);
  }
}

/**
 * Run a work unit
 */
export async function runWorkUnit(
  id: string,
  inputs?: Record<string, unknown>
): Promise<RunResult> {
  const response = await fetch(`${API_BASE}/${id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs }),
  });

  if (!response.ok) {
    throw new Error(`Failed to run work unit: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get recent runs for a work unit
 */
export async function fetchRecentRuns(
  workUnitId: string,
  limit = 10
): Promise<RunResult[]> {
  const response = await fetch(`${API_BASE}/${workUnitId}/runs?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch runs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get available tasks for the current user (Level 1 view)
 */
export async function fetchAvailableTasks(): Promise<WorkUnit[]> {
  const response = await fetch(`${API_BASE}/available`);

  if (!response.ok) {
    throw new Error(`Failed to fetch available tasks: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get user's recent run results
 */
export async function fetchUserRecentRuns(limit = 10): Promise<RunResult[]> {
  const response = await fetch(`/api/v1/runs/recent?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch recent runs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Workspace reference type
 */
export interface WorkspaceResponse {
  id: string;
  name: string;
  color?: string;
}

/**
 * Delegatee reference type
 */
export interface DelegateeResponse {
  id: string;
  name: string;
  level: 1 | 2 | 3;
}

/**
 * Get available workspaces for the current user
 */
export async function fetchWorkspaces(): Promise<WorkspaceResponse[]> {
  const response = await fetch('/api/v1/workspaces');

  if (!response.ok) {
    throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get available users for delegation
 */
export async function fetchDelegatees(): Promise<DelegateeResponse[]> {
  const response = await fetch('/api/v1/users/delegatees');

  if (!response.ok) {
    throw new Error(`Failed to fetch delegatees: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Process (composite work unit) response with additional fields
 */
export interface ProcessResponse extends WorkUnit {
  delegatedBy?: {
    id: string;
    name: string;
  };
  teamSize: number;
  runsToday: number;
  errorsToday: number;
}

/**
 * Get processes (composite work units) for Level 2 view
 */
export async function fetchProcesses(): Promise<ProcessResponse[]> {
  const response = await fetch(`${API_BASE}?type=composite`);

  if (!response.ok) {
    throw new Error(`Failed to fetch processes: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Team activity event
 */
export interface ActivityEvent {
  id: string;
  type: 'run' | 'delegation' | 'error' | 'completion';
  userId: string;
  userName: string;
  workUnitId: string;
  workUnitName: string;
  timestamp: string;
  details?: {
    runId?: string;
    errorMessage?: string;
    delegateeId?: string;
    delegateeName?: string;
  };
}

/**
 * Get team activity events
 */
export async function fetchTeamActivity(limit = 10): Promise<ActivityEvent[]> {
  const response = await fetch(`/api/v1/activity/team?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch team activity: ${response.statusText}`);
  }

  return response.json();
}
