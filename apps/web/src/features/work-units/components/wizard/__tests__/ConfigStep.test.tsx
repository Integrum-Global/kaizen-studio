/**
 * ConfigStep Component Tests
 *
 * Tests for the work unit configuration step.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigStep } from '../ConfigStep';
import { defaultFormData } from '../types';
import type { WorkspaceRef } from '../../../types';

describe('ConfigStep', () => {
  const mockWorkspaces: WorkspaceRef[] = [
    { id: 'ws-1', name: 'Finance', color: 'blue' },
    { id: 'ws-2', name: 'Operations', color: 'green' },
  ];

  const defaultProps = {
    formData: { ...defaultFormData },
    onChange: vi.fn(),
    errors: {},
    workspaces: mockWorkspaces,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the step heading', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('should render the step description', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(
        screen.getByText(/Organize your work unit by assigning it to a workspace/i)
      ).toBeInTheDocument();
    });

    it('should render workspace select', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByLabelText('Workspace')).toBeInTheDocument();
    });

    it('should render tag input', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    });

    it('should render add tag button', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByTestId('add-tag-btn')).toBeInTheDocument();
    });

    it('should render configuration summary', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByText('Configuration Summary')).toBeInTheDocument();
    });
  });

  describe('Workspace Selection', () => {
    it('should show workspaces in dropdown', async () => {
      const user = userEvent.setup();
      render(<ConfigStep {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-workspace-select'));

      expect(screen.getByRole('option', { name: /No workspace/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Finance/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Operations/i })).toBeInTheDocument();
    });

    it('should call onChange when selecting a workspace', async () => {
      const user = userEvent.setup();
      render(<ConfigStep {...defaultProps} />);

      await user.click(screen.getByTestId('wizard-workspace-select'));
      await user.click(screen.getByRole('option', { name: /Finance/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({ workspaceId: 'ws-1' });
    });

    it('should call onChange with undefined when selecting "No workspace"', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, workspaceId: 'ws-1' },
      };
      render(<ConfigStep {...props} />);

      await user.click(screen.getByTestId('wizard-workspace-select'));
      await user.click(screen.getByRole('option', { name: /No workspace/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({ workspaceId: undefined });
    });

    it('should show selected workspace in summary', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, workspaceId: 'ws-1' },
      };
      render(<ConfigStep {...props} />);

      // The summary section should contain the workspace name
      const summarySection = screen.getByText('Configuration Summary').parentElement;
      expect(summarySection).toHaveTextContent('Finance');
    });

    it('should show "Not assigned" in summary when no workspace', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByText('Not assigned')).toBeInTheDocument();
    });

    it('should use default workspaces when none provided', async () => {
      const user = userEvent.setup();
      const props = { ...defaultProps, workspaces: [] };
      render(<ConfigStep {...props} />);

      await user.click(screen.getByTestId('wizard-workspace-select'));

      // Default workspaces are used
      expect(screen.getByRole('option', { name: /Engineering/i })).toBeInTheDocument();
    });
  });

  describe('Tag Management', () => {
    it('should disable add button when input is empty', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByTestId('add-tag-btn')).toBeDisabled();
    });

    it('should enable add button when input has text', async () => {
      const user = userEvent.setup();
      render(<ConfigStep {...defaultProps} />);

      await user.type(screen.getByTestId('wizard-tag-input'), 'test-tag');

      expect(screen.getByTestId('add-tag-btn')).not.toBeDisabled();
    });

    it('should call onChange when adding a tag', async () => {
      const user = userEvent.setup();
      render(<ConfigStep {...defaultProps} />);

      await user.type(screen.getByTestId('wizard-tag-input'), 'test-tag');
      await user.click(screen.getByTestId('add-tag-btn'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({ tags: ['test-tag'] });
    });

    it('should add tag on Enter key', async () => {
      const user = userEvent.setup();
      render(<ConfigStep {...defaultProps} />);

      await user.type(screen.getByTestId('wizard-tag-input'), 'test-tag{enter}');

      expect(defaultProps.onChange).toHaveBeenCalledWith({ tags: ['test-tag'] });
    });

    it('should normalize tags to lowercase', async () => {
      const user = userEvent.setup();
      render(<ConfigStep {...defaultProps} />);

      await user.type(screen.getByTestId('wizard-tag-input'), 'TEST-TAG');
      await user.click(screen.getByTestId('add-tag-btn'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({ tags: ['test-tag'] });
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, tags: ['existing'] },
      };
      render(<ConfigStep {...props} />);

      await user.type(screen.getByTestId('wizard-tag-input'), 'existing');
      await user.click(screen.getByTestId('add-tag-btn'));

      // onChange should not be called with duplicate
      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });

    it('should display existing tags', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, tags: ['tag1', 'tag2'] },
      };
      render(<ConfigStep {...props} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should call onChange when removing a tag', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, tags: ['tag1', 'tag2'] },
      };
      render(<ConfigStep {...props} />);

      await user.click(screen.getByRole('button', { name: /Remove tag tag1/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({ tags: ['tag2'] });
    });

    it('should show tags in summary', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, tags: ['tag1', 'tag2'] },
      };
      render(<ConfigStep {...props} />);

      expect(screen.getByText('tag1, tag2')).toBeInTheDocument();
    });

    it('should show "None" in summary when no tags', () => {
      render(<ConfigStep {...defaultProps} />);
      expect(screen.getByText('None')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display workspace error when provided', () => {
      const props = {
        ...defaultProps,
        errors: { workspaceId: 'Please select a workspace' },
      };
      render(<ConfigStep {...props} />);

      expect(screen.getByText('Please select a workspace')).toBeInTheDocument();
    });

    it('should display tags error when provided', () => {
      const props = {
        ...defaultProps,
        errors: { tags: 'Invalid tag' },
      };
      render(<ConfigStep {...props} />);

      expect(screen.getByText('Invalid tag')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<ConfigStep {...defaultProps} />);

      expect(screen.getByLabelText('Workspace')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    });

    it('should have accessible remove buttons for tags', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, tags: ['test'] },
      };
      render(<ConfigStep {...props} />);

      expect(
        screen.getByRole('button', { name: /Remove tag test/i })
      ).toBeInTheDocument();
    });
  });
});
