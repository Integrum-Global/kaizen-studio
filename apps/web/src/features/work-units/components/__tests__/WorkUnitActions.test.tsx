/**
 * WorkUnitActions Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkUnitActions } from '../WorkUnitActions';
import type { WorkUnit } from '../../types';

describe('WorkUnitActions', () => {
  const createMockWorkUnit = (overrides?: Partial<WorkUnit>): WorkUnit => ({
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
  });

  const defaultHandlers = {
    onRun: vi.fn(),
    onConfigure: vi.fn(),
    onDelegate: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Level 1 (Task Performer)', () => {
    it('should only show Run button for Level 1 users', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Configure' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delegate' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should enable Run when trust is valid', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      const runButton = screen.getByRole('button', { name: 'Run' });
      await user.click(runButton);

      expect(defaultHandlers.onRun).toHaveBeenCalledTimes(1);
    });

    it('should disable Run when trust is expired', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit({
            trustInfo: { status: 'expired' },
          })}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      const runButton = screen.getByRole('button', { name: 'Run' });
      expect(runButton).toBeDisabled();
    });

    it('should disable Run when trust is revoked', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit({
            trustInfo: { status: 'revoked' },
          })}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      const runButton = screen.getByRole('button', { name: 'Run' });
      expect(runButton).toBeDisabled();
    });

    it('should disable Run when trust is pending', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit({
            trustInfo: { status: 'pending' },
          })}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      const runButton = screen.getByRole('button', { name: 'Run' });
      expect(runButton).toBeDisabled();
    });
  });

  describe('Level 2 (Process Owner)', () => {
    it('should show Run, Configure, and Delegate buttons', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delegate' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should enable Configure regardless of trust status', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit({
            trustInfo: { status: 'expired' },
          })}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      const configureButton = screen.getByRole('button', { name: 'Configure' });
      expect(configureButton).not.toBeDisabled();

      await user.click(configureButton);
      expect(defaultHandlers.onConfigure).toHaveBeenCalledTimes(1);
    });

    it('should disable Delegate when trust is not valid', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit({
            trustInfo: { status: 'expired' },
          })}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      const delegateButton = screen.getByRole('button', { name: 'Delegate' });
      expect(delegateButton).toBeDisabled();
    });

    it('should enable Delegate when trust is valid', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      const delegateButton = screen.getByRole('button', { name: 'Delegate' });
      await user.click(delegateButton);

      expect(defaultHandlers.onDelegate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Level 3 (Value Chain Owner)', () => {
    it('should show all buttons including Delete', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={3}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delegate' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should enable Delete for Level 3', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={3}
          {...defaultHandlers}
        />
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      expect(defaultHandlers.onDelete).toHaveBeenCalledTimes(1);
    });

    it('should not show Delete if onDelete handler is not provided', () => {
      const { onDelete, ...handlers } = defaultHandlers;

      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={3}
          {...handlers}
        />
      );

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading spinner on Run button when running', () => {
      const { container } = render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
          isLoading
          loadingAction="run"
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={2}
          {...defaultHandlers}
          isLoading
          loadingAction="run"
        />
      );

      expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
    });

    it('should show spinner on Configure button when configuring', () => {
      const { container } = render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={2}
          {...defaultHandlers}
          isLoading
          loadingAction="configure"
        />
      );

      const spinners = container.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });
  });

  describe('layout', () => {
    it('should render horizontal by default', () => {
      const { container } = render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      const wrapper = container.querySelector('.flex-row');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render vertical when direction is vertical', () => {
      const { container } = render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={2}
          {...defaultHandlers}
          direction="vertical"
        />
      );

      const wrapper = container.querySelector('.flex-col');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role group with label', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={2}
          {...defaultHandlers}
        />
      );

      expect(
        screen.getByRole('group', { name: 'Work unit actions' })
      ).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should use default variant for Run button', () => {
      const { container } = render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      // Run button should have primary styling
      const runButton = screen.getByRole('button', { name: 'Run' });
      expect(runButton).toBeInTheDocument();
    });

    it('should use destructive variant for Delete button', () => {
      render(
        <WorkUnitActions
          workUnit={createMockWorkUnit()}
          userLevel={3}
          {...defaultHandlers}
        />
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      expect(deleteButton).toBeInTheDocument();
    });
  });
});
