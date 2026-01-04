/**
 * InfoStep Component Tests
 *
 * Tests for the work unit basic info step.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoStep } from '../InfoStep';
import { defaultFormData } from '../types';

describe('InfoStep', () => {
  const defaultProps = {
    formData: { ...defaultFormData },
    onChange: vi.fn(),
    errors: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the step heading', () => {
      render(<InfoStep {...defaultProps} />);
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    it('should render the step description', () => {
      render(<InfoStep {...defaultProps} />);
      expect(
        screen.getByText(/Give your work unit a clear name and description/i)
      ).toBeInTheDocument();
    });

    it('should render name input field', () => {
      render(<InfoStep {...defaultProps} />);
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Invoice Data Extractor/i)).toBeInTheDocument();
    });

    it('should render description textarea', () => {
      render(<InfoStep {...defaultProps} />);
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Describe what this work unit does/i)
      ).toBeInTheDocument();
    });

    it('should render required indicators', () => {
      render(<InfoStep {...defaultProps} />);
      const labels = screen.getAllByText('*');
      expect(labels.length).toBeGreaterThanOrEqual(2);
    });

    it('should show helper text for name field', () => {
      render(<InfoStep {...defaultProps} />);
      expect(
        screen.getByText(/Choose a descriptive name that clearly indicates/i)
      ).toBeInTheDocument();
    });

    it('should show helper text for description field', () => {
      render(<InfoStep {...defaultProps} />);
      expect(
        screen.getByText(/Explain what this work unit does and how it should be used/i)
      ).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should call onChange when typing in name field', async () => {
      const user = userEvent.setup();
      render(<InfoStep {...defaultProps} />);

      const nameInput = screen.getByTestId('wizard-name-input');
      await user.type(nameInput, 'A');

      // Should be called for the typed character
      expect(defaultProps.onChange).toHaveBeenCalledWith({ name: 'A' });
    });

    it('should call onChange when typing in description field', async () => {
      const user = userEvent.setup();
      render(<InfoStep {...defaultProps} />);

      const descInput = screen.getByTestId('wizard-description-input');
      await user.type(descInput, 'A');

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        description: 'A',
      });
    });

    it('should display initial name value from form data', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, name: 'Initial Name' },
      };
      render(<InfoStep {...props} />);

      const nameInput = screen.getByTestId('wizard-name-input');
      expect(nameInput).toHaveValue('Initial Name');
    });

    it('should display initial description value from form data', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, description: 'Initial Description' },
      };
      render(<InfoStep {...props} />);

      const descInput = screen.getByTestId('wizard-description-input');
      expect(descInput).toHaveValue('Initial Description');
    });
  });

  describe('Preview', () => {
    it('should not show preview when name and description are empty', () => {
      render(<InfoStep {...defaultProps} />);
      expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    });

    it('should show preview when name is provided', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, name: 'My Work Unit' },
      };
      render(<InfoStep {...props} />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('My Work Unit')).toBeInTheDocument();
    });

    it('should show preview with description when both are provided', () => {
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          name: 'My Work Unit',
          description: 'This is a test description',
        },
      };
      render(<InfoStep {...props} />);

      expect(screen.getByText('Preview')).toBeInTheDocument();
      // Name appears in the preview section
      const previewSection = screen.getByText('Preview').parentElement;
      expect(previewSection).toHaveTextContent('My Work Unit');
      expect(previewSection).toHaveTextContent('This is a test description');
    });

    it('should show "Untitled Work Unit" as fallback when only description is provided', () => {
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          name: '',
          description: 'This is a test description',
        },
      };
      render(<InfoStep {...props} />);

      expect(screen.getByText('Untitled Work Unit')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display name error when provided', () => {
      const props = {
        ...defaultProps,
        errors: { name: 'Name is required' },
      };
      render(<InfoStep {...props} />);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('should display description error when provided', () => {
      const props = {
        ...defaultProps,
        errors: { description: 'Description is required' },
      };
      render(<InfoStep {...props} />);

      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should display both errors when both are provided', () => {
      const props = {
        ...defaultProps,
        errors: {
          name: 'Name is required',
          description: 'Description is required',
        },
      };
      render(<InfoStep {...props} />);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should apply error styling to name input', () => {
      const props = {
        ...defaultProps,
        errors: { name: 'Name is required' },
      };
      render(<InfoStep {...props} />);

      const nameInput = screen.getByTestId('wizard-name-input');
      expect(nameInput).toHaveClass('border-destructive');
    });

    it('should apply error styling to description textarea', () => {
      const props = {
        ...defaultProps,
        errors: { description: 'Description is required' },
      };
      render(<InfoStep {...props} />);

      const descInput = screen.getByTestId('wizard-description-input');
      expect(descInput).toHaveClass('border-destructive');
    });

    it('should replace helper text with error message', () => {
      const props = {
        ...defaultProps,
        errors: { name: 'Name is required' },
      };
      render(<InfoStep {...props} />);

      expect(
        screen.queryByText(/Choose a descriptive name that clearly indicates/i)
      ).not.toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<InfoStep {...defaultProps} />);

      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it('should have aria-describedby for error messages', () => {
      const props = {
        ...defaultProps,
        errors: { name: 'Name is required' },
      };
      render(<InfoStep {...props} />);

      const nameInput = screen.getByTestId('wizard-name-input');
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
    });

    it('should mark error messages as alerts', () => {
      const props = {
        ...defaultProps,
        errors: { name: 'Name is required' },
      };
      render(<InfoStep {...props} />);

      expect(screen.getByRole('alert')).toHaveTextContent('Name is required');
    });
  });
});
