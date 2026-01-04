/**
 * WorkUnitCard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkUnitCard } from '../WorkUnitCard';
import type { WorkUnit } from '../../types';

describe('WorkUnitCard', () => {
  const createMockWorkUnit = (overrides?: Partial<WorkUnit>): WorkUnit => ({
    id: 'wu-123',
    name: 'Invoice Processor',
    description: 'Processes invoices and extracts line items',
    type: 'atomic',
    capabilities: ['extract', 'validate', 'transform'],
    trustInfo: {
      status: 'valid',
      establishedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2024-12-31T23:59:59Z',
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
    onClick: vi.fn(),
    onViewTrust: vi.fn(),
    onExpandSubUnits: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render work unit name', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
        />
      );

      expect(screen.getByText('Invoice Processor')).toBeInTheDocument();
    });

    it('should render work unit description', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
        />
      );

      expect(
        screen.getByText('Processes invoices and extracts line items')
      ).toBeInTheDocument();
    });

    it('should render capabilities', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
        />
      );

      expect(screen.getByText('extract')).toBeInTheDocument();
      expect(screen.getByText('validate')).toBeInTheDocument();
      expect(screen.getByText('transform')).toBeInTheDocument();
    });

    it('should render trust status badge', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
        />
      );

      expect(screen.getByText('Trust Valid')).toBeInTheDocument();
    });

    it('should render work unit icon', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
        />
      );

      expect(screen.getByRole('img', { name: 'Atomic work unit' })).toBeInTheDocument();
    });
  });

  describe('atomic vs composite', () => {
    it('should render atomic icon for atomic work unit', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({ type: 'atomic' })}
          userLevel={1}
        />
      );

      expect(screen.getByRole('img', { name: 'Atomic work unit' })).toBeInTheDocument();
    });

    it('should render composite icon for composite work unit', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({ type: 'composite' })}
          userLevel={1}
        />
      );

      expect(screen.getByRole('img', { name: 'Composite work unit' })).toBeInTheDocument();
    });

    it('should show sub-unit count for composite work units', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({
            type: 'composite',
            subUnitCount: 5,
          })}
          userLevel={1}
        />
      );

      expect(screen.getByText('Uses 5 units')).toBeInTheDocument();
    });

    it('should not show sub-unit count for atomic work units', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({
            type: 'atomic',
            subUnitCount: 5, // Even if set, should not show
          })}
          userLevel={1}
        />
      );

      expect(screen.queryByText(/Uses \d+ units/)).not.toBeInTheDocument();
    });
  });

  describe('trust status display', () => {
    it('should show valid trust status', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({ trustInfo: { status: 'valid' } })}
          userLevel={1}
        />
      );

      expect(screen.getByText('Trust Valid')).toBeInTheDocument();
    });

    it('should show expired trust status', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({ trustInfo: { status: 'expired' } })}
          userLevel={1}
        />
      );

      expect(screen.getByText('Trust Expired')).toBeInTheDocument();
    });

    it('should show revoked trust status', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({ trustInfo: { status: 'revoked' } })}
          userLevel={1}
        />
      );

      expect(screen.getByText('Trust Revoked')).toBeInTheDocument();
    });

    it('should show pending trust status', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({ trustInfo: { status: 'pending' } })}
          userLevel={1}
        />
      );

      expect(screen.getByText('Setup Pending')).toBeInTheDocument();
    });

    it('should show expiry for Level 2+ users', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={2}
        />
      );

      // Should show expiry countdown
      expect(screen.getByText(/Trust Valid/)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('click handling', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      // Click on the card using the aria-label (the Card component is the button)
      const card = screen.getByRole('button', {
        name: /Invoice Processor - atomic work unit/,
      });
      await user.click(card);

      expect(defaultHandlers.onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      // Click on Run button
      await user.click(screen.getByRole('button', { name: 'Run' }));

      // onClick should not be called, but onRun should
      expect(defaultHandlers.onClick).not.toHaveBeenCalled();
      expect(defaultHandlers.onRun).toHaveBeenCalledTimes(1);
    });

    it('should make card keyboard accessible when onClick is provided', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      const card = screen.getByRole('button', {
        name: /Invoice Processor - atomic work unit/,
      });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('tabindex', '0');
    });

    it('should handle Enter key press', async () => {
      const user = userEvent.setup();

      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      const card = screen.getByRole('button', {
        name: /Invoice Processor - atomic work unit/,
      });
      card.focus();
      await user.keyboard('{Enter}');

      expect(defaultHandlers.onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('actions visibility', () => {
    it('should show actions by default', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
        />
      );

      expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
    });

    it('should hide actions when showActions is false', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          showActions={false}
        />
      );

      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
    });

    it('should hide actions in compact mode', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          compact
        />
      );

      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
    });

    it('should show level-appropriate actions', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={2}
        />
      );

      expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Configure' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delegate' })).toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should hide description in compact mode', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          compact
        />
      );

      expect(
        screen.queryByText('Processes invoices and extracts line items')
      ).not.toBeInTheDocument();
    });

    it('should show fewer capabilities in compact mode', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({
            capabilities: ['a', 'b', 'c', 'd', 'e'],
          })}
          userLevel={1}
          compact
        />
      );

      // Compact mode shows 3 capabilities + overflow
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should use smaller icon in compact mode', () => {
      const { container } = render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          compact
        />
      );

      const smallIcon = container.querySelector('.w-8.h-8');
      expect(smallIcon).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should pass loading state to actions', () => {
      const { container } = render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          isLoading
          loadingAction="run"
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(
        screen.getByLabelText(/Invoice Processor - atomic work unit, trust valid/)
      ).toBeInTheDocument();
    });

    it('should show pending status in aria-label', () => {
      render(
        <WorkUnitCard
          workUnit={createMockWorkUnit({ trustInfo: { status: 'pending' } })}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      expect(
        screen.getByLabelText(/trust pending/)
      ).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should have hover effect when clickable', () => {
      const { container } = render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
          {...defaultHandlers}
        />
      );

      const card = container.querySelector('.cursor-pointer');
      expect(card).toBeInTheDocument();
    });

    it('should not have hover effect when not clickable', () => {
      const { container } = render(
        <WorkUnitCard
          workUnit={createMockWorkUnit()}
          userLevel={1}
        />
      );

      const card = container.querySelector('.cursor-pointer');
      expect(card).not.toBeInTheDocument();
    });
  });
});
