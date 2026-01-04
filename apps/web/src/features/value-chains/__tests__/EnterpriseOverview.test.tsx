/**
 * EnterpriseOverview Tests
 *
 * Tests for the enterprise overview dashboard component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnterpriseOverview } from '../components/EnterpriseOverview';
import type { EnterpriseMetrics } from '../types';

// Test fixtures
const mockMetrics: EnterpriseMetrics = {
  activeTrust: 247,
  expiringTrust: 12,
  issues: 3,
  valueChainCount: 5,
  departmentCount: 15,
  workUnitCount: 48,
  userCount: 156,
};

const zeroMetrics: EnterpriseMetrics = {
  activeTrust: 0,
  expiringTrust: 0,
  issues: 0,
  valueChainCount: 0,
  departmentCount: 0,
  workUnitCount: 0,
  userCount: 0,
};

const defaultProps = {
  metrics: mockMetrics,
};

describe('EnterpriseOverview', () => {
  describe('Basic Rendering', () => {
    it('should render with test id', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByTestId('enterprise-overview')).toBeInTheDocument();
    });

    it('should display section title', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText('Enterprise Trust Overview')).toBeInTheDocument();
    });

    it('should render all three metric cards', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByTestId('active-trust-card')).toBeInTheDocument();
      expect(screen.getByTestId('expiring-trust-card')).toBeInTheDocument();
      expect(screen.getByTestId('issues-card')).toBeInTheDocument();
    });
  });

  describe('Metric Values', () => {
    it('should display active trust count', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText('247')).toBeInTheDocument();
    });

    it('should display expiring trust count', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display issues count', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display metric labels', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText('Active Trust')).toBeInTheDocument();
      expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      expect(screen.getByText('Issues')).toBeInTheDocument();
    });
  });

  describe('Summary Line', () => {
    it('should display value chain count', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText(/5 value chains/)).toBeInTheDocument();
    });

    it('should display department count', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText(/15 departments/)).toBeInTheDocument();
    });

    it('should display work unit count', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText(/48 work units/)).toBeInTheDocument();
    });

    it('should display user count', () => {
      render(<EnterpriseOverview {...defaultProps} />);
      expect(screen.getByText(/156 users/)).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onActiveTrustClick when active trust card is clicked', async () => {
      const user = userEvent.setup();
      const onActiveTrustClick = vi.fn();

      render(
        <EnterpriseOverview
          {...defaultProps}
          onActiveTrustClick={onActiveTrustClick}
        />
      );

      await user.click(screen.getByTestId('active-trust-card'));
      expect(onActiveTrustClick).toHaveBeenCalledTimes(1);
    });

    it('should call onExpiringClick when expiring card is clicked', async () => {
      const user = userEvent.setup();
      const onExpiringClick = vi.fn();

      render(
        <EnterpriseOverview
          {...defaultProps}
          onExpiringClick={onExpiringClick}
        />
      );

      await user.click(screen.getByTestId('expiring-trust-card'));
      expect(onExpiringClick).toHaveBeenCalledTimes(1);
    });

    it('should call onIssuesClick when issues card is clicked', async () => {
      const user = userEvent.setup();
      const onIssuesClick = vi.fn();

      render(
        <EnterpriseOverview
          {...defaultProps}
          onIssuesClick={onIssuesClick}
        />
      );

      await user.click(screen.getByTestId('issues-card'));
      expect(onIssuesClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when clicking without handlers', async () => {
      const user = userEvent.setup();
      render(<EnterpriseOverview {...defaultProps} />);

      // Should not throw
      await user.click(screen.getByTestId('active-trust-card'));
      await user.click(screen.getByTestId('expiring-trust-card'));
      await user.click(screen.getByTestId('issues-card'));
    });
  });

  describe('Zero Values', () => {
    it('should display zero values correctly', () => {
      render(<EnterpriseOverview metrics={zeroMetrics} />);
      // All three cards should show 0
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });

    it('should display zero counts in summary', () => {
      render(<EnterpriseOverview metrics={zeroMetrics} />);
      expect(screen.getByText(/0 value chains/)).toBeInTheDocument();
    });
  });

  describe('Large Numbers', () => {
    it('should format large numbers with commas', () => {
      const largeMetrics: EnterpriseMetrics = {
        activeTrust: 12345,
        expiringTrust: 1000,
        issues: 500,
        valueChainCount: 100,
        departmentCount: 200,
        workUnitCount: 5000,
        userCount: 10000,
      };

      render(<EnterpriseOverview metrics={largeMetrics} />);
      expect(screen.getByText('12,345')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(<EnterpriseOverview {...defaultProps} className="custom-class" />);
      const container = screen.getByTestId('enterprise-overview');
      expect(container.className).toContain('custom-class');
    });
  });
});
