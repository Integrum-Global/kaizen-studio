/**
 * WorkspaceDetailPage Tests
 *
 * Tests for the workspace detail view including:
 * - Loading and error states
 * - Header with workspace info and actions
 * - Stats cards (work units, members, owner)
 * - Work units list with trust badges
 * - Members list with role badges
 * - Trust delegation section
 * - Dialog interactions
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkspaceDetailPage } from '../WorkspaceDetailPage';
import type { Workspace } from '@/features/work-units/types';

// Mock the hooks
const mockUseWorkspaceDetail = vi.fn();
const mockUseWorkUnits = vi.fn().mockReturnValue({ data: { items: [] }, isPending: false });
const mockUseAddWorkUnit = vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
const mockUseAddWorkspaceMember = vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false });

vi.mock('@/features/work-units/hooks', () => ({
  useWorkspaceDetail: (...args: unknown[]) => mockUseWorkspaceDetail(...args),
  useWorkUnits: (...args: unknown[]) => mockUseWorkUnits(...args),
  useAddWorkUnit: (...args: unknown[]) => mockUseAddWorkUnit(...args),
  useAddWorkspaceMember: (...args: unknown[]) => mockUseAddWorkspaceMember(...args),
}));

vi.mock('@/features/users/hooks/useUsers', () => ({
  useUsers: vi.fn().mockReturnValue({ data: { items: [] }, isPending: false }),
}));

// Mock the UserLevelContext
vi.mock('@/contexts/UserLevelContext', () => ({
  UserLevelProvider: ({ children }: { children: React.ReactNode }) => children,
  ForLevel: ({ children, min }: { children: React.ReactNode; min: number }) => {
    // Mock level 2 user for tests
    return min <= 2 ? children : null;
  },
  useUserLevel: () => ({
    level: 2,
    setLevel: vi.fn(),
    canAccess: (minLevel: number) => 2 >= minLevel,
  }),
}));

// Remove unused import - we use mockUseWorkspaceDetail directly

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test data
const mockWorkspace: Workspace = {
  id: 'ws-001',
  name: 'Engineering Workspace',
  description: 'Main workspace for engineering team operations',
  workspaceType: 'permanent',
  color: '#3b82f6',
  ownerId: 'user-001',
  ownerName: 'John Smith',
  organizationId: 'org-001',
  members: [
    {
      userId: 'user-001',
      userName: 'John Smith',
      email: 'john@example.com',
      role: 'owner',
      department: 'Engineering',
      joinedAt: '2024-01-01T00:00:00Z',
    },
    {
      userId: 'user-002',
      userName: 'Jane Doe',
      email: 'jane@example.com',
      role: 'admin',
      department: 'Engineering',
      joinedAt: '2024-01-15T00:00:00Z',
    },
    {
      userId: 'user-003',
      userName: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'member',
      department: 'Engineering',
      joinedAt: '2024-02-01T00:00:00Z',
    },
  ],
  workUnits: [
    {
      workUnitId: 'wu-001',
      workUnitName: 'Data Extraction Agent',
      workUnitType: 'atomic',
      trustStatus: 'valid',
      addedAt: '2024-01-10T00:00:00Z',
      addedBy: 'user-001',
      department: 'Engineering',
    },
    {
      workUnitId: 'wu-002',
      workUnitName: 'Invoice Processing Pipeline',
      workUnitType: 'composite',
      trustStatus: 'pending',
      addedAt: '2024-01-20T00:00:00Z',
      addedBy: 'user-001',
      department: 'Finance',
    },
  ],
  memberCount: 3,
  workUnitCount: 2,
  isArchived: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-02-15T00:00:00Z',
};

const mockTemporaryWorkspace: Workspace = {
  ...mockWorkspace,
  id: 'ws-002',
  name: 'Q1 Audit Prep',
  description: 'Temporary workspace for Q1 audit preparation',
  workspaceType: 'temporary',
  expiresAt: '2024-06-30T00:00:00Z',
};

const mockPersonalWorkspace: Workspace = {
  ...mockWorkspace,
  id: 'ws-003',
  name: 'My Favorites',
  description: 'Personal collection of frequently used work units',
  workspaceType: 'personal',
};

const mockEmptyWorkspace: Workspace = {
  ...mockWorkspace,
  id: 'ws-004',
  name: 'Empty Workspace',
  members: [],
  workUnits: [],
  memberCount: 0,
  workUnitCount: 0,
};

// Helper to create QueryClient for tests
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// Helper to render component with all providers
function setup(workspaceId: string = 'ws-001') {
  const user = userEvent.setup();
  const queryClient = createTestQueryClient();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/build/workspaces/${workspaceId}`]}>
        <Routes>
          <Route path="/build/workspaces/:id" element={<WorkspaceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { user, ...result };
}

describe('WorkspaceDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  describe('loading state', () => {
    it('shows loading skeleton while fetching workspace', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      setup();

      expect(screen.getByTestId('workspace-detail-skeleton')).toBeInTheDocument();
    });

    it('shows back button while loading', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      setup();

      expect(screen.getByRole('button', { name: /back to workspaces/i })).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load workspace'),
      });

      setup();

      expect(screen.getByText(/failed to load workspace/i)).toBeInTheDocument();
    });

    it('shows back button on error', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      });

      setup();

      expect(screen.getByRole('button', { name: /back to workspaces/i })).toBeInTheDocument();
    });
  });

  describe('successful data load', () => {
    beforeEach(() => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });
    });

    it('renders workspace detail page', () => {
      setup();

      expect(screen.getByTestId('workspace-detail-page')).toBeInTheDocument();
    });

    it('displays workspace name', () => {
      setup();

      expect(screen.getByRole('heading', { level: 1, name: /engineering workspace/i })).toBeInTheDocument();
    });

    it('displays workspace description', () => {
      setup();

      expect(screen.getByText(/main workspace for engineering team operations/i)).toBeInTheDocument();
    });

    it('displays workspace type badge', () => {
      setup();

      expect(screen.getByText('Permanent')).toBeInTheDocument();
    });

    it('displays work unit count', () => {
      setup();

      expect(screen.getByText('2')).toBeInTheDocument();
      // 'Work Units' appears in stats card and section heading
      expect(screen.getAllByText('Work Units').length).toBeGreaterThan(0);
    });

    it('displays member count', () => {
      setup();

      expect(screen.getByText('3')).toBeInTheDocument();
      // 'Members' appears in stats card and section heading
      expect(screen.getAllByText('Members').length).toBeGreaterThan(0);
    });

    it('displays owner name', () => {
      setup();

      // Owner name appears in multiple places (stats card and members list)
      expect(screen.getAllByText('John Smith').length).toBeGreaterThan(0);
    });
  });

  describe('workspace type variations', () => {
    it('displays temporary workspace with expiry badge', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockTemporaryWorkspace,
        isLoading: false,
        error: null,
      });

      setup('ws-002');

      expect(screen.getByText('Temporary')).toBeInTheDocument();
      expect(screen.getByTestId('expiry-badge')).toBeInTheDocument();
    });

    it('displays personal workspace without trust delegation section', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockPersonalWorkspace,
        isLoading: false,
        error: null,
      });

      setup('ws-003');

      expect(screen.getByText('Personal')).toBeInTheDocument();
      // Trust delegation section should not appear for personal workspaces
      expect(screen.queryByText(/trust delegation/i)).not.toBeInTheDocument();
    });

    it('displays trust delegation section for non-personal workspaces', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });

      setup();

      expect(screen.getByRole('heading', { name: /trust delegation/i })).toBeInTheDocument();
      expect(screen.getByText(/grants access to work units/i)).toBeInTheDocument();
    });
  });

  describe('work units list', () => {
    beforeEach(() => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });
    });

    it('displays work unit names', () => {
      setup();

      expect(screen.getByText('Data Extraction Agent')).toBeInTheDocument();
      expect(screen.getByText('Invoice Processing Pipeline')).toBeInTheDocument();
    });

    it('displays work unit types as badges', () => {
      setup();

      expect(screen.getByText('atomic')).toBeInTheDocument();
      expect(screen.getByText('composite')).toBeInTheDocument();
    });

    it('displays empty state when no work units', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockEmptyWorkspace,
        isLoading: false,
        error: null,
      });

      setup('ws-004');

      expect(screen.getByText(/no work units in this workspace/i)).toBeInTheDocument();
    });

    it('navigates to work unit detail on click', async () => {
      const { user } = setup();

      const workUnitRow = screen.getByTestId('work-unit-wu-001');
      await user.click(workUnitRow);

      expect(mockNavigate).toHaveBeenCalledWith('/build/work-units/wu-001');
    });
  });

  describe('members list', () => {
    beforeEach(() => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });
    });

    it('displays member names', () => {
      setup();

      // 'John Smith' appears in stats card (owner) and in members list
      const johnSmithElements = screen.getAllByText('John Smith');
      expect(johnSmithElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('displays member roles', () => {
      setup();

      // 'Owner' appears in stats card and member role badge
      const owners = screen.getAllByText('Owner');
      expect(owners.length).toBeGreaterThan(0);
      expect(screen.getByText('Admin')).toBeInTheDocument();
      // 'Member' may appear in "Members" heading and role badge
      const members = screen.getAllByText('Member');
      expect(members.length).toBeGreaterThan(0);
    });

    it('displays member departments', () => {
      setup();

      // All members are in Engineering department
      const departments = screen.getAllByText('Engineering');
      expect(departments.length).toBeGreaterThan(0);
    });

    it('displays member avatars with initials', () => {
      setup();

      expect(screen.getByText('JO')).toBeInTheDocument(); // John
      expect(screen.getByText('JA')).toBeInTheDocument(); // Jane
      expect(screen.getByText('BO')).toBeInTheDocument(); // Bob
    });

    it('displays empty state when no members', () => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockEmptyWorkspace,
        isLoading: false,
        error: null,
      });

      setup('ws-004');

      expect(screen.getByText(/no members in this workspace/i)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });
    });

    it('navigates back when back button is clicked', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /back to workspaces/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/build/workspaces');
    });

    it('navigates to edit page when edit button is clicked', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/build/workspaces/ws-001/edit');
    });
  });

  describe('action buttons (Level 2+)', () => {
    beforeEach(() => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });
    });

    it('shows edit button', () => {
      setup();

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('shows add work unit button', () => {
      setup();

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('shows invite member button', () => {
      setup();

      expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
    });
  });

  describe('dialog interactions', () => {
    beforeEach(() => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });
    });

    it('opens add work unit dialog when add button is clicked', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /add/i }));

      // Dialog should open - look for dialog title
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('opens invite member dialog when invite button is clicked', async () => {
      const { user } = setup();

      await user.click(screen.getByRole('button', { name: /invite/i }));

      // Dialog should open - look for dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      mockUseWorkspaceDetail.mockReturnValue({
        data: mockWorkspace,
        isLoading: false,
        error: null,
      });
    });

    it('has correct heading hierarchy', () => {
      setup();

      // h1 for workspace name
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('has accessible buttons with labels', () => {
      setup();

      expect(screen.getByRole('button', { name: /back to workspaces/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
    });

    it('has testids for work unit rows', () => {
      setup();

      expect(screen.getByTestId('work-unit-wu-001')).toBeInTheDocument();
      expect(screen.getByTestId('work-unit-wu-002')).toBeInTheDocument();
    });

    it('has testids for member rows', () => {
      setup();

      expect(screen.getByTestId('member-user-001')).toBeInTheDocument();
      expect(screen.getByTestId('member-user-002')).toBeInTheDocument();
      expect(screen.getByTestId('member-user-003')).toBeInTheDocument();
    });
  });
});
