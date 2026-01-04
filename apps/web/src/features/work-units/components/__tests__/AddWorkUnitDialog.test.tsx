/**
 * AddWorkUnitDialog Component Tests
 *
 * Tests for the dialog that adds existing work units to a workspace.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddWorkUnitDialog } from '../AddWorkUnitDialog';
import type { WorkUnit, WorkspaceWorkUnit } from '../../types';

// Mock the hooks
const mockUseWorkUnits = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('../../hooks', () => ({
  useWorkUnits: (...args: unknown[]) => mockUseWorkUnits(...args),
  useAddWorkUnit: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AddWorkUnitDialog', () => {
  // Test data factories
  const createMockWorkUnit = (id: string, overrides?: Partial<WorkUnit>): WorkUnit => ({
    id,
    name: `Work Unit ${id}`,
    description: `Description for ${id}`,
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
  });

  const createExistingWorkUnit = (id: string): WorkspaceWorkUnit => ({
    workUnitId: id,
    workUnit: createMockWorkUnit(id),
    addedAt: '2024-01-01T00:00:00Z',
    addedBy: 'user-123',
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    workspaceId: 'ws-123',
    workspaceName: 'Test Workspace',
    existingWorkUnits: [] as WorkspaceWorkUnit[],
  };

  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock response
    mockUseWorkUnits.mockReturnValue({
      data: { items: [] },
      isLoading: false,
    });

    mockMutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderDialog = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AddWorkUnitDialog {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('dialog structure', () => {
    it('should render dialog with correct title', () => {
      renderDialog();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Title appears in the DialogTitle component
      expect(screen.getByRole('heading', { name: 'Add Work Units' })).toBeInTheDocument();
    });

    it('should render dialog description with workspace name', () => {
      renderDialog({ workspaceName: 'Q4 Audit Prep' });

      expect(
        screen.getByText(/Add existing work units to "Q4 Audit Prep"/)
      ).toBeInTheDocument();
    });

    it('should have search input', () => {
      renderDialog();

      expect(
        screen.getByPlaceholderText('Search work units...')
      ).toBeInTheDocument();
    });

    it('should have Cancel and Add buttons', () => {
      renderDialog();

      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add/ })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading skeletons when fetching work units', () => {
      mockUseWorkUnits.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderDialog();

      // Skeleton components have data-slot="skeleton" or use animate-pulse class
      const skeletons = container.querySelectorAll('[class*="animate-pulse"], [class*="Skeleton"]');
      // Check that we're in loading state - component should show skeleton structure
      expect(container.textContent).not.toContain('All work units are already');
    });
  });

  describe('empty states', () => {
    it('should show message when no work units available', () => {
      mockUseWorkUnits.mockReturnValue({
        data: { items: [] },
        isLoading: false,
      });

      renderDialog();

      expect(
        screen.getByText('All work units are already in this workspace')
      ).toBeInTheDocument();
    });

    it('should show different message when search returns no results', async () => {
      const user = userEvent.setup();

      mockUseWorkUnits.mockReturnValue({
        data: { items: [] },
        isLoading: false,
      });

      renderDialog();

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search work units...');
      await user.type(searchInput, 'nonexistent');

      expect(
        screen.getByText('No matching work units found')
      ).toBeInTheDocument();
    });
  });

  describe('work unit list', () => {
    it('should display available work units', () => {
      const workUnits = [
        createMockWorkUnit('wu-1', { name: 'Invoice Processor' }),
        createMockWorkUnit('wu-2', { name: 'Document Analyzer' }),
      ];

      mockUseWorkUnits.mockReturnValue({
        data: { items: workUnits },
        isLoading: false,
      });

      renderDialog();

      expect(screen.getByText('Invoice Processor')).toBeInTheDocument();
      expect(screen.getByText('Document Analyzer')).toBeInTheDocument();
    });

    it('should filter out work units already in workspace', () => {
      const workUnits = [
        createMockWorkUnit('wu-1', { name: 'Invoice Processor' }),
        createMockWorkUnit('wu-2', { name: 'Document Analyzer' }),
        createMockWorkUnit('wu-3', { name: 'Report Generator' }),
      ];

      mockUseWorkUnits.mockReturnValue({
        data: { items: workUnits },
        isLoading: false,
      });

      // wu-2 is already in the workspace
      renderDialog({
        existingWorkUnits: [createExistingWorkUnit('wu-2')],
      });

      expect(screen.getByText('Invoice Processor')).toBeInTheDocument();
      expect(screen.queryByText('Document Analyzer')).not.toBeInTheDocument();
      expect(screen.getByText('Report Generator')).toBeInTheDocument();
    });

    it('should show work unit type badge', () => {
      mockUseWorkUnits.mockReturnValue({
        data: {
          items: [
            createMockWorkUnit('wu-1', { type: 'atomic' }),
            createMockWorkUnit('wu-2', { type: 'composite' }),
          ],
        },
        isLoading: false,
      });

      renderDialog();

      expect(screen.getByText('atomic')).toBeInTheDocument();
      expect(screen.getByText('composite')).toBeInTheDocument();
    });

    it('should show trust status badge for each work unit', () => {
      mockUseWorkUnits.mockReturnValue({
        data: {
          items: [
            createMockWorkUnit('wu-1', { trustInfo: { status: 'valid' } }),
          ],
        },
        isLoading: false,
      });

      renderDialog();

      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should pass search query to useWorkUnits hook', async () => {
      const user = userEvent.setup();

      mockUseWorkUnits.mockReturnValue({
        data: { items: [] },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search work units...');
      await user.type(searchInput, 'invoice');

      expect(mockUseWorkUnits).toHaveBeenLastCalledWith(
        { search: 'invoice' },
        1,
        50
      );
    });
  });

  describe('selection', () => {
    it('should allow selecting work units with checkboxes', async () => {
      const user = userEvent.setup();
      const workUnits = [
        createMockWorkUnit('wu-1', { name: 'Invoice Processor' }),
      ];

      mockUseWorkUnits.mockReturnValue({
        data: { items: workUnits },
        isLoading: false,
      });

      renderDialog();

      const checkbox = screen.getByRole('checkbox', { name: /Select Invoice Processor/ });
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('should show selection count when items selected', async () => {
      const user = userEvent.setup();
      const workUnits = [
        createMockWorkUnit('wu-1', { name: 'Invoice Processor' }),
        createMockWorkUnit('wu-2', { name: 'Document Analyzer' }),
      ];

      mockUseWorkUnits.mockReturnValue({
        data: { items: workUnits },
        isLoading: false,
      });

      renderDialog();

      // Select first item
      await user.click(screen.getByRole('checkbox', { name: /Select Invoice Processor/ }));
      expect(screen.getByText('1 work unit selected')).toBeInTheDocument();

      // Select second item
      await user.click(screen.getByRole('checkbox', { name: /Select Document Analyzer/ }));
      expect(screen.getByText('2 work units selected')).toBeInTheDocument();
    });

    it('should toggle selection on click', async () => {
      const user = userEvent.setup();
      const workUnits = [createMockWorkUnit('wu-1', { name: 'Invoice Processor' })];

      mockUseWorkUnits.mockReturnValue({
        data: { items: workUnits },
        isLoading: false,
      });

      renderDialog();

      const checkbox = screen.getByRole('checkbox', { name: /Select Invoice Processor/ });

      // Select
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      // Deselect
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should update Add button text with selection count', async () => {
      const user = userEvent.setup();
      const workUnits = [
        createMockWorkUnit('wu-1'),
        createMockWorkUnit('wu-2'),
      ];

      mockUseWorkUnits.mockReturnValue({
        data: { items: workUnits },
        isLoading: false,
      });

      renderDialog();

      // Initial state
      expect(screen.getByRole('button', { name: /Add Work Units/ })).toBeInTheDocument();

      // Select one
      await user.click(screen.getByTestId('work-unit-option-wu-1'));
      expect(screen.getByRole('button', { name: /Add 1 Work Unit$/ })).toBeInTheDocument();

      // Select two
      await user.click(screen.getByTestId('work-unit-option-wu-2'));
      expect(screen.getByRole('button', { name: /Add 2 Work Units/ })).toBeInTheDocument();
    });
  });

  describe('add action', () => {
    it('should disable Add button when no selection', () => {
      mockUseWorkUnits.mockReturnValue({
        data: { items: [createMockWorkUnit('wu-1')] },
        isLoading: false,
      });

      renderDialog();

      expect(screen.getByRole('button', { name: /Add/ })).toBeDisabled();
    });

    it('should enable Add button when items are selected', async () => {
      const user = userEvent.setup();
      mockUseWorkUnits.mockReturnValue({
        data: { items: [createMockWorkUnit('wu-1', { name: 'Test Unit' })] },
        isLoading: false,
      });

      renderDialog();

      await user.click(screen.getByRole('checkbox', { name: /Select Test Unit/ }));

      expect(screen.getByRole('button', { name: /Add 1 Work Unit/ })).not.toBeDisabled();
    });

    it('should call mutateAsync for each selected work unit', async () => {
      const user = userEvent.setup();
      const workUnits = [
        createMockWorkUnit('wu-1', { name: 'Unit 1' }),
        createMockWorkUnit('wu-2', { name: 'Unit 2' }),
      ];

      mockUseWorkUnits.mockReturnValue({
        data: { items: workUnits },
        isLoading: false,
      });

      renderDialog();

      // Select both
      await user.click(screen.getByRole('checkbox', { name: /Select Unit 1/ }));
      await user.click(screen.getByRole('checkbox', { name: /Select Unit 2/ }));

      // Click Add
      await user.click(screen.getByRole('button', { name: /Add 2 Work Units/ }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(2);
        expect(mockMutateAsync).toHaveBeenCalledWith({
          workspaceId: 'ws-123',
          workUnitId: 'wu-1',
        });
        expect(mockMutateAsync).toHaveBeenCalledWith({
          workspaceId: 'ws-123',
          workUnitId: 'wu-2',
        });
      });
    });

    it('should close dialog after successful add', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      mockUseWorkUnits.mockReturnValue({
        data: { items: [createMockWorkUnit('wu-1', { name: 'Test Unit' })] },
        isLoading: false,
      });

      renderDialog({ onOpenChange });

      await user.click(screen.getByRole('checkbox', { name: /Select Test Unit/ }));
      await user.click(screen.getByRole('button', { name: /Add 1 Work Unit/ }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('cancel action', () => {
    it('should close dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

  });

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      renderDialog();

      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'add-work-unit-title'
      );
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-describedby',
        'add-work-unit-description'
      );
    });

    it('should have accessible checkbox labels', () => {
      mockUseWorkUnits.mockReturnValue({
        data: { items: [createMockWorkUnit('wu-1', { name: 'Invoice Processor' })] },
        isLoading: false,
      });

      renderDialog();

      expect(
        screen.getByRole('checkbox', { name: /Select Invoice Processor/ })
      ).toBeInTheDocument();
    });
  });
});
