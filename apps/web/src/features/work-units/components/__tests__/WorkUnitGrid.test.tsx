/**
 * WorkUnitGrid Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkUnitGrid } from '../WorkUnitGrid';
import type { WorkUnit } from '../../types';

describe('WorkUnitGrid', () => {
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

  const createMockWorkUnits = (count: number): WorkUnit[] =>
    Array.from({ length: count }, (_, i) => createMockWorkUnit(`wu-${i + 1}`));

  const defaultHandlers = {
    onWorkUnitClick: vi.fn(),
    onRun: vi.fn(),
    onConfigure: vi.fn(),
    onDelegate: vi.fn(),
    onViewTrust: vi.fn(),
    onLoadMore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('should show empty state when no work units', () => {
      render(
        <WorkUnitGrid
          workUnits={[]}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('work-unit-empty-state')).toBeInTheDocument();
    });

    it('should show "No work units yet" message', () => {
      render(
        <WorkUnitGrid
          workUnits={[]}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('No work units yet')).toBeInTheDocument();
    });

    it('should show helpful description in empty state', () => {
      render(
        <WorkUnitGrid
          workUnits={[]}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(
        screen.getByText(/Work units will appear here once they are created/)
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading skeletons when loading and no items', () => {
      render(
        <WorkUnitGrid
          workUnits={[]}
          userLevel={1}
          isLoading={true}
          {...defaultHandlers}
        />
      );

      const skeletons = screen.getAllByTestId('work-unit-skeleton');
      expect(skeletons.length).toBe(6);
    });

    it('should not show loading skeletons when loading with existing items', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(3)}
          userLevel={1}
          isLoading={true}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('work-unit-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('grid display', () => {
    it('should render work unit cards', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(3)}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Work Unit wu-1')).toBeInTheDocument();
      expect(screen.getByText('Work Unit wu-2')).toBeInTheDocument();
      expect(screen.getByText('Work Unit wu-3')).toBeInTheDocument();
    });

    it('should have grid layout', () => {
      const { container } = render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(3)}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('should have list role for accessibility', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(3)}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      // The main grid has role='list' with aria-label
      expect(screen.getByRole('list', { name: 'Work units' })).toBeInTheDocument();
    });

    it('should have list items for each work unit', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(3)}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      // Get only direct children with role="listitem" from the main grid
      // Using :scope > selector to avoid matching nested listitems in CapabilityTags
      const mainList = screen.getByRole('list', { name: 'Work units' });
      const listItems = mainList.querySelectorAll(':scope > [role="listitem"]');
      expect(listItems).toHaveLength(3);
    });
  });

  describe('click handlers', () => {
    it('should call onWorkUnitClick when card is clicked', async () => {
      const user = userEvent.setup();
      const workUnits = createMockWorkUnits(1);

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      // Click on the card title area
      const card = screen.getByRole('button', { name: /Work Unit wu-1/ });
      await user.click(card);

      expect(defaultHandlers.onWorkUnitClick).toHaveBeenCalledWith(workUnits[0]);
    });

    it('should call onRun when Run button is clicked', async () => {
      const user = userEvent.setup();
      const workUnits = createMockWorkUnits(1);

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Run' }));
      expect(defaultHandlers.onRun).toHaveBeenCalledWith(workUnits[0]);
    });

    it('should call onConfigure when Configure button is clicked', async () => {
      const user = userEvent.setup();
      const workUnits = createMockWorkUnits(1);

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Configure' }));
      expect(defaultHandlers.onConfigure).toHaveBeenCalledWith(workUnits[0]);
    });

    it('should call onDelegate when Delegate button is clicked', async () => {
      const user = userEvent.setup();
      const workUnits = createMockWorkUnits(1);

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Delegate' }));
      expect(defaultHandlers.onDelegate).toHaveBeenCalledWith(workUnits[0]);
    });
  });

  describe('loading state for individual items', () => {
    it('should show loading indicator on specific work unit', () => {
      const workUnits = createMockWorkUnits(2);

      const { container } = render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={1}
          loadingWorkUnitId="wu-1"
          loadingAction="run"
          {...defaultHandlers}
        />
      );

      // Should have loading spinner on the first card
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('count display', () => {
    it('should show count of displayed items', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Showing 5 work units')).toBeInTheDocument();
    });

    it('should show total count when available', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          total={25}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Showing 5 of 25 work units')).toBeInTheDocument();
    });

    it('should not show total when equal to displayed', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          total={5}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Showing 5 work units')).toBeInTheDocument();
    });
  });

  describe('load more', () => {
    it('should show Load More button when hasMore is true', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          hasMore={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
    });

    it('should not show Load More button when hasMore is false', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          hasMore={false}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
    });

    it('should not show Load More when no onLoadMore handler', () => {
      const { onLoadMore, ...handlers } = defaultHandlers;

      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          hasMore={true}
          {...handlers}
        />
      );

      expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
    });

    it('should call onLoadMore when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          hasMore={true}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('load-more-button'));
      expect(defaultHandlers.onLoadMore).toHaveBeenCalled();
    });

    it('should disable Load More when loading', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          hasMore={true}
          isLoading={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('load-more-button')).toBeDisabled();
    });

    it('should show loading text when loading more', () => {
      render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(5)}
          userLevel={1}
          hasMore={true}
          isLoading={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <WorkUnitGrid
          workUnits={createMockWorkUnits(1)}
          userLevel={1}
          className="custom-class"
          {...defaultHandlers}
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('different work unit types', () => {
    it('should render atomic work units', () => {
      const workUnits = [createMockWorkUnit('wu-1', { type: 'atomic' })];

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('img', { name: 'Atomic work unit' })).toBeInTheDocument();
    });

    it('should render composite work units', () => {
      const workUnits = [createMockWorkUnit('wu-1', { type: 'composite', subUnitCount: 3 })];

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('img', { name: 'Composite work unit' })).toBeInTheDocument();
      expect(screen.getByText('Uses 3 units')).toBeInTheDocument();
    });
  });

  describe('trust status display', () => {
    it('should show valid trust status', () => {
      const workUnits = [createMockWorkUnit('wu-1', { trustInfo: { status: 'valid' } })];

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Trust Valid')).toBeInTheDocument();
    });

    it('should show expired trust status', () => {
      const workUnits = [createMockWorkUnit('wu-1', { trustInfo: { status: 'expired' } })];

      render(
        <WorkUnitGrid
          workUnits={workUnits}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Trust Expired')).toBeInTheDocument();
    });
  });
});
