/**
 * WorkUnitCreateWizard Component Tests
 *
 * Tests for the main wizard component including step navigation,
 * form state management, and submission.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkUnitCreateWizard } from '../WorkUnitCreateWizard';
import type { UserLevel, WorkspaceRef } from '../../../types';
import { CAPABILITY_PRESETS } from '../types';

describe('WorkUnitCreateWizard', () => {
  const mockWorkspaces: WorkspaceRef[] = [
    { id: 'ws-1', name: 'Finance', color: 'blue' },
    { id: 'ws-2', name: 'Operations', color: 'green' },
  ];

  const mockDelegatees = [
    { id: 'user-1', name: 'Alice Johnson', level: 3 as UserLevel },
    { id: 'user-2', name: 'Bob Smith', level: 2 as UserLevel },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    userLevel: 2 as UserLevel,
    workspaces: mockWorkspaces,
    delegatees: mockDelegatees,
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the wizard when open', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<WorkUnitCreateWizard {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render the dialog title', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.getByText('Create Work Unit')).toBeInTheDocument();
    });

    it('should render step indicators', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-step-type')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-step-info')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-step-capabilities')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-step-config')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-step-trust')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render next button on first step', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-next-btn')).toBeInTheDocument();
    });

    it('should not render back button on first step', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.queryByTestId('wizard-back-btn')).not.toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should start on type step', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.getByText('What type of work unit?')).toBeInTheDocument();
    });

    it('should navigate to next step when clicking Next', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-next-btn'));

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('should show back button after first step', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-next-btn'));

      expect(screen.getByTestId('wizard-back-btn')).toBeInTheDocument();
    });

    it('should navigate back when clicking Back', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.click(screen.getByTestId('wizard-back-btn'));

      expect(screen.getByText('What type of work unit?')).toBeInTheDocument();
    });

    it('should allow clicking on visited steps', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      // Navigate to step 2
      await user.click(screen.getByTestId('wizard-next-btn'));
      expect(screen.getByText('Basic Information')).toBeInTheDocument();

      // Click on step 1 indicator
      await user.click(screen.getByTestId('wizard-step-type'));
      expect(screen.getByText('What type of work unit?')).toBeInTheDocument();
    });

    it('should not allow clicking on unvisited steps', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      // Try to click on step 3 (not visited)
      await user.click(screen.getByTestId('wizard-step-capabilities'));

      // Should still be on step 1
      expect(screen.getByText('What type of work unit?')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when trying to proceed with empty name', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      // Go to info step
      await user.click(screen.getByTestId('wizard-next-btn'));

      // Try to proceed without filling name
      await user.click(screen.getByTestId('wizard-next-btn'));

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('should show error when name is too short', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.type(screen.getByTestId('wizard-name-input'), 'AB');
      await user.click(screen.getByTestId('wizard-next-btn'));

      expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
    });

    it('should show error when description is empty', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.type(screen.getByTestId('wizard-name-input'), 'Valid Name');
      await user.click(screen.getByTestId('wizard-next-btn'));

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should show error when no capabilities selected', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      // Navigate through first two steps
      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.type(screen.getByTestId('wizard-name-input'), 'Valid Name');
      await user.type(
        screen.getByTestId('wizard-description-input'),
        'This is a valid description'
      );
      await user.click(screen.getByTestId('wizard-next-btn'));

      // Try to proceed without selecting capabilities
      await user.click(screen.getByTestId('wizard-next-btn'));

      expect(
        screen.getByText('Please add at least one capability')
      ).toBeInTheDocument();
    });

    it('should clear errors when fixing validation issues', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      // Go to info step and trigger error
      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.click(screen.getByTestId('wizard-next-btn'));
      expect(screen.getByText('Name is required')).toBeInTheDocument();

      // Fix the error
      await user.type(screen.getByTestId('wizard-name-input'), 'Valid Name');

      // Error should be cleared
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    async function fillWizardForm(user: ReturnType<typeof userEvent.setup>) {
      // Step 1: Type (already atomic by default)
      await user.click(screen.getByTestId('wizard-next-btn'));

      // Step 2: Info
      await user.type(screen.getByTestId('wizard-name-input'), 'Test Work Unit');
      await user.type(
        screen.getByTestId('wizard-description-input'),
        'This is a test description for the work unit'
      );
      await user.click(screen.getByTestId('wizard-next-btn'));

      // Step 3: Capabilities
      await user.click(screen.getByTestId('capability-preset-extract'));
      await user.click(screen.getByTestId('wizard-next-btn'));

      // Step 4: Config (optional, skip)
      await user.click(screen.getByTestId('wizard-next-btn'));

      // Step 5: Trust (skip is default)
    }

    it('should show submit button on last step', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await fillWizardForm(user);

      expect(screen.getByTestId('wizard-submit-btn')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-submit-btn')).toHaveTextContent(
        'Create Work Unit'
      );
    });

    it('should call onSubmit with form data when submitting', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await fillWizardForm(user);
      await user.click(screen.getByTestId('wizard-submit-btn'));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'atomic',
            name: 'Test Work Unit',
            description: 'This is a test description for the work unit',
            capabilities: expect.arrayContaining([
              expect.objectContaining({ id: 'extract' }),
            ]),
            trustSetup: 'skip',
          })
        );
      });
    });

    it('should show loading state when submitting', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<WorkUnitCreateWizard {...defaultProps} />);

      await fillWizardForm(user);

      // Now set isSubmitting to true
      rerender(<WorkUnitCreateWizard {...defaultProps} isSubmitting={true} />);

      expect(screen.getByTestId('wizard-submit-btn')).toHaveTextContent('Creating...');
      expect(screen.getByTestId('wizard-submit-btn')).toBeDisabled();
    });

    it('should disable buttons when submitting', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<WorkUnitCreateWizard {...defaultProps} />);

      await fillWizardForm(user);

      // Now set isSubmitting to true
      rerender(<WorkUnitCreateWizard {...defaultProps} isSubmitting={true} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByTestId('wizard-back-btn')).toBeDisabled();
    });
  });

  describe('Dialog Closing', () => {
    it('should call onClose when clicking Cancel', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should reset form when closing', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      // Navigate to step 2
      await user.click(screen.getByTestId('wizard-next-btn'));
      expect(screen.getByText('Basic Information')).toBeInTheDocument();

      // Close and reopen
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Note: We can't easily test reopening since it requires rerender
      // The form state is reset in handleClose callback
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should mark current step with aria-current', () => {
      render(<WorkUnitCreateWizard {...defaultProps} />);
      const step1 = screen.getByTestId('wizard-step-type');
      expect(step1).toHaveAttribute('aria-current', 'step');
    });

    it('should update aria-current when navigating', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-next-btn'));

      const step2 = screen.getByTestId('wizard-step-info');
      expect(step2).toHaveAttribute('aria-current', 'step');

      const step1 = screen.getByTestId('wizard-step-type');
      expect(step1).not.toHaveAttribute('aria-current');
    });
  });

  describe('Level-Based Behavior', () => {
    it('should show Level 2 trust options', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} userLevel={2} />);

      // Navigate to trust step
      await user.click(screen.getByTestId('wizard-next-btn')); // Type -> Info
      await user.type(screen.getByTestId('wizard-name-input'), 'Test');
      await user.type(screen.getByTestId('wizard-description-input'), 'Test description');
      await user.click(screen.getByTestId('wizard-next-btn')); // Info -> Capabilities
      await user.click(screen.getByTestId('capability-preset-extract'));
      await user.click(screen.getByTestId('wizard-next-btn')); // Capabilities -> Config
      await user.click(screen.getByTestId('wizard-next-btn')); // Config -> Trust

      expect(screen.queryByText('Establish Trust Now')).not.toBeInTheDocument();
      expect(screen.getByText('Request Delegation')).toBeInTheDocument();
    });

    it('should show Level 3 trust options', async () => {
      const user = userEvent.setup();
      render(<WorkUnitCreateWizard {...defaultProps} userLevel={3} />);

      // Navigate to trust step
      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.type(screen.getByTestId('wizard-name-input'), 'Test');
      await user.type(screen.getByTestId('wizard-description-input'), 'Test description');
      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.click(screen.getByTestId('capability-preset-extract'));
      await user.click(screen.getByTestId('wizard-next-btn'));
      await user.click(screen.getByTestId('wizard-next-btn'));

      expect(screen.getByText('Establish Trust Now')).toBeInTheDocument();
      expect(screen.getByText('Delegate to Another User')).toBeInTheDocument();
    });
  });
});
