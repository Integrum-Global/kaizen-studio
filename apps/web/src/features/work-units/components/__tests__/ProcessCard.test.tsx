/**
 * ProcessCard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProcessCard } from '../ProcessCard';
import type { SubUnit, TrustStatus } from '../../types';

describe('ProcessCard', () => {
  const createMockSubUnit = (overrides?: Partial<SubUnit>): SubUnit => ({
    id: `unit-${Math.random().toString(36).slice(2)}`,
    name: 'Data Extraction',
    type: 'atomic',
    trustStatus: 'valid',
    position: 0,
    ...overrides,
  });

  interface MockProcess {
    id: string;
    name: string;
    description?: string;
    subUnits?: SubUnit[];
    delegatedBy?: { id: string; name: string };
    teamSize?: number;
    runsToday?: number;
    errorsToday?: number;
    trustInfo?: { status: TrustStatus; expiresAt?: string };
  }

  const createMockProcess = (overrides?: Partial<MockProcess>): MockProcess => ({
    id: 'process-123',
    name: 'Invoice Processing',
    description: 'End-to-end invoice processing workflow',
    subUnits: [
      createMockSubUnit({ id: 'unit-1', name: 'Extract', position: 0 }),
      createMockSubUnit({ id: 'unit-2', name: 'Validate', position: 1 }),
      createMockSubUnit({ id: 'unit-3', name: 'Store', position: 2 }),
    ],
    delegatedBy: { id: 'user-1', name: 'Alice Manager' },
    teamSize: 5,
    runsToday: 42,
    errorsToday: 2,
    trustInfo: { status: 'valid', expiresAt: '2024-12-31T23:59:59Z' },
    ...overrides,
  });

  const defaultHandlers = {
    onConfigure: vi.fn(),
    onDelegate: vi.fn(),
    onViewRuns: vi.fn(),
    onAudit: vi.fn(),
    onRun: vi.fn(),
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render process name', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Invoice Processing')).toBeInTheDocument();
    });

    it('should render process description', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('End-to-end invoice processing workflow')).toBeInTheDocument();
    });

    it('should render with test id', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-card')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
          className="custom-process-card"
        />
      );

      expect(container.querySelector('.custom-process-card')).toBeInTheDocument();
    });

    it('should not render description if not provided', () => {
      render(
        <ProcessCard
          process={createMockProcess({ description: undefined })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByText('End-to-end invoice processing workflow')).not.toBeInTheDocument();
    });
  });

  describe('flow preview', () => {
    it('should render flow preview section when sub-units exist', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-flow-section')).toBeInTheDocument();
    });

    it('should display sub-unit names in flow', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Extract')).toBeInTheDocument();
      expect(screen.getByText('Validate')).toBeInTheDocument();
      expect(screen.getByText('Store')).toBeInTheDocument();
    });

    it('should not render flow section when no sub-units', () => {
      render(
        <ProcessCard
          process={createMockProcess({ subUnits: [] })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('process-flow-section')).not.toBeInTheDocument();
    });

    it('should not render flow section when sub-units undefined', () => {
      render(
        <ProcessCard
          process={createMockProcess({ subUnits: undefined })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('process-flow-section')).not.toBeInTheDocument();
    });
  });

  describe('trust status', () => {
    it('should show valid trust status', () => {
      render(
        <ProcessCard
          process={createMockProcess({ trustInfo: { status: 'valid' } })}
          {...defaultHandlers}
        />
      );

      // ProcessCard uses size="sm" which shows shortLabel
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('should show expired trust status', () => {
      render(
        <ProcessCard
          process={createMockProcess({ trustInfo: { status: 'expired' } })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should show revoked trust status', () => {
      render(
        <ProcessCard
          process={createMockProcess({ trustInfo: { status: 'revoked' } })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Revoked')).toBeInTheDocument();
    });

    it('should show pending when no trust info', () => {
      render(
        <ProcessCard
          process={createMockProcess({ trustInfo: undefined })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('delegation info', () => {
    it('should show delegation info when delegatedBy is present', () => {
      render(
        <ProcessCard
          process={createMockProcess({ delegatedBy: { id: 'user-1', name: 'Bob Admin' } })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText(/Valid from Bob Admin/)).toBeInTheDocument();
    });

    it('should show "No delegation" when not delegated', () => {
      render(
        <ProcessCard
          process={createMockProcess({ delegatedBy: undefined })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('No delegation')).toBeInTheDocument();
    });
  });

  describe('team size', () => {
    it('should display team size', () => {
      render(
        <ProcessCard
          process={createMockProcess({ teamSize: 8 })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should not show team size when undefined', () => {
      const { container } = render(
        <ProcessCard
          process={createMockProcess({ teamSize: undefined })}
          {...defaultHandlers}
        />
      );

      // Users icon should not be present
      const teamSection = container.querySelector('[class*="lucide-users"]');
      expect(teamSection).not.toBeInTheDocument();
    });
  });

  describe('activity stats', () => {
    it('should display runs today', () => {
      render(
        <ProcessCard
          process={createMockProcess({ runsToday: 42 })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should display errors today when > 0', () => {
      const { container } = render(
        <ProcessCard
          process={createMockProcess({ errorsToday: 5, teamSize: 0 })}
          {...defaultHandlers}
        />
      );

      // Error count shows with red text (text-red-600)
      const errorStats = container.querySelectorAll('.text-red-600');
      expect(errorStats.length).toBeGreaterThan(0);
      // One of them should contain '5'
      const errorValue = Array.from(errorStats).find(
        (el) => el.textContent?.includes('5')
      );
      expect(errorValue).toBeInTheDocument();
    });

    it('should not display error count when 0', () => {
      const { container } = render(
        <ProcessCard
          process={createMockProcess({ errorsToday: 0 })}
          {...defaultHandlers}
        />
      );

      // Should only have 1 stat badge (runs), not 2
      const alertIcons = container.querySelectorAll('[class*="lucide-alert-circle"]');
      expect(alertIcons).toHaveLength(0);
    });

    it('should show step count badge', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('3 steps')).toBeInTheDocument();
    });

    it('should use singular "step" for 1 sub-unit', () => {
      render(
        <ProcessCard
          process={createMockProcess({
            subUnits: [createMockSubUnit()],
          })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('1 step')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should render Run button when onRun is provided', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-run-btn')).toBeInTheDocument();
    });

    it('should not render Run button when onRun is not provided', () => {
      const { onRun: _onRun, ...handlers } = defaultHandlers;
      render(
        <ProcessCard
          process={createMockProcess()}
          {...handlers}
        />
      );

      expect(screen.queryByTestId('process-run-btn')).not.toBeInTheDocument();
    });

    it('should render Configure button', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-configure-btn')).toBeInTheDocument();
    });

    it('should render Delegate button', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-delegate-btn')).toBeInTheDocument();
    });

    it('should render View Runs button', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-runs-btn')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call onRun when Run button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('process-run-btn'));
      expect(defaultHandlers.onRun).toHaveBeenCalledTimes(1);
    });

    it('should call onConfigure when Configure is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('process-configure-btn'));
      expect(defaultHandlers.onConfigure).toHaveBeenCalledTimes(1);
    });

    it('should call onDelegate when Delegate is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('process-delegate-btn'));
      expect(defaultHandlers.onDelegate).toHaveBeenCalledTimes(1);
    });

    it('should call onViewRuns when View Runs is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('process-runs-btn'));
      expect(defaultHandlers.onViewRuns).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('process-card'));
      expect(defaultHandlers.onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('process-configure-btn'));
      expect(defaultHandlers.onClick).not.toHaveBeenCalled();
    });
  });

  describe('button disabled states', () => {
    it('should disable Run button when trust is not valid', () => {
      render(
        <ProcessCard
          process={createMockProcess({ trustInfo: { status: 'expired' } })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-run-btn')).toBeDisabled();
    });

    it('should disable Run button when loading', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
          isLoading
        />
      );

      expect(screen.getByTestId('process-run-btn')).toBeDisabled();
    });

    it('should enable Run button when trust is valid and not loading', () => {
      render(
        <ProcessCard
          process={createMockProcess({ trustInfo: { status: 'valid' } })}
          {...defaultHandlers}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('process-run-btn')).not.toBeDisabled();
    });

    it('should disable Delegate button when trust is not valid', () => {
      render(
        <ProcessCard
          process={createMockProcess({ trustInfo: { status: 'pending' } })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('process-delegate-btn')).toBeDisabled();
    });
  });

  describe('click behavior', () => {
    it('should have cursor-pointer when onClick is provided', () => {
      const { container } = render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });

    it('should not have cursor-pointer when onClick is not provided', () => {
      const { onClick: _onClick, ...handlers } = defaultHandlers;
      const { container } = render(
        <ProcessCard
          process={createMockProcess()}
          {...handlers}
        />
      );

      expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument();
    });
  });

  describe('icon display', () => {
    it('should render composite work unit icon', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('img', { name: 'Composite work unit' })).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply hover shadow when clickable', () => {
      const { container } = render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      expect(container.querySelector('.hover\\:shadow-md')).toBeInTheDocument();
    });

    it('should have proper card structure', () => {
      render(
        <ProcessCard
          process={createMockProcess()}
          {...defaultHandlers}
        />
      );

      const card = screen.getByTestId('process-card');
      expect(card).toHaveClass('overflow-hidden');
      expect(card).toHaveClass('transition-all');
    });
  });

  describe('edge cases', () => {
    it('should handle 0 runs today', () => {
      render(
        <ProcessCard
          process={createMockProcess({ runsToday: 0 })}
          {...defaultHandlers}
        />
      );

      // Should display 0 runs
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle undefined runsToday', () => {
      render(
        <ProcessCard
          process={createMockProcess({ runsToday: undefined })}
          {...defaultHandlers}
        />
      );

      // Should display 0 as fallback
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle empty sub-units array', () => {
      render(
        <ProcessCard
          process={createMockProcess({ subUnits: [] })}
          {...defaultHandlers}
        />
      );

      // Should not crash and flow section should not be rendered
      expect(screen.queryByTestId('process-flow-section')).not.toBeInTheDocument();
      // Step badge should not be rendered
      expect(screen.queryByText(/\d+ steps?/)).not.toBeInTheDocument();
    });
  });
});
