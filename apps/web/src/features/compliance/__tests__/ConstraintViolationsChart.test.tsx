/**
 * ConstraintViolationsChart Tests
 *
 * Tests for the constraint violations chart component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConstraintViolationsChart } from '../components/ConstraintViolationsChart';
import type { WeeklyViolations } from '../types';

// Test fixtures
const mockData: WeeklyViolations[] = [
  { week: 'W1', startDate: '2026-01-01', endDate: '2026-01-07', count: 5, bySevertity: { warning: 3, error: 2, critical: 0 } },
  { week: 'W2', startDate: '2026-01-08', endDate: '2026-01-14', count: 8, bySevertity: { warning: 4, error: 3, critical: 1 } },
  { week: 'W3', startDate: '2026-01-15', endDate: '2026-01-21', count: 3, bySevertity: { warning: 2, error: 1, critical: 0 } },
  { week: 'W4', startDate: '2026-01-22', endDate: '2026-01-28', count: 12, bySevertity: { warning: 5, error: 4, critical: 3 } },
];

const zeroData: WeeklyViolations[] = [
  { week: 'W1', startDate: '2026-01-01', endDate: '2026-01-07', count: 0, bySevertity: { warning: 0, error: 0, critical: 0 } },
  { week: 'W2', startDate: '2026-01-08', endDate: '2026-01-14', count: 0, bySevertity: { warning: 0, error: 0, critical: 0 } },
];

describe('ConstraintViolationsChart', () => {
  describe('Basic Rendering', () => {
    it('should render with test id', () => {
      render(<ConstraintViolationsChart data={mockData} />);
      expect(screen.getByTestId('violations-chart')).toBeInTheDocument();
    });

    it('should display chart title', () => {
      render(<ConstraintViolationsChart data={mockData} />);
      expect(screen.getByText('Constraint Violations (Last 30 Days)')).toBeInTheDocument();
    });

    it('should display total violations count', () => {
      render(<ConstraintViolationsChart data={mockData} />);
      expect(screen.getByText('Total: 28')).toBeInTheDocument();
    });
  });

  describe('Bars Rendering', () => {
    it('should render bars for each week', () => {
      render(<ConstraintViolationsChart data={mockData} />);
      expect(screen.getByTestId('bar-W1')).toBeInTheDocument();
      expect(screen.getByTestId('bar-W2')).toBeInTheDocument();
      expect(screen.getByTestId('bar-W3')).toBeInTheDocument();
      expect(screen.getByTestId('bar-W4')).toBeInTheDocument();
    });

    it('should display week labels', () => {
      render(<ConstraintViolationsChart data={mockData} />);
      expect(screen.getByText('W1')).toBeInTheDocument();
      expect(screen.getByText('W2')).toBeInTheDocument();
      expect(screen.getByText('W3')).toBeInTheDocument();
      expect(screen.getByText('W4')).toBeInTheDocument();
    });

    it('should display violation counts in bars', () => {
      render(<ConstraintViolationsChart data={mockData} />);
      // Check that bars have correct title attributes
      expect(screen.getByTestId('bar-W1')).toHaveAttribute('title', 'W1: 5 violations');
      expect(screen.getByTestId('bar-W2')).toHaveAttribute('title', 'W2: 8 violations');
      expect(screen.getByTestId('bar-W3')).toHaveAttribute('title', 'W3: 3 violations');
      expect(screen.getByTestId('bar-W4')).toHaveAttribute('title', 'W4: 12 violations');
    });
  });

  describe('Click Handlers', () => {
    it('should call onWeekClick when bar is clicked', async () => {
      const user = userEvent.setup();
      const onWeekClick = vi.fn();

      render(<ConstraintViolationsChart data={mockData} onWeekClick={onWeekClick} />);

      await user.click(screen.getByTestId('bar-W1'));
      expect(onWeekClick).toHaveBeenCalledWith('W1');
    });

    it('should call onWeekClick with correct week', async () => {
      const user = userEvent.setup();
      const onWeekClick = vi.fn();

      render(<ConstraintViolationsChart data={mockData} onWeekClick={onWeekClick} />);

      await user.click(screen.getByTestId('bar-W3'));
      expect(onWeekClick).toHaveBeenCalledWith('W3');
    });

    it('should not throw when clicking without handler', async () => {
      const user = userEvent.setup();
      render(<ConstraintViolationsChart data={mockData} />);

      // Should not throw
      await user.click(screen.getByTestId('bar-W1'));
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no data', () => {
      render(<ConstraintViolationsChart data={[]} />);
      expect(screen.getByTestId('violations-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('No violation data available')).toBeInTheDocument();
    });

    it('should display no violations message when all counts are zero', () => {
      render(<ConstraintViolationsChart data={zeroData} />);
      expect(screen.getByText('No violations')).toBeInTheDocument();
      expect(screen.getByText('No constraint violations in the last 30 days')).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('should display legend with color explanations', () => {
      render(<ConstraintViolationsChart data={mockData} />);
      expect(screen.getByText('Low (≤5)')).toBeInTheDocument();
      expect(screen.getByText('Medium (6-10)')).toBeInTheDocument();
      expect(screen.getByText('High (>10)')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(<ConstraintViolationsChart data={mockData} className="custom-class" />);
      const container = screen.getByTestId('violations-chart');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const singleData: WeeklyViolations[] = [
        { week: 'W1', startDate: '2026-01-01', endDate: '2026-01-07', count: 5, bySevertity: { warning: 3, error: 2, critical: 0 } },
      ];

      render(<ConstraintViolationsChart data={singleData} />);
      expect(screen.getByTestId('bar-W1')).toBeInTheDocument();
      expect(screen.getByTestId('bar-W1')).toHaveAttribute('title', 'W1: 5 violations');
    });

    it('should handle very high counts', () => {
      const highData: WeeklyViolations[] = [
        { week: 'W1', startDate: '2026-01-01', endDate: '2026-01-07', count: 100, bySevertity: { warning: 50, error: 40, critical: 10 } },
      ];

      render(<ConstraintViolationsChart data={highData} />);
      expect(screen.getByTestId('bar-W1')).toHaveAttribute('title', 'W1: 100 violations');
    });

    it('should handle mixed zero and non-zero data', () => {
      const mixedData: WeeklyViolations[] = [
        { week: 'W1', startDate: '2026-01-01', endDate: '2026-01-07', count: 0, bySevertity: { warning: 0, error: 0, critical: 0 } },
        { week: 'W2', startDate: '2026-01-08', endDate: '2026-01-14', count: 5, bySevertity: { warning: 3, error: 2, critical: 0 } },
        { week: 'W3', startDate: '2026-01-15', endDate: '2026-01-21', count: 0, bySevertity: { warning: 0, error: 0, critical: 0 } },
      ];

      render(<ConstraintViolationsChart data={mixedData} />);
      expect(screen.getByTestId('violations-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-W2')).toHaveAttribute('title', 'W2: 5 violations');
    });
  });
});
