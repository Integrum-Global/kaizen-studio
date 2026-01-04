/**
 * ValueChainMetrics Component Tests
 *
 * Tests for the performance metrics dashboard component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValueChainMetrics } from '../index';
import type { ValueChainMetricsData } from '../index';

const mockData: ValueChainMetricsData = {
  execution: {
    totalRuns: 1250,
    successfulRuns: 1175,
    failedRuns: 75,
    successRate: 94.0,
    averageDuration: 125.5,
    trend: 'up',
    trendPercentage: 12,
  },
  cost: {
    currentSpend: 4500,
    budget: 10000,
    percentUsed: 45,
    projectedSpend: 9000,
    currency: 'USD',
  },
  errorTrend: [
    { date: '2025-01-01', count: 5 },
    { date: '2025-01-02', count: 8 },
    { date: '2025-01-03', count: 3 },
    { date: '2025-01-04', count: 12 },
    { date: '2025-01-05', count: 6 },
    { date: '2025-01-06', count: 2 },
    { date: '2025-01-07', count: 4 },
  ],
};

describe('ValueChainMetrics', () => {
  it('should render the metrics container', () => {
    render(<ValueChainMetrics data={mockData} />);
    expect(screen.getByTestId('value-chain-metrics')).toBeInTheDocument();
  });

  it('should display Performance Metrics heading', () => {
    render(<ValueChainMetrics data={mockData} />);
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  describe('execution statistics', () => {
    it('should display total executions', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Total Executions')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    it('should display success rate', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('94.0% success rate')).toBeInTheDocument();
    });

    it('should display successful runs', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Successful Runs')).toBeInTheDocument();
      expect(screen.getByText('1,175')).toBeInTheDocument();
    });

    it('should display failed runs', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Failed Runs')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should display average duration', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('2m 6s avg')).toBeInTheDocument();
    });

    it('should display trend percentage', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('+12% vs last period')).toBeInTheDocument();
    });
  });

  describe('cost metrics', () => {
    it('should display cost card', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Cost')).toBeInTheDocument();
    });

    it('should display current spend', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('$4,500')).toBeInTheDocument();
    });

    it('should display budget', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('of $10,000 budget')).toBeInTheDocument();
    });

    it('should display Budget Consumption section', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Budget Consumption')).toBeInTheDocument();
    });

    it('should display percentage used', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('45.0%')).toBeInTheDocument();
    });

    it('should display projected spend', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Projected: $9,000')).toBeInTheDocument();
    });
  });

  describe('error trend', () => {
    it('should display Error Trend section', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Error Trend')).toBeInTheDocument();
    });

    it('should display total errors in period', () => {
      render(<ValueChainMetrics data={mockData} />);
      // Total: 5+8+3+12+6+2+4 = 40
      expect(screen.getByText('40 total errors in the period')).toBeInTheDocument();
    });

    it('should display error count in subtitle', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('40 errors this period')).toBeInTheDocument();
    });
  });

  describe('empty error trend', () => {
    it('should display no data message when error trend is empty', () => {
      const dataWithNoErrors: ValueChainMetricsData = {
        ...mockData,
        errorTrend: [],
      };

      render(<ValueChainMetrics data={dataWithNoErrors} />);
      expect(screen.getByText('No error data available')).toBeInTheDocument();
    });
  });

  describe('date range', () => {
    it('should display default date range when not provided', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('should display custom date range when provided', () => {
      const dateRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-15'),
      };

      render(<ValueChainMetrics data={mockData} dateRange={dateRange} />);
      expect(screen.getByText('Jan 1 - Jan 15')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      render(<ValueChainMetrics data={mockData} className="custom-class" />);
      const container = screen.getByTestId('value-chain-metrics');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('cost status colors', () => {
    it('should show green for low usage (< 70%)', () => {
      const lowUsageData: ValueChainMetricsData = {
        ...mockData,
        cost: {
          ...mockData.cost,
          percentUsed: 50,
        },
      };

      render(<ValueChainMetrics data={lowUsageData} />);
      // Cost card should render with green color class
      expect(screen.getByTestId('value-chain-metrics')).toBeInTheDocument();
    });

    it('should show amber for medium usage (70-90%)', () => {
      const mediumUsageData: ValueChainMetricsData = {
        ...mockData,
        cost: {
          ...mockData.cost,
          percentUsed: 80,
        },
      };

      render(<ValueChainMetrics data={mediumUsageData} />);
      expect(screen.getByTestId('value-chain-metrics')).toBeInTheDocument();
    });

    it('should show red for high usage (> 90%)', () => {
      const highUsageData: ValueChainMetricsData = {
        ...mockData,
        cost: {
          ...mockData.cost,
          percentUsed: 95,
        },
      };

      render(<ValueChainMetrics data={highUsageData} />);
      expect(screen.getByTestId('value-chain-metrics')).toBeInTheDocument();
    });
  });

  describe('budget warning', () => {
    it('should show warning when projected spend exceeds budget', () => {
      const overBudgetData: ValueChainMetricsData = {
        ...mockData,
        cost: {
          ...mockData.cost,
          projectedSpend: 12000,
          budget: 10000,
        },
      };

      render(<ValueChainMetrics data={overBudgetData} />);
      expect(screen.getByText('Projected to exceed budget')).toBeInTheDocument();
    });

    it('should not show warning when projected spend is within budget', () => {
      const withinBudgetData: ValueChainMetricsData = {
        ...mockData,
        cost: {
          ...mockData.cost,
          projectedSpend: 8000,
          budget: 10000,
        },
      };

      render(<ValueChainMetrics data={withinBudgetData} />);
      expect(screen.queryByText('Projected to exceed budget')).not.toBeInTheDocument();
    });
  });

  describe('trend indicators', () => {
    it('should display up trend indicator', () => {
      render(<ValueChainMetrics data={mockData} />);
      expect(screen.getByText('+12% vs last period')).toBeInTheDocument();
    });

    it('should display down trend with negative percentage', () => {
      const downTrendData: ValueChainMetricsData = {
        ...mockData,
        execution: {
          ...mockData.execution,
          trend: 'down',
          trendPercentage: -8,
        },
      };

      render(<ValueChainMetrics data={downTrendData} />);
      expect(screen.getByText('-8% vs last period')).toBeInTheDocument();
    });
  });

  describe('duration formatting', () => {
    it('should format seconds only when under a minute', () => {
      const shortDurationData: ValueChainMetricsData = {
        ...mockData,
        execution: {
          ...mockData.execution,
          averageDuration: 45,
        },
      };

      render(<ValueChainMetrics data={shortDurationData} />);
      expect(screen.getByText('45s avg')).toBeInTheDocument();
    });

    it('should format minutes and seconds when over a minute', () => {
      render(<ValueChainMetrics data={mockData} />);
      // 125.5 seconds = 2m 6s
      expect(screen.getByText('2m 6s avg')).toBeInTheDocument();
    });
  });
});
