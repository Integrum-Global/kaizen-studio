/**
 * Work Units Hooks Tests
 *
 * Tests for React Query hooks in the work units feature.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useProcesses,
  useTeamActivity,
  useAvailableTasks,
  useWorkUnit,
  workUnitKeys,
} from '../useWorkUnits';
import {
  fetchProcesses,
  fetchTeamActivity,
  fetchAvailableTasks,
  fetchWorkUnit,
} from '../../api';
import type { ProcessResponse, ActivityEvent } from '../../api/work-units';
import type { WorkUnit, SubUnit, TrustStatus } from '../../types';

// Mock the API module
vi.mock('../../api', () => ({
  fetchProcesses: vi.fn(),
  fetchTeamActivity: vi.fn(),
  fetchAvailableTasks: vi.fn(),
  fetchWorkUnit: vi.fn(),
}));

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

// Mock data factories
function createMockSubUnit(overrides?: Partial<SubUnit>): SubUnit {
  return {
    id: `unit-${Math.random().toString(36).slice(2)}`,
    name: 'Test Sub-Unit',
    type: 'atomic',
    trustStatus: 'valid',
    position: 0,
    ...overrides,
  };
}

function createMockProcess(overrides?: Partial<ProcessResponse>): ProcessResponse {
  return {
    id: `process-${Math.random().toString(36).slice(2)}`,
    name: 'Test Process',
    description: 'A test process',
    type: 'composite',
    capabilities: ['process', 'orchestrate'],
    trustInfo: {
      status: 'valid',
      establishedAt: '2024-01-01T00:00:00Z',
    },
    createdBy: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    subUnits: [createMockSubUnit(), createMockSubUnit()],
    delegatedBy: { id: 'user-1', name: 'Alice' },
    teamSize: 5,
    runsToday: 10,
    errorsToday: 1,
    ...overrides,
  };
}

function createMockActivityEvent(overrides?: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: `event-${Math.random().toString(36).slice(2)}`,
    type: 'completion',
    userId: 'user-123',
    userName: 'Test User',
    workUnitId: 'wu-123',
    workUnitName: 'Test Work Unit',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function createMockWorkUnit(overrides?: Partial<WorkUnit>): WorkUnit {
  return {
    id: 'wu-123',
    name: 'Test Work Unit',
    description: 'A test work unit',
    type: 'atomic',
    capabilities: ['extract', 'validate'],
    trustInfo: {
      status: 'valid',
      establishedAt: '2024-01-01T00:00:00Z',
    },
    createdBy: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Work Units Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('workUnitKeys', () => {
    it('should generate correct query keys', () => {
      expect(workUnitKeys.all).toEqual(['work-units']);
      expect(workUnitKeys.lists()).toEqual(['work-units', 'list']);
      expect(workUnitKeys.list({ search: 'test' })).toEqual([
        'work-units',
        'list',
        { search: 'test' },
      ]);
      expect(workUnitKeys.details()).toEqual(['work-units', 'detail']);
      expect(workUnitKeys.detail('wu-123')).toEqual(['work-units', 'detail', 'wu-123']);
      expect(workUnitKeys.runs('wu-123')).toEqual(['work-units', 'runs', 'wu-123']);
      expect(workUnitKeys.available()).toEqual(['work-units', 'available']);
      expect(workUnitKeys.recentRuns()).toEqual(['work-units', 'recent-runs']);
      expect(workUnitKeys.workspaces()).toEqual(['workspaces']);
      expect(workUnitKeys.delegatees()).toEqual(['delegatees']);
    });
  });

  describe('useProcesses', () => {
    it('should fetch processes successfully', async () => {
      const mockProcesses = [
        createMockProcess({ id: 'process-1', name: 'Process 1' }),
        createMockProcess({ id: 'process-2', name: 'Process 2' }),
      ];

      vi.mocked(fetchProcesses).mockResolvedValue(mockProcesses);

      const { result } = renderHook(() => useProcesses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchProcesses).toHaveBeenCalled();
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe('Process 1');
      expect(result.current.data?.[1].name).toBe('Process 2');
    });

    it('should handle fetch error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetchProcesses).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProcesses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Network error');
      consoleErrorSpy.mockRestore();
    });

    it('should include process metadata', async () => {
      const mockProcess = createMockProcess({
        delegatedBy: { id: 'user-1', name: 'Admin User' },
        teamSize: 10,
        runsToday: 25,
        errorsToday: 3,
      });

      vi.mocked(fetchProcesses).mockResolvedValue([mockProcess]);

      const { result } = renderHook(() => useProcesses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const process = result.current.data?.[0];
      expect(process?.delegatedBy?.name).toBe('Admin User');
      expect(process?.teamSize).toBe(10);
      expect(process?.runsToday).toBe(25);
      expect(process?.errorsToday).toBe(3);
    });

    it('should return empty array when no processes', async () => {
      vi.mocked(fetchProcesses).mockResolvedValue([]);

      const { result } = renderHook(() => useProcesses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useTeamActivity', () => {
    it('should fetch team activity successfully', async () => {
      const mockEvents = [
        createMockActivityEvent({ id: 'event-1', type: 'completion' }),
        createMockActivityEvent({ id: 'event-2', type: 'run' }),
        createMockActivityEvent({ id: 'event-3', type: 'error' }),
      ];

      vi.mocked(fetchTeamActivity).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useTeamActivity(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchTeamActivity).toHaveBeenCalledWith(10);
      expect(result.current.data).toHaveLength(3);
    });

    it('should use default limit of 10', async () => {
      vi.mocked(fetchTeamActivity).mockResolvedValue([]);

      const { result } = renderHook(() => useTeamActivity(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchTeamActivity).toHaveBeenCalledWith(10);
    });

    it('should fetch with custom limit', async () => {
      vi.mocked(fetchTeamActivity).mockResolvedValue([]);

      const { result } = renderHook(() => useTeamActivity(5), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchTeamActivity).toHaveBeenCalledWith(5);
    });

    it('should handle different event types', async () => {
      const mockEvents = [
        createMockActivityEvent({ type: 'run', userName: 'Alice' }),
        createMockActivityEvent({ type: 'completion', userName: 'Bob' }),
        createMockActivityEvent({
          type: 'error',
          userName: 'Charlie',
          details: { errorMessage: 'Something failed' },
        }),
        createMockActivityEvent({
          type: 'delegation',
          userName: 'David',
          details: { delegateeName: 'Eve' },
        }),
      ];

      vi.mocked(fetchTeamActivity).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useTeamActivity(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].type).toBe('run');
      expect(result.current.data?.[1].type).toBe('completion');
      expect(result.current.data?.[2].type).toBe('error');
      expect(result.current.data?.[3].type).toBe('delegation');
    });

    it('should handle fetch error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetchTeamActivity).mockRejectedValue(new Error('Activity fetch failed'));

      const { result } = renderHook(() => useTeamActivity(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Activity fetch failed');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('useAvailableTasks', () => {
    it('should fetch available tasks successfully', async () => {
      const mockTasks = [
        createMockWorkUnit({ id: 'wu-1', name: 'Task 1' }),
        createMockWorkUnit({ id: 'wu-2', name: 'Task 2' }),
      ];

      vi.mocked(fetchAvailableTasks).mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useAvailableTasks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchAvailableTasks).toHaveBeenCalled();
      expect(result.current.data).toHaveLength(2);
    });
  });

  describe('useWorkUnit', () => {
    it('should fetch a single work unit by ID', async () => {
      const mockWorkUnit = createMockWorkUnit({ id: 'wu-123', name: 'My Work Unit' });

      vi.mocked(fetchWorkUnit).mockResolvedValue(mockWorkUnit);

      const { result } = renderHook(() => useWorkUnit('wu-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchWorkUnit).toHaveBeenCalledWith('wu-123');
      expect(result.current.data?.name).toBe('My Work Unit');
    });

    it('should not fetch when id is undefined', () => {
      const { result } = renderHook(() => useWorkUnit(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(fetchWorkUnit).not.toHaveBeenCalled();
    });
  });
});
