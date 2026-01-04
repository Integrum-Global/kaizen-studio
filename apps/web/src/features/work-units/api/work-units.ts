/**
 * Work Units API
 *
 * API client for work unit operations.
 */

import { apiClient } from '@/api';
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
  const params: Record<string, string> = {
    page: String(page),
    pageSize: String(pageSize),
  };

  if (filters?.search) params.search = filters.search;
  if (filters?.type && filters.type !== 'all') params.type = filters.type;
  if (filters?.trustStatus && filters.trustStatus !== 'all') {
    params.trustStatus = filters.trustStatus;
  }
  if (filters?.workspaceId) params.workspaceId = filters.workspaceId;
  if (filters?.tags?.length) params.tags = filters.tags.join(',');

  const response = await apiClient.get<WorkUnitListResponse>(API_BASE, { params });
  return response.data;
}

/**
 * Fetch a single work unit by ID
 */
export async function fetchWorkUnit(id: string): Promise<WorkUnit> {
  const response = await apiClient.get<WorkUnit>(`${API_BASE}/${id}`);
  return response.data;
}

/**
 * Create a new work unit
 */
export async function createWorkUnit(input: CreateWorkUnitInput): Promise<WorkUnit> {
  const response = await apiClient.post<WorkUnit>(API_BASE, input);
  return response.data;
}

/**
 * Update a work unit
 */
export async function updateWorkUnit(
  id: string,
  input: UpdateWorkUnitInput
): Promise<WorkUnit> {
  const response = await apiClient.put<WorkUnit>(`${API_BASE}/${id}`, input);
  return response.data;
}

/**
 * Delete a work unit
 */
export async function deleteWorkUnit(id: string): Promise<void> {
  await apiClient.delete(`${API_BASE}/${id}`);
}

/**
 * Run a work unit
 */
export async function runWorkUnit(
  id: string,
  inputs?: Record<string, unknown>
): Promise<RunResult> {
  const response = await apiClient.post<RunResult>(`${API_BASE}/${id}/run`, { inputs });
  return response.data;
}

/**
 * Get recent runs for a work unit
 */
export async function fetchRecentRuns(
  workUnitId: string,
  limit = 10
): Promise<RunResult[]> {
  const response = await apiClient.get<RunResult[]>(`${API_BASE}/${workUnitId}/runs`, {
    params: { limit },
  });
  return response.data;
}

/**
 * Get available tasks for the current user (Level 1 view)
 */
export async function fetchAvailableTasks(): Promise<WorkUnit[]> {
  const response = await apiClient.get<WorkUnit[]>(`${API_BASE}/available`);
  return response.data;
}

/**
 * Get user's recent run results
 */
export async function fetchUserRecentRuns(limit = 10): Promise<RunResult[]> {
  const response = await apiClient.get<RunResult[]>('/api/v1/runs/recent', {
    params: { limit },
  });
  return response.data;
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
  const response = await apiClient.get<WorkspaceResponse[]>('/api/v1/workspaces');
  return response.data;
}

/**
 * Get available users for delegation
 */
export async function fetchDelegatees(): Promise<DelegateeResponse[]> {
  const response = await apiClient.get<DelegateeResponse[]>('/api/v1/users/delegatees');
  return response.data;
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
  const response = await apiClient.get<ProcessResponse[]>(API_BASE, {
    params: { type: 'composite' },
  });
  return response.data;
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
  const response = await apiClient.get<ActivityEvent[]>('/api/v1/activity/team', {
    params: { limit },
  });
  return response.data;
}
