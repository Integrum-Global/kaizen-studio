/**
 * Workspace Hooks Tests
 *
 * Tests for React Query hooks in the workspace feature.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useWorkspaceList,
  useWorkspaceDetail,
  useCreateWorkspace,
  useArchiveWorkspace,
  workspaceKeys,
} from '../useWorkspaces';
import {
  fetchWorkspaces,
  fetchWorkspace,
  createWorkspace,
  archiveWorkspace,
} from '../../api/workspaces';
import type { Workspace, WorkspaceSummary, WorkspaceType } from '../../types';

// Mock the API module
vi.mock('../../api/workspaces', () => ({
  fetchWorkspaces: vi.fn(),
  fetchWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  updateWorkspace: vi.fn(),
  archiveWorkspace: vi.fn(),
  restoreWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  addWorkspaceMember: vi.fn(),
  updateWorkspaceMember: vi.fn(),
  removeWorkspaceMember: vi.fn(),
  addWorkUnitToWorkspace: vi.fn(),
  removeWorkUnitFromWorkspace: vi.fn(),
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
function createMockWorkspaceSummary(overrides?: Partial<WorkspaceSummary>): WorkspaceSummary {
  return {
    id: `workspace-${Math.random().toString(36).slice(2)}`,
    name: 'Test Workspace',
    description: 'A test workspace',
    workspaceType: 'temporary',
    ownerName: 'Alice',
    ownerId: 'user-123',
    memberCount: 5,
    workUnitCount: 10,
    isArchived: false,
    isPersonal: false,
    ...overrides,
  };
}

function createMockWorkspace(overrides?: Partial<Workspace>): Workspace {
  return {
    id: `workspace-${Math.random().toString(36).slice(2)}`,
    name: 'Test Workspace',
    description: 'A test workspace',
    workspaceType: 'temporary',
    ownerId: 'user-123',
    ownerName: 'Alice',
    organizationId: 'org-123',
    members: [],
    workUnits: [],
    memberCount: 0,
    workUnitCount: 0,
    isArchived: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Workspace Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('workspaceKeys', () => {
    it('should generate correct query keys', () => {
      expect(workspaceKeys.all).toEqual(['workspaces']);
      expect(workspaceKeys.lists()).toEqual(['workspaces', 'list']);
      expect(workspaceKeys.list({ search: 'test' })).toEqual([
        'workspaces',
        'list',
        { search: 'test' },
      ]);
      expect(workspaceKeys.details()).toEqual(['workspaces', 'detail']);
      expect(workspaceKeys.detail('ws-123')).toEqual(['workspaces', 'detail', 'ws-123']);
      expect(workspaceKeys.members('ws-123')).toEqual(['workspaces', 'members', 'ws-123']);
      expect(workspaceKeys.workUnits('ws-123')).toEqual(['workspaces', 'work-units', 'ws-123']);
    });
  });

  describe('useWorkspaceList', () => {
    it('should fetch workspaces successfully', async () => {
      const mockWorkspaces = [
        createMockWorkspaceSummary({ id: 'ws-1', name: 'Workspace 1' }),
        createMockWorkspaceSummary({ id: 'ws-2', name: 'Workspace 2' }),
      ];

      vi.mocked(fetchWorkspaces).mockResolvedValue(mockWorkspaces);

      const { result } = renderHook(() => useWorkspaceList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchWorkspaces).toHaveBeenCalled();
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe('Workspace 1');
      expect(result.current.data?.[1].name).toBe('Workspace 2');
    });

    it('should fetch with filters', async () => {
      vi.mocked(fetchWorkspaces).mockResolvedValue([]);

      const filters = { search: 'audit', workspaceType: 'temporary' as WorkspaceType };

      const { result } = renderHook(() => useWorkspaceList(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchWorkspaces).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetchWorkspaces).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWorkspaceList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Network error');
      consoleErrorSpy.mockRestore();
    });

    it('should return empty array when no workspaces', async () => {
      vi.mocked(fetchWorkspaces).mockResolvedValue([]);

      const { result } = renderHook(() => useWorkspaceList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should include all workspace types', async () => {
      const mockWorkspaces = [
        createMockWorkspaceSummary({ workspaceType: 'permanent' }),
        createMockWorkspaceSummary({ workspaceType: 'temporary' }),
        createMockWorkspaceSummary({ workspaceType: 'personal', isPersonal: true }),
      ];

      vi.mocked(fetchWorkspaces).mockResolvedValue(mockWorkspaces);

      const { result } = renderHook(() => useWorkspaceList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0].workspaceType).toBe('permanent');
      expect(result.current.data?.[1].workspaceType).toBe('temporary');
      expect(result.current.data?.[2].workspaceType).toBe('personal');
    });
  });

  describe('useWorkspaceDetail', () => {
    it('should fetch a single workspace by ID', async () => {
      const mockWorkspace = createMockWorkspace({ id: 'ws-123', name: 'My Workspace' });

      vi.mocked(fetchWorkspace).mockResolvedValue(mockWorkspace);

      const { result } = renderHook(() => useWorkspaceDetail('ws-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetchWorkspace).toHaveBeenCalledWith('ws-123');
      expect(result.current.data?.name).toBe('My Workspace');
    });

    it('should not fetch when id is undefined', () => {
      const { result } = renderHook(() => useWorkspaceDetail(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(fetchWorkspace).not.toHaveBeenCalled();
    });

    it('should return full workspace with members and work units', async () => {
      const mockWorkspace = createMockWorkspace({
        id: 'ws-123',
        members: [
          { userId: 'u1', userName: 'Alice', role: 'owner', joinedAt: '2024-01-01T00:00:00Z' },
          { userId: 'u2', userName: 'Bob', role: 'member', joinedAt: '2024-01-02T00:00:00Z' },
        ],
        workUnits: [
          {
            workUnitId: 'wu1',
            workUnitName: 'Task 1',
            workUnitType: 'atomic',
            trustStatus: 'valid',
            addedAt: '2024-01-01T00:00:00Z',
            addedBy: 'u1',
          },
        ],
        memberCount: 2,
        workUnitCount: 1,
      });

      vi.mocked(fetchWorkspace).mockResolvedValue(mockWorkspace);

      const { result } = renderHook(() => useWorkspaceDetail('ws-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.members).toHaveLength(2);
      expect(result.current.data?.workUnits).toHaveLength(1);
      expect(result.current.data?.memberCount).toBe(2);
      expect(result.current.data?.workUnitCount).toBe(1);
    });
  });

  describe('useCreateWorkspace', () => {
    it('should create workspace successfully', async () => {
      const newWorkspace = createMockWorkspace({ id: 'new-ws', name: 'New Workspace' });
      vi.mocked(createWorkspace).mockResolvedValue(newWorkspace);

      const { result } = renderHook(() => useCreateWorkspace(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: 'New Workspace',
        workspaceType: 'temporary',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(createWorkspace).toHaveBeenCalledWith({
        name: 'New Workspace',
        workspaceType: 'temporary',
      });
    });

    it('should handle create error', async () => {
      vi.mocked(createWorkspace).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useCreateWorkspace(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: 'New Workspace',
        workspaceType: 'temporary',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Create failed');
    });
  });

  describe('useArchiveWorkspace', () => {
    it('should archive workspace successfully', async () => {
      vi.mocked(archiveWorkspace).mockResolvedValue(undefined);

      const { result } = renderHook(() => useArchiveWorkspace(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('ws-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(archiveWorkspace).toHaveBeenCalledWith('ws-123');
    });

    it('should handle archive error', async () => {
      vi.mocked(archiveWorkspace).mockRejectedValue(new Error('Archive failed'));

      const { result } = renderHook(() => useArchiveWorkspace(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('ws-123');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe('Archive failed');
    });
  });
});
