/**
 * TrustChainPreview Tests
 *
 * Tests for the trust chain visualization component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrustChainPreview, type TrustChainLink } from '../index';

// Test fixtures
const mockSimpleChain: TrustChainLink[] = [
  {
    fromId: 'user-1',
    fromName: 'Alice CEO',
    fromType: 'human',
    toId: 'agent-1',
    toName: 'Bob Manager',
    toType: 'human',
    constraintSummary: '$500/day',
  },
];

const mockLongChain: TrustChainLink[] = [
  {
    fromId: 'user-1',
    fromName: 'CFO',
    fromType: 'human',
    toId: 'user-2',
    toName: 'Finance Director',
    toType: 'human',
    constraintSummary: '$10,000/day',
    constraints: ['resource_limit:cost:10000'],
  },
  {
    fromId: 'user-2',
    fromName: 'Finance Director',
    fromType: 'human',
    toId: 'user-3',
    toName: 'Team Lead',
    toType: 'human',
    constraintSummary: '$5,000/day',
    constraints: ['resource_limit:cost:5000'],
  },
  {
    fromId: 'user-3',
    fromName: 'Team Lead',
    fromType: 'human',
    toId: 'agent-1',
    toName: 'Invoice Bot',
    toType: 'agent',
    constraintSummary: '$500/day',
    constraints: ['resource_limit:cost:500'],
    isNew: true,
  },
];

const mockChainWithViolation: TrustChainLink[] = [
  {
    fromId: 'user-1',
    fromName: 'Manager',
    fromType: 'human',
    toId: 'agent-1',
    toName: 'Assistant',
    toType: 'agent',
    constraintSummary: '$1000/day',
    constraints: ['resource_limit:cost:1000'],
    hasViolation: true,
    violationMessage: 'Exceeds delegator limit of $500/day',
  },
];

describe('TrustChainPreview', () => {
  describe('Basic Rendering', () => {
    it('should render empty state when no chain provided', () => {
      render(<TrustChainPreview chain={[]} />);
      expect(screen.getByText('No trust chain to display')).toBeInTheDocument();
    });

    it('should render with test id', () => {
      render(<TrustChainPreview chain={mockSimpleChain} />);
      expect(screen.getByTestId('trust-chain-preview')).toBeInTheDocument();
    });

    it('should render a simple two-node chain', () => {
      render(<TrustChainPreview chain={mockSimpleChain} />);

      expect(screen.getByTestId('chain-node-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('chain-node-agent-1')).toBeInTheDocument();
      expect(screen.getByText('Alice CEO')).toBeInTheDocument();
      expect(screen.getByText('Bob Manager')).toBeInTheDocument();
    });

    it('should render all nodes in a long chain', () => {
      render(<TrustChainPreview chain={mockLongChain} />);

      expect(screen.getByTestId('chain-node-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('chain-node-user-2')).toBeInTheDocument();
      expect(screen.getByTestId('chain-node-user-3')).toBeInTheDocument();
      expect(screen.getByTestId('chain-node-agent-1')).toBeInTheDocument();
    });
  });

  describe('Node Types', () => {
    it('should display human type indicator', () => {
      render(<TrustChainPreview chain={mockSimpleChain} />);
      const humanLabels = screen.getAllByText('human');
      expect(humanLabels.length).toBeGreaterThan(0);
    });

    it('should display agent type indicator', () => {
      render(<TrustChainPreview chain={mockLongChain} />);
      expect(screen.getByText('agent')).toBeInTheDocument();
    });

    it('should show initials in avatar', () => {
      render(<TrustChainPreview chain={mockSimpleChain} />);
      expect(screen.getByText('AC')).toBeInTheDocument(); // Alice CEO
      expect(screen.getByText('BM')).toBeInTheDocument(); // Bob Manager
    });
  });

  describe('Constraint Display', () => {
    it('should display constraint summary', () => {
      render(<TrustChainPreview chain={mockSimpleChain} />);
      expect(screen.getByText('$500/day')).toBeInTheDocument();
    });

    it('should display multiple constraint summaries in long chain', () => {
      render(<TrustChainPreview chain={mockLongChain} />);
      expect(screen.getByText('$10,000/day')).toBeInTheDocument();
      expect(screen.getByText('$5,000/day')).toBeInTheDocument();
      expect(screen.getByText('$500/day')).toBeInTheDocument();
    });

    it('should display constraint summaries for each link', () => {
      render(<TrustChainPreview chain={mockLongChain} />);
      // All constraint summaries should be visible
      expect(screen.getByText('$10,000/day')).toBeInTheDocument();
      expect(screen.getByText('$5,000/day')).toBeInTheDocument();
      expect(screen.getByText('$500/day')).toBeInTheDocument();
    });
  });

  describe('New Delegation Highlighting', () => {
    it('should highlight new delegation link', () => {
      render(<TrustChainPreview chain={mockLongChain} highlightNew />);
      // The new node should have a "New" badge
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should not highlight when highlightNew is false', () => {
      render(<TrustChainPreview chain={mockLongChain} highlightNew={false} />);
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });
  });

  describe('Violation Display', () => {
    it('should show violation constraint summary', () => {
      render(<TrustChainPreview chain={mockChainWithViolation} />);
      expect(screen.getByText('$1000/day')).toBeInTheDocument();
    });

    it('should render chain with violation state', () => {
      render(<TrustChainPreview chain={mockChainWithViolation} />);
      expect(screen.getByTestId('chain-node-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('chain-node-agent-1')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    it('should render with violation data', () => {
      render(<TrustChainPreview chain={mockChainWithViolation} />);
      // Verify the chain renders correctly with violation data
      const preview = screen.getByTestId('trust-chain-preview');
      expect(preview).toBeInTheDocument();
      // The constraint summary is visible
      expect(screen.getByText('$1000/day')).toBeInTheDocument();
      // Alert triangle icon should be rendered for violations
      // (we can verify the chain renders without errors)
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<TrustChainPreview chain={mockSimpleChain} compact />);
      expect(screen.getByTestId('trust-chain-preview')).toBeInTheDocument();
    });

    it('should still show all nodes in compact mode', () => {
      render(<TrustChainPreview chain={mockLongChain} compact />);

      expect(screen.getByText('CFO')).toBeInTheDocument();
      expect(screen.getByText('Finance Director')).toBeInTheDocument();
      expect(screen.getByText('Team Lead')).toBeInTheDocument();
      expect(screen.getByText('Invoice Bot')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('should render horizontally by default', () => {
      render(<TrustChainPreview chain={mockSimpleChain} />);
      const container = screen.getByTestId('trust-chain-preview');
      // Horizontal orientation doesn't have flex-col
      expect(container.className).not.toContain('flex-col');
    });

    it('should render vertically when orientation is vertical', () => {
      render(<TrustChainPreview chain={mockSimpleChain} orientation="vertical" />);
      const container = screen.getByTestId('trust-chain-preview');
      expect(container.className).toContain('flex-col');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(<TrustChainPreview chain={mockSimpleChain} className="custom-class" />);
      const container = screen.getByTestId('trust-chain-preview');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle chain with single link', () => {
      const singleLink: TrustChainLink[] = [
        {
          fromId: 'a',
          fromName: 'Alpha',
          fromType: 'human',
          toId: 'b',
          toName: 'Beta',
          toType: 'agent',
        },
      ];
      render(<TrustChainPreview chain={singleLink} />);
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    it('should handle names with special characters', () => {
      const specialChain: TrustChainLink[] = [
        {
          fromId: 'user-1',
          fromName: "O'Connor & Associates",
          fromType: 'human',
          toId: 'agent-1',
          toName: 'Agent <AI>',
          toType: 'agent',
        },
      ];
      render(<TrustChainPreview chain={specialChain} />);
      expect(screen.getByText("O'Connor & Associates")).toBeInTheDocument();
      expect(screen.getByText('Agent <AI>')).toBeInTheDocument();
    });

    it('should handle empty constraint summary', () => {
      const noConstraintChain: TrustChainLink[] = [
        {
          fromId: 'a',
          fromName: 'Source Agent',
          fromType: 'human',
          toId: 'b',
          toName: 'Target Agent',
          toType: 'agent',
        },
      ];
      render(<TrustChainPreview chain={noConstraintChain} />);
      // Should render without constraint summary
      expect(screen.getByText('Source Agent')).toBeInTheDocument();
      expect(screen.getByText('Target Agent')).toBeInTheDocument();
    });
  });
});
