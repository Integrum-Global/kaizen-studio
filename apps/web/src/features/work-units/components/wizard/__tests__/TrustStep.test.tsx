/**
 * TrustStep Component Tests
 *
 * Tests for the work unit trust setup step.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrustStep } from '../TrustStep';
import { defaultFormData } from '../types';
import type { UserLevel } from '../../../types';

describe('TrustStep', () => {
  const mockDelegatees = [
    { id: 'user-1', name: 'Alice Johnson', level: 3 as UserLevel },
    { id: 'user-2', name: 'Bob Smith', level: 2 as UserLevel },
  ];

  const defaultProps = {
    formData: { ...defaultFormData },
    onChange: vi.fn(),
    errors: {},
    userLevel: 2 as UserLevel,
    delegatees: mockDelegatees,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Level 2', () => {
    it('should render the step heading', () => {
      render(<TrustStep {...defaultProps} />);
      expect(screen.getByText('Trust Setup')).toBeInTheDocument();
    });

    it('should render Level 2 description', () => {
      render(<TrustStep {...defaultProps} />);
      expect(
        screen.getByText(/Request trust delegation from a Value Chain Owner/i)
      ).toBeInTheDocument();
    });

    it('should NOT render establish trust option for Level 2', () => {
      render(<TrustStep {...defaultProps} />);
      expect(screen.queryByText('Establish Trust Now')).not.toBeInTheDocument();
    });

    it('should render request delegation option', () => {
      render(<TrustStep {...defaultProps} />);
      expect(screen.getByText('Request Delegation')).toBeInTheDocument();
    });

    it('should render set up later option', () => {
      render(<TrustStep {...defaultProps} />);
      expect(screen.getByText('Set Up Later')).toBeInTheDocument();
    });

    it('should render trust status preview', () => {
      render(<TrustStep {...defaultProps} />);
      expect(screen.getByText('After Creation')).toBeInTheDocument();
    });
  });

  describe('Rendering - Level 3', () => {
    const level3Props = { ...defaultProps, userLevel: 3 as UserLevel };

    it('should render Level 3 description', () => {
      render(<TrustStep {...level3Props} />);
      expect(
        screen.getByText(/As a Value Chain Owner, you can establish trust directly/i)
      ).toBeInTheDocument();
    });

    it('should render establish trust option for Level 3', () => {
      render(<TrustStep {...level3Props} />);
      expect(screen.getByText('Establish Trust Now')).toBeInTheDocument();
    });

    it('should render delegate option with Level 3 text', () => {
      render(<TrustStep {...level3Props} />);
      expect(screen.getByText('Delegate to Another User')).toBeInTheDocument();
    });

    it('should render set up later option', () => {
      render(<TrustStep {...level3Props} />);
      expect(screen.getByText('Set Up Later')).toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('should have skip selected by default', () => {
      render(<TrustStep {...defaultProps} />);
      const skipRadio = screen.getByRole('radio', { name: /Set Up Later/i });
      expect(skipRadio).toBeChecked();
    });

    it('should call onChange when selecting delegate option', async () => {
      const user = userEvent.setup();
      render(<TrustStep {...defaultProps} />);

      await user.click(screen.getByRole('radio', { name: /Request Delegation/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        trustSetup: 'delegate',
        delegateeId: undefined,
      });
    });

    it('should call onChange when selecting skip option', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
      };
      render(<TrustStep {...props} />);

      await user.click(screen.getByRole('radio', { name: /Set Up Later/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        trustSetup: 'skip',
        delegateeId: undefined,
      });
    });

    it('should call onChange when selecting establish option (Level 3)', async () => {
      const user = userEvent.setup();
      const level3Props = { ...defaultProps, userLevel: 3 as UserLevel };
      render(<TrustStep {...level3Props} />);

      await user.click(screen.getByRole('radio', { name: /Establish Trust Now/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        trustSetup: 'establish',
        delegateeId: undefined,
      });
    });

    it('should visually highlight selected option', () => {
      render(<TrustStep {...defaultProps} />);
      const skipLabel = screen.getByText('Set Up Later').closest('label');
      expect(skipLabel).toHaveClass('border-primary');
    });
  });

  describe('Delegatee Selection', () => {
    it('should not show delegatee select when skip is selected', () => {
      render(<TrustStep {...defaultProps} />);
      expect(screen.queryByTestId('wizard-delegatee-select')).not.toBeInTheDocument();
    });

    it('should show delegatee select when delegate is selected', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
      };
      render(<TrustStep {...props} />);

      expect(screen.getByTestId('wizard-delegatee-select')).toBeInTheDocument();
    });

    it('should show delegatees in dropdown', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
      };
      render(<TrustStep {...props} />);

      await user.click(screen.getByTestId('wizard-delegatee-select'));

      expect(screen.getByRole('option', { name: /Alice Johnson/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Bob Smith/i })).toBeInTheDocument();
    });

    it('should call onChange when selecting a delegatee', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
      };
      render(<TrustStep {...props} />);

      await user.click(screen.getByTestId('wizard-delegatee-select'));
      await user.click(screen.getByRole('option', { name: /Alice Johnson/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({ delegateeId: 'user-1' });
    });

    it('should use default delegatees when none provided', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
        delegatees: [],
      };
      render(<TrustStep {...props} />);

      await user.click(screen.getByTestId('wizard-delegatee-select'));

      // Default delegatees should be available
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
  });

  describe('Trust Status Preview', () => {
    it('should show valid status for establish option', () => {
      const props = {
        ...defaultProps,
        userLevel: 3 as UserLevel,
        formData: { ...defaultFormData, trustSetup: 'establish' as const },
      };
      render(<TrustStep {...props} />);

      expect(screen.getByText(/Trust will be valid - ready to run/i)).toBeInTheDocument();
    });

    it('should show delegation pending status for delegate option (Level 2)', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
      };
      render(<TrustStep {...props} />);

      expect(
        screen.getByText(/Trust will be pending delegation approval/i)
      ).toBeInTheDocument();
    });

    it('should show delegation request status for delegate option (Level 3)', () => {
      const props = {
        ...defaultProps,
        userLevel: 3 as UserLevel,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
      };
      render(<TrustStep {...props} />);

      expect(screen.getByText(/Delegation request will be sent/i)).toBeInTheDocument();
    });

    it('should show pending status for skip option', () => {
      render(<TrustStep {...defaultProps} />);
      expect(
        screen.getByText(/Trust will be pending - configure before running/i)
      ).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display delegatee error when provided', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
        errors: { delegateeId: 'Please select a user to delegate to' },
      };
      render(<TrustStep {...props} />);

      expect(
        screen.getByText('Please select a user to delegate to')
      ).toBeInTheDocument();
    });

    it('should display trust setup error when provided', () => {
      const props = {
        ...defaultProps,
        errors: { trustSetup: 'Please select a trust option' },
      };
      render(<TrustStep {...props} />);

      expect(screen.getByText('Please select a trust option')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible radio group', () => {
      render(<TrustStep {...defaultProps} />);
      expect(
        screen.getByRole('radiogroup', { name: 'Trust setup option' })
      ).toBeInTheDocument();
    });

    it('should have proper labels for radio options', () => {
      render(<TrustStep {...defaultProps} />);
      expect(
        screen.getByRole('radio', { name: /Request Delegation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: /Set Up Later/i })
      ).toBeInTheDocument();
    });

    it('should mark error messages as alerts', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, trustSetup: 'delegate' as const },
        errors: { delegateeId: 'Please select a user' },
      };
      render(<TrustStep {...props} />);

      expect(screen.getByRole('alert')).toHaveTextContent('Please select a user');
    });
  });
});
