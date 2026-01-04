/**
 * TypeStep Component Tests
 *
 * Tests for the work unit type selection step.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TypeStep } from '../TypeStep';
import type { CreateWorkUnitFormData } from '../types';
import { defaultFormData } from '../types';

describe('TypeStep', () => {
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
      render(<TypeStep {...defaultProps} />);
      expect(screen.getByText('What type of work unit?')).toBeInTheDocument();
    });

    it('should render the step description', () => {
      render(<TypeStep {...defaultProps} />);
      expect(
        screen.getByText(/Choose the type that best describes what this work unit will do/i)
      ).toBeInTheDocument();
    });

    it('should render atomic option with icon and description', () => {
      render(<TypeStep {...defaultProps} />);
      expect(screen.getByText('Atomic Work Unit')).toBeInTheDocument();
      expect(
        screen.getByText(/A single capability that executes directly/i)
      ).toBeInTheDocument();
    });

    it('should render composite option with icon and description', () => {
      render(<TypeStep {...defaultProps} />);
      expect(screen.getByText('Composite Work Unit')).toBeInTheDocument();
      expect(
        screen.getByText(/Orchestrates multiple work units for complex/i)
      ).toBeInTheDocument();
    });

    it('should render example tags for atomic type', () => {
      render(<TypeStep {...defaultProps} />);
      expect(screen.getByText('Data extraction')).toBeInTheDocument();
      expect(screen.getByText('Document analysis')).toBeInTheDocument();
      expect(screen.getByText('Validation')).toBeInTheDocument();
    });

    it('should render example tags for composite type', () => {
      render(<TypeStep {...defaultProps} />);
      expect(screen.getByText('Invoice processing')).toBeInTheDocument();
      expect(screen.getByText('Report generation')).toBeInTheDocument();
      expect(screen.getByText('Approval workflows')).toBeInTheDocument();
    });

    it('should render radio buttons for type selection', () => {
      render(<TypeStep {...defaultProps} />);
      expect(screen.getByRole('radiogroup', { name: 'Work unit type' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Atomic Work Unit/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Composite Work Unit/i })).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should show atomic as selected by default', () => {
      render(<TypeStep {...defaultProps} />);
      const atomicRadio = screen.getByRole('radio', { name: /Atomic Work Unit/i });
      expect(atomicRadio).toBeChecked();
    });

    it('should call onChange when selecting atomic', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, type: 'composite' as const },
      };
      render(<TypeStep {...props} />);

      await user.click(screen.getByRole('radio', { name: /Atomic Work Unit/i }));
      expect(defaultProps.onChange).toHaveBeenCalledWith({ type: 'atomic' });
    });

    it('should call onChange when selecting composite', async () => {
      const user = userEvent.setup();
      render(<TypeStep {...defaultProps} />);

      await user.click(screen.getByRole('radio', { name: /Composite Work Unit/i }));
      expect(defaultProps.onChange).toHaveBeenCalledWith({ type: 'composite' });
    });

    it('should show composite as selected when form data type is composite', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultFormData, type: 'composite' as const },
      };
      render(<TypeStep {...props} />);

      const compositeRadio = screen.getByRole('radio', { name: /Composite Work Unit/i });
      expect(compositeRadio).toBeChecked();
    });

    it('should visually highlight the selected option', () => {
      render(<TypeStep {...defaultProps} />);
      const atomicLabel = screen.getByText('Atomic Work Unit').closest('label');
      expect(atomicLabel).toHaveClass('border-primary');
    });
  });

  describe('Error Handling', () => {
    it('should display type error when provided', () => {
      const props = {
        ...defaultProps,
        errors: { type: 'Please select a work unit type' },
      };
      render(<TypeStep {...props} />);

      expect(screen.getByRole('alert')).toHaveTextContent('Please select a work unit type');
    });

    it('should not display error when no error provided', () => {
      render(<TypeStep {...defaultProps} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible radio group', () => {
      render(<TypeStep {...defaultProps} />);
      expect(screen.getByRole('radiogroup', { name: 'Work unit type' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TypeStep {...defaultProps} />);

      // Focus on the atomic radio button first
      const atomicRadio = screen.getByRole('radio', { name: /Atomic Work Unit/i });
      await user.click(atomicRadio);

      // Arrow down should navigate to composite
      await user.keyboard('{ArrowDown}');

      // Radix RadioGroup uses arrow keys to navigate AND select
      // so onChange should have been called with composite
      const compositeRadio = screen.getByRole('radio', { name: /Composite Work Unit/i });
      expect(compositeRadio).toHaveFocus();
    });
  });
});
