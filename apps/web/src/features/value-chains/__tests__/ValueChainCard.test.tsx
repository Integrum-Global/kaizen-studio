/**
 * ValueChainCard Tests
 *
 * Tests for the value chain card component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValueChainCard } from '../components/ValueChainCard';
import type { ValueChain } from '../types';

// Test fixture
const mockValueChain: ValueChain = {
  id: 'vc-1',
  name: 'Procure-to-Pay',
  description: 'End-to-end procurement process',
  status: 'active',
  departments: [
    { id: 'd1', name: 'Procurement', workUnitCount: 5, userCount: 12, trustStatus: 'valid', roleLabel: 'Request' },
    { id: 'd2', name: 'Finance', workUnitCount: 8, userCount: 20, trustStatus: 'valid', roleLabel: 'Approve' },
    { id: 'd3', name: 'Legal', workUnitCount: 3, userCount: 6, trustStatus: 'valid', roleLabel: 'Contract' },
  ],
  trustHealth: {
    valid: 45,
    expiring: 0,
    expired: 0,
    revoked: 0,
    percentage: 100,
    status: 'valid',
  },
  metrics: {
    departmentCount: 3,
    workUnitCount: 16,
    userCount: 38,
    executionsToday: 124,
    successRate: 98.5,
    errorCount: 2,
    costPercentage: 45,
  },
  lastAuditAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: 'user-1',
  ownerName: 'John Smith',
};

const mockValueChainWithWarning: ValueChain = {
  ...mockValueChain,
  id: 'vc-2',
  name: 'Hire-to-Retire',
  trustHealth: {
    valid: 40,
    expiring: 5,
    expired: 0,
    revoked: 0,
    percentage: 89,
    status: 'expiring',
  },
};

const defaultProps = {
  valueChain: mockValueChain,
  onViewChain: vi.fn(),
  onTrustMap: vi.fn(),
  onCompliance: vi.fn(),
  onAudit: vi.fn(),
};

describe('ValueChainCard', () => {
  describe('Basic Rendering', () => {
    it('should render with test id', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByTestId('value-chain-card-vc-1')).toBeInTheDocument();
    });

    it('should display value chain name', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('Procure-to-Pay')).toBeInTheDocument();
    });

    it('should display value chain description', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('End-to-end procurement process')).toBeInTheDocument();
    });

    it('should display status badge', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Department Flow', () => {
    it('should render department flow visualization', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByTestId('department-flow-visualization')).toBeInTheDocument();
    });

    it('should display department names', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('Procurement')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display department count', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display work unit count', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('16')).toBeInTheDocument();
    });

    it('should display user count', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('38')).toBeInTheDocument();
    });
  });

  describe('Trust Health', () => {
    it('should display trust health for valid status', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('All chains valid')).toBeInTheDocument();
    });

    it('should display warning for expiring trust', () => {
      render(
        <ValueChainCard
          {...defaultProps}
          valueChain={mockValueChainWithWarning}
        />
      );
      expect(screen.getByText('Some chains expiring')).toBeInTheDocument();
    });

    it('should display warning banner when trust is expiring', () => {
      render(
        <ValueChainCard
          {...defaultProps}
          valueChain={mockValueChainWithWarning}
        />
      );
      expect(screen.getByText(/5 units have expiring trust/)).toBeInTheDocument();
    });
  });

  describe('Status Variants', () => {
    it('should show Active badge for active status', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show Paused badge for paused status', () => {
      const pausedChain = { ...mockValueChain, status: 'paused' as const };
      render(<ValueChainCard {...defaultProps} valueChain={pausedChain} />);
      expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('should show Archived badge for archived status', () => {
      const archivedChain = { ...mockValueChain, status: 'archived' as const };
      render(<ValueChainCard {...defaultProps} valueChain={archivedChain} />);
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render all action buttons', () => {
      render(<ValueChainCard {...defaultProps} />);
      expect(screen.getByTestId('view-chain-button')).toBeInTheDocument();
      expect(screen.getByTestId('trust-map-button')).toBeInTheDocument();
      expect(screen.getByTestId('compliance-button')).toBeInTheDocument();
      expect(screen.getByTestId('audit-button')).toBeInTheDocument();
    });

    it('should call onViewChain when View Chain is clicked', async () => {
      const user = userEvent.setup();
      const onViewChain = vi.fn();
      render(<ValueChainCard {...defaultProps} onViewChain={onViewChain} />);

      await user.click(screen.getByTestId('view-chain-button'));
      expect(onViewChain).toHaveBeenCalledTimes(1);
    });

    it('should call onTrustMap when Trust Map is clicked', async () => {
      const user = userEvent.setup();
      const onTrustMap = vi.fn();
      render(<ValueChainCard {...defaultProps} onTrustMap={onTrustMap} />);

      await user.click(screen.getByTestId('trust-map-button'));
      expect(onTrustMap).toHaveBeenCalledTimes(1);
    });

    it('should call onCompliance when Compliance is clicked', async () => {
      const user = userEvent.setup();
      const onCompliance = vi.fn();
      render(<ValueChainCard {...defaultProps} onCompliance={onCompliance} />);

      await user.click(screen.getByTestId('compliance-button'));
      expect(onCompliance).toHaveBeenCalledTimes(1);
    });

    it('should call onAudit when Audit is clicked', async () => {
      const user = userEvent.setup();
      const onAudit = vi.fn();
      render(<ValueChainCard {...defaultProps} onAudit={onAudit} />);

      await user.click(screen.getByTestId('audit-button'));
      expect(onAudit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Last Audit Display', () => {
    it('should display last audit time', () => {
      render(<ValueChainCard {...defaultProps} />);
      // Should show relative time like "less than a minute ago"
      expect(screen.getByText(/Audit:/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle value chain with no departments', () => {
      const emptyChain = { ...mockValueChain, departments: [] };
      render(<ValueChainCard {...defaultProps} valueChain={emptyChain} />);
      expect(screen.getByTestId('department-flow-empty')).toBeInTheDocument();
    });

    it('should handle value chain with zero metrics', () => {
      const zeroMetricsChain = {
        ...mockValueChain,
        metrics: {
          ...mockValueChain.metrics,
          departmentCount: 0,
          workUnitCount: 0,
          userCount: 0,
        },
      };
      render(<ValueChainCard {...defaultProps} valueChain={zeroMetricsChain} />);
      expect(screen.getByTestId('value-chain-card-vc-1')).toBeInTheDocument();
    });

    it('should handle long value chain name', () => {
      const longNameChain = {
        ...mockValueChain,
        name: 'Very Long Value Chain Name That Should Still Display',
      };
      render(<ValueChainCard {...defaultProps} valueChain={longNameChain} />);
      expect(
        screen.getByText('Very Long Value Chain Name That Should Still Display')
      ).toBeInTheDocument();
    });
  });
});
