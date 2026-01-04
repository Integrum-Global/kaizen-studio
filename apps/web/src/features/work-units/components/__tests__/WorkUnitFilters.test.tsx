/**
 * WorkUnitFilters Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkUnitFilters } from '../WorkUnitFilters';
import type { WorkUnitFilters as FilterState, WorkspaceRef } from '../../types';

describe('WorkUnitFilters', () => {
  const mockOnFiltersChange = vi.fn();

  const mockWorkspaces: WorkspaceRef[] = [
    { id: 'ws-1', name: 'Finance', color: '#FF0000' },
    { id: 'ws-2', name: 'Marketing', color: '#00FF00' },
  ];

  const defaultProps = {
    filters: {} as FilterState,
    onFiltersChange: mockOnFiltersChange,
    workspaces: mockWorkspaces,
    showWorkspaceFilter: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search input', () => {
    it('should render search input', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search work units...')).toBeInTheDocument();
    });

    it('should display current search value', () => {
      render(<WorkUnitFilters {...defaultProps} filters={{ search: 'invoice' }} />);
      expect(screen.getByDisplayValue('invoice')).toBeInTheDocument();
    });

    it('should call onFiltersChange when search changes', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search work units...');
      await user.type(searchInput, 'test');

      // Should be called for each character
      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} filters={{ search: 'test' }} />);

      const searchInput = screen.getByDisplayValue('test');
      await user.clear(searchInput);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: undefined });
    });

    it('should have search icon', () => {
      const { container } = render(<WorkUnitFilters {...defaultProps} />);
      // Check for SVG (lucide icon)
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('type filter tabs', () => {
    it('should render type filter tabs', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByTestId('filter-type-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-type-atomic')).toBeInTheDocument();
      expect(screen.getByTestId('filter-type-composite')).toBeInTheDocument();
    });

    it('should show All tab as selected by default', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByTestId('filter-type-all')).toHaveAttribute('data-state', 'active');
    });

    it('should show Atomic tab as selected when filter is atomic', () => {
      render(<WorkUnitFilters {...defaultProps} filters={{ type: 'atomic' }} />);
      expect(screen.getByTestId('filter-type-atomic')).toHaveAttribute('data-state', 'active');
    });

    it('should show Composite tab as selected when filter is composite', () => {
      render(<WorkUnitFilters {...defaultProps} filters={{ type: 'composite' }} />);
      expect(screen.getByTestId('filter-type-composite')).toHaveAttribute('data-state', 'active');
    });

    it('should call onFiltersChange when type changes to atomic', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} />);

      await user.click(screen.getByTestId('filter-type-atomic'));
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ type: 'atomic' });
    });

    it('should call onFiltersChange when type changes to composite', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} />);

      await user.click(screen.getByTestId('filter-type-composite'));
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ type: 'composite' });
    });

    it('should clear type filter when All is selected', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} filters={{ type: 'atomic' }} />);

      await user.click(screen.getByTestId('filter-type-all'));
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ type: undefined });
    });
  });

  describe('trust status filter', () => {
    it('should render trust status filter', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByTestId('filter-trust-status')).toBeInTheDocument();
    });

    it('should show All Status as default', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByText('All Status')).toBeInTheDocument();
    });

    it('should call onFiltersChange when trust status changes', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} />);

      // Open the select
      await user.click(screen.getByTestId('filter-trust-status'));

      // Click Valid option
      await user.click(screen.getByText('Valid'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ trustStatus: 'valid' });
    });

    it('should display all trust status options', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} />);

      await user.click(screen.getByTestId('filter-trust-status'));

      // 'All Status' appears in both trigger and option, so use getAllByText
      expect(screen.getAllByText('All Status').length).toBeGreaterThanOrEqual(1);
      // Other options only appear once in the dropdown
      expect(screen.getByRole('option', { name: 'Valid' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Expired' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Revoked' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    });
  });

  describe('workspace filter', () => {
    it('should render workspace filter when showWorkspaceFilter is true', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByTestId('filter-workspace')).toBeInTheDocument();
    });

    it('should not render workspace filter when showWorkspaceFilter is false', () => {
      render(<WorkUnitFilters {...defaultProps} showWorkspaceFilter={false} />);
      expect(screen.queryByTestId('filter-workspace')).not.toBeInTheDocument();
    });

    it('should not render workspace filter when no workspaces', () => {
      render(<WorkUnitFilters {...defaultProps} workspaces={[]} />);
      expect(screen.queryByTestId('filter-workspace')).not.toBeInTheDocument();
    });

    it('should show All Workspaces as default', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByText('All Workspaces')).toBeInTheDocument();
    });

    it('should display workspace options', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} />);

      await user.click(screen.getByTestId('filter-workspace'));

      // 'All Workspaces' appears in both trigger and option, so use getAllByText
      expect(screen.getAllByText('All Workspaces').length).toBeGreaterThanOrEqual(1);
      // Workspace names only appear once in the dropdown
      expect(screen.getByRole('option', { name: 'Finance' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Marketing' })).toBeInTheDocument();
    });

    it('should call onFiltersChange when workspace changes', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} />);

      await user.click(screen.getByTestId('filter-workspace'));
      await user.click(screen.getByText('Finance'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ workspaceId: 'ws-1' });
    });

    it('should clear workspace filter when All Workspaces is selected', async () => {
      const user = userEvent.setup();
      render(<WorkUnitFilters {...defaultProps} filters={{ workspaceId: 'ws-1' }} />);

      await user.click(screen.getByTestId('filter-workspace'));
      await user.click(screen.getByText('All Workspaces'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({ workspaceId: undefined });
    });
  });

  describe('combined filters', () => {
    it('should preserve existing filters when changing one', async () => {
      const user = userEvent.setup();
      render(
        <WorkUnitFilters
          {...defaultProps}
          filters={{ search: 'test', type: 'atomic' }}
        />
      );

      await user.click(screen.getByTestId('filter-trust-status'));
      await user.click(screen.getByText('Valid'));

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'test',
        type: 'atomic',
        trustStatus: 'valid',
      });
    });
  });

  describe('responsive layout', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <WorkUnitFilters {...defaultProps} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should have proper structure for flex layout', () => {
      const { container } = render(<WorkUnitFilters {...defaultProps} />);
      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have searchable input type', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search work units...')).toHaveAttribute(
        'type',
        'search'
      );
    });

    it('should have data-testid attributes for testing', () => {
      render(<WorkUnitFilters {...defaultProps} />);
      expect(screen.getByTestId('work-unit-search')).toBeInTheDocument();
      expect(screen.getByTestId('filter-type-all')).toBeInTheDocument();
      expect(screen.getByTestId('filter-trust-status')).toBeInTheDocument();
      expect(screen.getByTestId('filter-workspace')).toBeInTheDocument();
    });
  });
});
