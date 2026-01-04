/**
 * ProcessFlowPreview Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProcessFlowPreview } from '../ProcessFlowPreview';
import type { SubUnit, TrustStatus } from '../../types';

describe('ProcessFlowPreview', () => {
  const createMockSubUnit = (overrides?: Partial<SubUnit>): SubUnit => ({
    id: `unit-${Math.random().toString(36).slice(2)}`,
    name: 'Data Extraction',
    type: 'atomic',
    trustStatus: 'valid',
    position: 0,
    ...overrides,
  });

  const createSubUnits = (count: number, trustStatus: TrustStatus = 'valid'): SubUnit[] =>
    Array.from({ length: count }, (_, i) =>
      createMockSubUnit({
        id: `unit-${i}`,
        name: `Step ${i + 1}`,
        position: i,
        trustStatus,
      })
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('empty state', () => {
    it('should show empty message when no sub-units', () => {
      render(<ProcessFlowPreview subUnits={[]} />);
      expect(screen.getByText('No sub-units defined')).toBeInTheDocument();
    });

    it('should show empty message when subUnits is undefined', () => {
      render(<ProcessFlowPreview subUnits={undefined as unknown as SubUnit[]} />);
      expect(screen.getByText('No sub-units defined')).toBeInTheDocument();
    });

    it('should apply custom className to empty state', () => {
      const { container } = render(
        <ProcessFlowPreview subUnits={[]} className="custom-empty-class" />
      );
      expect(container.querySelector('.custom-empty-class')).toBeInTheDocument();
    });
  });

  describe('basic rendering', () => {
    it('should render all sub-units up to maxNodes', () => {
      const subUnits = createSubUnits(3);
      render(<ProcessFlowPreview subUnits={subUnits} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('should render flow container with test id', () => {
      render(<ProcessFlowPreview subUnits={createSubUnits(2)} />);
      expect(screen.getByTestId('process-flow-preview')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ProcessFlowPreview subUnits={createSubUnits(2)} className="custom-flow" />
      );
      expect(container.querySelector('.custom-flow')).toBeInTheDocument();
    });
  });

  describe('trust status indicators', () => {
    it('should show valid trust indicator', () => {
      render(<ProcessFlowPreview subUnits={[createMockSubUnit({ trustStatus: 'valid' })]} />);
      const node = screen.getByRole('button');
      expect(node).toHaveClass('bg-green-50');
    });

    it('should show expired trust indicator', () => {
      render(<ProcessFlowPreview subUnits={[createMockSubUnit({ trustStatus: 'expired' })]} />);
      const node = screen.getByRole('button');
      expect(node).toHaveClass('bg-amber-50');
    });

    it('should show revoked trust indicator', () => {
      render(<ProcessFlowPreview subUnits={[createMockSubUnit({ trustStatus: 'revoked' })]} />);
      const node = screen.getByRole('button');
      expect(node).toHaveClass('bg-red-50');
    });

    it('should show pending trust indicator', () => {
      render(<ProcessFlowPreview subUnits={[createMockSubUnit({ trustStatus: 'pending' })]} />);
      const node = screen.getByRole('button');
      expect(node).toHaveClass('bg-gray-50');
    });
  });

  describe('max nodes and ellipsis', () => {
    it('should show ellipsis when more than maxNodes', () => {
      const subUnits = createSubUnits(6);
      render(<ProcessFlowPreview subUnits={subUnits} maxNodes={4} />);

      // Should show 4 visible nodes
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
      expect(screen.getByText('Step 4')).toBeInTheDocument();

      // Should NOT show remaining nodes
      expect(screen.queryByText('Step 5')).not.toBeInTheDocument();
      expect(screen.queryByText('Step 6')).not.toBeInTheDocument();

      // Should show ellipsis with count
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should respect custom maxNodes value', () => {
      const subUnits = createSubUnits(5);
      render(<ProcessFlowPreview subUnits={subUnits} maxNodes={2} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.queryByText('Step 3')).not.toBeInTheDocument();
      expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('should not show ellipsis when nodes equal maxNodes', () => {
      const subUnits = createSubUnits(4);
      render(<ProcessFlowPreview subUnits={subUnits} maxNodes={4} />);

      expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
    });

    it('should not show ellipsis when fewer than maxNodes', () => {
      const subUnits = createSubUnits(2);
      render(<ProcessFlowPreview subUnits={subUnits} maxNodes={4} />);

      expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
    });
  });

  describe('compact mode', () => {
    it('should apply compact styling', () => {
      const { container } = render(
        <ProcessFlowPreview subUnits={createSubUnits(2)} compact />
      );

      // Compact mode uses smaller gap
      expect(container.querySelector('.gap-1\\.5')).toBeInTheDocument();
    });

    it('should use smaller node styling in compact mode', () => {
      render(
        <ProcessFlowPreview subUnits={[createMockSubUnit()]} compact />
      );

      const node = screen.getByRole('button');
      expect(node).toHaveClass('px-2');
      expect(node).toHaveClass('py-1.5');
    });

    it('should use larger node styling in normal mode', () => {
      render(
        <ProcessFlowPreview subUnits={[createMockSubUnit()]} compact={false} />
      );

      const node = screen.getByRole('button');
      expect(node).toHaveClass('px-3');
      expect(node).toHaveClass('py-2');
    });
  });

  describe('click handling', () => {
    it('should call onSubUnitClick when node is clicked', async () => {
      const user = userEvent.setup();
      const onSubUnitClick = vi.fn();
      const subUnit = createMockSubUnit({ id: 'test-unit', name: 'Test Step' });

      render(
        <ProcessFlowPreview
          subUnits={[subUnit]}
          onSubUnitClick={onSubUnitClick}
        />
      );

      await user.click(screen.getByRole('button'));
      expect(onSubUnitClick).toHaveBeenCalledWith(subUnit);
    });

    it('should call onSubUnitClick with correct sub-unit', async () => {
      const user = userEvent.setup();
      const onSubUnitClick = vi.fn();
      const subUnits = createSubUnits(3);

      render(
        <ProcessFlowPreview
          subUnits={subUnits}
          onSubUnitClick={onSubUnitClick}
        />
      );

      await user.click(screen.getByText('Step 2'));
      expect(onSubUnitClick).toHaveBeenCalledWith(subUnits[1]);
    });

    it('should not have cursor-pointer when onSubUnitClick is not provided', () => {
      render(<ProcessFlowPreview subUnits={[createMockSubUnit()]} />);
      const node = screen.getByRole('button');
      expect(node).not.toHaveClass('cursor-pointer');
    });
  });

  describe('tooltips', () => {
    it('should render node with tooltip trigger', () => {
      render(<ProcessFlowPreview subUnits={[createMockSubUnit({ name: 'Extract Data' })]} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should show ellipsis tooltip with correct count', async () => {
      const user = userEvent.setup();
      const subUnits = createSubUnits(6);
      render(<ProcessFlowPreview subUnits={subUnits} maxNodes={4} />);

      // Hover over ellipsis to trigger tooltip
      const ellipsis = screen.getByText('+2');
      await user.hover(ellipsis);

      // Tooltip should be visible (async) - use findByRole for better accessibility
      const tooltip = await screen.findByRole('tooltip', { hidden: true });
      expect(tooltip).toHaveTextContent('2 more steps');
    });

    it('should use singular form for 1 more step', async () => {
      const user = userEvent.setup();
      const subUnits = createSubUnits(5);
      render(<ProcessFlowPreview subUnits={subUnits} maxNodes={4} />);

      await user.hover(screen.getByText('+1'));
      const tooltip = await screen.findByRole('tooltip', { hidden: true });
      expect(tooltip).toHaveTextContent('1 more step');
    });
  });

  describe('flow arrows', () => {
    it('should render arrows between nodes', () => {
      const { container } = render(
        <ProcessFlowPreview subUnits={createSubUnits(3)} />
      );

      // Should have 2 arrows for 3 nodes
      const arrows = container.querySelectorAll('[class*="lucide-arrow-right"]');
      expect(arrows).toHaveLength(2);
    });

    it('should render arrow before ellipsis', () => {
      const { container } = render(
        <ProcessFlowPreview subUnits={createSubUnits(6)} maxNodes={4} />
      );

      // Should have 4 arrows: 3 between nodes + 1 before ellipsis
      const arrows = container.querySelectorAll('[class*="lucide-arrow-right"]');
      expect(arrows).toHaveLength(4);
    });

    it('should use smaller arrows in compact mode', () => {
      const { container } = render(
        <ProcessFlowPreview subUnits={createSubUnits(2)} compact />
      );

      const arrow = container.querySelector('[class*="lucide-arrow-right"]');
      expect(arrow).toHaveClass('w-3');
      expect(arrow).toHaveClass('h-3');
    });
  });

  describe('styling variations', () => {
    it('should handle dark mode classes', () => {
      render(
        <ProcessFlowPreview subUnits={[createMockSubUnit({ trustStatus: 'valid' })]} />
      );

      const node = screen.getByRole('button');
      expect(node.className).toMatch(/dark:bg-green-950/);
    });

    it('should apply hover and focus styles', () => {
      render(<ProcessFlowPreview subUnits={[createMockSubUnit()]} />);

      const node = screen.getByRole('button');
      expect(node.className).toMatch(/hover:shadow-sm/);
      expect(node.className).toMatch(/hover:scale-105/);
      expect(node.className).toMatch(/focus:outline-none/);
      expect(node.className).toMatch(/focus:ring-2/);
    });

    it('should truncate long names', () => {
      render(
        <ProcessFlowPreview
          subUnits={[createMockSubUnit({ name: 'Very Long Step Name That Should Truncate' })]}
        />
      );

      const nameElement = screen.getByText('Very Long Step Name That Should Truncate');
      expect(nameElement).toHaveClass('truncate');
    });
  });

  describe('sub-unit types', () => {
    it('should render atomic sub-unit', () => {
      render(
        <ProcessFlowPreview
          subUnits={[createMockSubUnit({ type: 'atomic', name: 'Atomic Step' })]}
        />
      );

      expect(screen.getByText('Atomic Step')).toBeInTheDocument();
    });

    it('should render composite sub-unit', () => {
      render(
        <ProcessFlowPreview
          subUnits={[createMockSubUnit({ type: 'composite', name: 'Composite Step' })]}
        />
      );

      expect(screen.getByText('Composite Step')).toBeInTheDocument();
    });

    it('should display type in tooltip', async () => {
      const user = userEvent.setup();
      render(
        <ProcessFlowPreview
          subUnits={[createMockSubUnit({ type: 'atomic', name: 'My Step' })]}
        />
      );

      await user.hover(screen.getByRole('button'));
      // Type is displayed in tooltip content
      const tooltip = await screen.findByRole('tooltip', { hidden: true });
      expect(tooltip).toHaveTextContent('atomic');
    });
  });

  describe('accessibility', () => {
    it('should have accessible button for each node', () => {
      const subUnits = createSubUnits(3);
      render(<ProcessFlowPreview subUnits={subUnits} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const onSubUnitClick = vi.fn();
      const subUnits = createSubUnits(2);

      render(
        <ProcessFlowPreview subUnits={subUnits} onSubUnitClick={onSubUnitClick} />
      );

      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      await user.keyboard('{Enter}');

      expect(onSubUnitClick).toHaveBeenCalledWith(subUnits[0]);
    });
  });
});
