/**
 * ConstraintsStep Tests
 *
 * Tests for the constraints configuration step with tightening validation.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConstraintsStep } from '../ConstraintsStep';

// Default props for testing
const defaultProps = {
  constraints: [],
  maxDepth: 1,
  allowFurtherDelegation: false,
  onConstraintsChange: vi.fn(),
  onMaxDepthChange: vi.fn(),
  onAllowFurtherDelegationChange: vi.fn(),
};

describe('ConstraintsStep', () => {
  describe('Basic Rendering', () => {
    it('should render with test id', () => {
      render(<ConstraintsStep {...defaultProps} />);
      expect(screen.getByTestId('constraints-step')).toBeInTheDocument();
    });

    it('should display constraint tightening rule message', () => {
      render(<ConstraintsStep {...defaultProps} />);
      expect(
        screen.getByText(/Constraints can only be tightened, never loosened/)
      ).toBeInTheDocument();
    });

    it('should render allow further delegation switch', () => {
      render(<ConstraintsStep {...defaultProps} />);
      expect(screen.getByText('Allow Further Delegation')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should not show depth slider when further delegation is disabled', () => {
      render(<ConstraintsStep {...defaultProps} />);
      expect(
        screen.queryByText('Maximum Delegation Depth')
      ).not.toBeInTheDocument();
    });

    it('should show depth slider when further delegation is enabled', () => {
      render(
        <ConstraintsStep {...defaultProps} allowFurtherDelegation={true} />
      );
      expect(screen.getByText('Maximum Delegation Depth')).toBeInTheDocument();
    });
  });

  describe('Allow Further Delegation Toggle', () => {
    it('should call onAllowFurtherDelegationChange when toggled', async () => {
      const user = userEvent.setup();
      const onAllowFurtherDelegationChange = vi.fn();

      render(
        <ConstraintsStep
          {...defaultProps}
          onAllowFurtherDelegationChange={onAllowFurtherDelegationChange}
        />
      );

      await user.click(screen.getByRole('switch'));
      expect(onAllowFurtherDelegationChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Max Delegation Depth', () => {
    it('should display current max depth value', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          allowFurtherDelegation={true}
          maxDepth={5}
        />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should limit max depth to delegator max depth', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          allowFurtherDelegation={true}
          maxDepth={3}
          delegatorMaxDepth={5}
        />
      );

      // Should show "3 / 5" format
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('/ 5')).toBeInTheDocument();
      expect(screen.getByText('5 (Maximum allowed)')).toBeInTheDocument();
    });

    it('should show depth explanation', () => {
      render(
        <ConstraintsStep {...defaultProps} allowFurtherDelegation={true} />
      );
      expect(screen.getByText('Understanding Delegation Depth')).toBeInTheDocument();
    });
  });

  describe('Delegator Limits Display', () => {
    it('should display delegator limits when provided', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['resource_limit:cost:500', 'rate_limit:requests:100']}
          delegatorName="CFO's"
        />
      );

      expect(screen.getByText("CFO's Limits")).toBeInTheDocument();
      expect(screen.getByText('resource_limit:cost:500')).toBeInTheDocument();
      expect(screen.getByText('rate_limit:requests:100')).toBeInTheDocument();
    });

    it('should not display delegator limits when not provided', () => {
      render(<ConstraintsStep {...defaultProps} />);
      expect(screen.queryByText("Your Limits")).not.toBeInTheDocument();
    });

    it('should display delegator max depth when provided', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['resource_limit:cost:500']}
          delegatorMaxDepth={3}
        />
      );

      expect(screen.getByText(/Max delegation depth:/)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Constraint Tightening Validation', () => {
    it('should show violation alert when constraints exceed parent limits', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['resource_limit:cost:500']}
          constraints={['resource_limit:cost:1000']} // Exceeds 500
        />
      );

      expect(screen.getByTestId('constraint-violations')).toBeInTheDocument();
      expect(
        screen.getByText('Constraint Tightening Violation')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Cannot exceed your limit of 500/)
      ).toBeInTheDocument();
    });

    it('should show valid constraints indicator when no violations', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['resource_limit:cost:500']}
          constraints={['resource_limit:cost:250']} // Within limit
        />
      );

      expect(screen.getByText('Valid Constraints')).toBeInTheDocument();
      expect(
        screen.getByText('All constraints comply with the tightening rule.')
      ).toBeInTheDocument();
    });

    it('should not show valid indicator when no constraints set', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['resource_limit:cost:500']}
          constraints={[]}
        />
      );

      expect(screen.queryByText('Valid Constraints')).not.toBeInTheDocument();
    });

    it('should validate rate_limit constraints', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['rate_limit:requests:100']}
          constraints={['rate_limit:requests:200']} // Exceeds 100
        />
      );

      expect(
        screen.getByText(/Rate limit 200 exceeds your limit of 100/)
      ).toBeInTheDocument();
    });

    it('should call onViolationsChange when violations detected', () => {
      const onViolationsChange = vi.fn();

      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['resource_limit:cost:500']}
          constraints={['resource_limit:cost:1000']}
          onViolationsChange={onViolationsChange}
        />
      );

      expect(onViolationsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            constraintType: 'resource_limit:cost',
            parentValue: 500,
            childValue: 1000,
          }),
        ])
      );
    });
  });

  describe('Depth Violation', () => {
    it('should show depth violation when exceeding delegator depth', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          allowFurtherDelegation={true}
          maxDepth={5}
          delegatorMaxDepth={3}
        />
      );

      expect(screen.getByTestId('constraint-violations')).toBeInTheDocument();
      expect(
        screen.getByText(/Cannot exceed your delegation depth of 3/)
      ).toBeInTheDocument();
    });

    it('should apply error styling to depth display on violation', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          allowFurtherDelegation={true}
          maxDepth={5}
          delegatorMaxDepth={3}
        />
      );

      // Check that the depth display has error styling
      const depthDisplay = screen.getByText('5').closest('span');
      expect(depthDisplay?.className).toContain('text-destructive');
    });
  });

  describe('Constraint Editor Integration', () => {
    it('should display Global Constraints section', () => {
      render(<ConstraintsStep {...defaultProps} />);
      expect(screen.getByText('Global Constraints')).toBeInTheDocument();
    });

    it('should display constraint editor description', () => {
      render(<ConstraintsStep {...defaultProps} />);
      expect(
        screen.getByText('These constraints apply to all delegated capabilities')
      ).toBeInTheDocument();
    });
  });

  describe('Multiple Violations', () => {
    it('should display all violations in the list', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={[
            'resource_limit:cost:500',
            'rate_limit:requests:100',
          ]}
          constraints={[
            'resource_limit:cost:1000',
            'rate_limit:requests:200',
          ]}
        />
      );

      const violationAlert = screen.getByTestId('constraint-violations');
      const listItems = within(violationAlert).getAllByRole('listitem');
      expect(listItems.length).toBe(2);
    });

    it('should combine constraint and depth violations', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          allowFurtherDelegation={true}
          maxDepth={5}
          delegatorMaxDepth={3}
          delegatorConstraints={['resource_limit:cost:500']}
          constraints={['resource_limit:cost:1000']}
        />
      );

      const violationAlert = screen.getByTestId('constraint-violations');
      expect(violationAlert).toBeInTheDocument();

      // Should show both constraint and depth violations
      expect(
        screen.getByText(/Cannot exceed your limit of 500/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Cannot exceed your delegation depth of 3/)
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty delegator constraints', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={[]}
          constraints={['resource_limit:cost:1000']}
        />
      );

      // Should not show violations without parent constraints
      expect(
        screen.queryByTestId('constraint-violations')
      ).not.toBeInTheDocument();
    });

    it('should handle malformed constraint strings', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['invalid']}
          constraints={['also_invalid']}
        />
      );

      // Should not crash, just not show violations for unparseable constraints
      expect(screen.getByTestId('constraints-step')).toBeInTheDocument();
    });

    it('should handle constraints with same type but different fields', () => {
      render(
        <ConstraintsStep
          {...defaultProps}
          delegatorConstraints={['resource_limit:cost:500']}
          constraints={['resource_limit:tokens:10000']} // Different field
        />
      );

      // Different fields shouldn't cause violations
      expect(
        screen.queryByTestId('constraint-violations')
      ).not.toBeInTheDocument();
    });
  });
});
