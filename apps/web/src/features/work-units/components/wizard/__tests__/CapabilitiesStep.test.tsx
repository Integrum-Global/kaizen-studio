/**
 * CapabilitiesStep Component Tests
 *
 * Tests for the work unit capabilities selection step.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapabilitiesStep } from '../CapabilitiesStep';
import { defaultFormData, CAPABILITY_PRESETS } from '../types';

describe('CapabilitiesStep', () => {
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
      render(<CapabilitiesStep {...defaultProps} />);
      expect(screen.getByText('Define Capabilities')).toBeInTheDocument();
    });

    it('should render the step description', () => {
      render(<CapabilitiesStep {...defaultProps} />);
      expect(
        screen.getByText(/Select what this work unit can do/i)
      ).toBeInTheDocument();
    });

    it('should render common capabilities section', () => {
      render(<CapabilitiesStep {...defaultProps} />);
      expect(screen.getByText('Common Capabilities')).toBeInTheDocument();
    });

    it('should render all preset capabilities', () => {
      render(<CapabilitiesStep {...defaultProps} />);
      CAPABILITY_PRESETS.forEach((preset) => {
        expect(screen.getByText(preset.name)).toBeInTheDocument();
      });
    });

    it('should render custom capabilities section', () => {
      render(<CapabilitiesStep {...defaultProps} />);
      expect(screen.getByText('Custom Capabilities')).toBeInTheDocument();
    });

    it('should render add custom button', () => {
      render(<CapabilitiesStep {...defaultProps} />);
      expect(screen.getByTestId('add-custom-capability-btn')).toBeInTheDocument();
    });

    it('should show hint when no capabilities selected', () => {
      render(<CapabilitiesStep {...defaultProps} />);
      expect(
        screen.getByText(/Select at least one capability for your work unit/i)
      ).toBeInTheDocument();
    });
  });

  describe('Preset Selection', () => {
    it('should call onChange when selecting a preset', async () => {
      const user = userEvent.setup();
      render(<CapabilitiesStep {...defaultProps} />);

      await user.click(screen.getByTestId('capability-preset-extract'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        capabilities: [CAPABILITY_PRESETS.find((p) => p.id === 'extract')],
      });
    });

    it('should call onChange to remove when deselecting a preset', async () => {
      const user = userEvent.setup();
      const selectedCapability = CAPABILITY_PRESETS.find((p) => p.id === 'extract')!;
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          capabilities: [selectedCapability],
        },
      };
      render(<CapabilitiesStep {...props} />);

      await user.click(screen.getByTestId('capability-preset-extract'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        capabilities: [],
      });
    });

    it('should show checkmark for selected presets', () => {
      const selectedCapability = CAPABILITY_PRESETS.find((p) => p.id === 'extract')!;
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          capabilities: [selectedCapability],
        },
      };
      render(<CapabilitiesStep {...props} />);

      const presetButton = screen.getByTestId('capability-preset-extract');
      expect(presetButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should allow selecting multiple presets', async () => {
      const user = userEvent.setup();
      const firstCapability = CAPABILITY_PRESETS.find((p) => p.id === 'extract')!;
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          capabilities: [firstCapability],
        },
      };
      render(<CapabilitiesStep {...props} />);

      await user.click(screen.getByTestId('capability-preset-validate'));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        capabilities: [
          firstCapability,
          CAPABILITY_PRESETS.find((p) => p.id === 'validate'),
        ],
      });
    });
  });

  describe('Custom Capability Form', () => {
    it('should show custom form when clicking add custom button', async () => {
      const user = userEvent.setup();
      render(<CapabilitiesStep {...defaultProps} />);

      await user.click(screen.getByTestId('add-custom-capability-btn'));

      expect(screen.getByTestId('custom-capability-name')).toBeInTheDocument();
      expect(screen.getByTestId('custom-capability-type')).toBeInTheDocument();
      expect(screen.getByTestId('custom-capability-description')).toBeInTheDocument();
    });

    it('should add custom capability when form is filled and submitted', async () => {
      const user = userEvent.setup();
      render(<CapabilitiesStep {...defaultProps} />);

      await user.click(screen.getByTestId('add-custom-capability-btn'));
      await user.type(screen.getByTestId('custom-capability-name'), 'My Custom');
      await user.type(
        screen.getByTestId('custom-capability-description'),
        'My custom description'
      );
      await user.click(screen.getByTestId('save-custom-capability-btn'));

      expect(defaultProps.onChange).toHaveBeenCalled();
      const lastCall = defaultProps.onChange.mock.calls[
        defaultProps.onChange.mock.calls.length - 1
      ][0];
      expect(lastCall.capabilities[0].name).toBe('My Custom');
      expect(lastCall.capabilities[0].description).toBe('My custom description');
    });

    it('should disable save button when form is incomplete', async () => {
      const user = userEvent.setup();
      render(<CapabilitiesStep {...defaultProps} />);

      await user.click(screen.getByTestId('add-custom-capability-btn'));

      const saveButton = screen.getByTestId('save-custom-capability-btn');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is complete', async () => {
      const user = userEvent.setup();
      render(<CapabilitiesStep {...defaultProps} />);

      await user.click(screen.getByTestId('add-custom-capability-btn'));
      await user.type(screen.getByTestId('custom-capability-name'), 'Custom');
      await user.type(screen.getByTestId('custom-capability-description'), 'Description');

      const saveButton = screen.getByTestId('save-custom-capability-btn');
      expect(saveButton).not.toBeDisabled();
    });

    it('should hide custom form when clicking cancel', async () => {
      const user = userEvent.setup();
      render(<CapabilitiesStep {...defaultProps} />);

      await user.click(screen.getByTestId('add-custom-capability-btn'));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByTestId('custom-capability-name')).not.toBeInTheDocument();
    });

    it('should reset form after adding custom capability', async () => {
      const user = userEvent.setup();
      render(<CapabilitiesStep {...defaultProps} />);

      await user.click(screen.getByTestId('add-custom-capability-btn'));
      await user.type(screen.getByTestId('custom-capability-name'), 'Custom');
      await user.type(screen.getByTestId('custom-capability-description'), 'Description');
      await user.click(screen.getByTestId('save-custom-capability-btn'));

      // Form should be hidden after save
      expect(screen.queryByTestId('custom-capability-name')).not.toBeInTheDocument();
    });
  });

  describe('Selected Capabilities Summary', () => {
    it('should not show summary when no capabilities selected', () => {
      render(<CapabilitiesStep {...defaultProps} />);
      expect(screen.queryByText(/Selected Capabilities/i)).not.toBeInTheDocument();
    });

    it('should show summary when capabilities are selected', () => {
      const selectedCapability = CAPABILITY_PRESETS.find((p) => p.id === 'extract')!;
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          capabilities: [selectedCapability],
        },
      };
      render(<CapabilitiesStep {...props} />);

      expect(screen.getByText('Selected Capabilities (1)')).toBeInTheDocument();
    });

    it('should show correct count for multiple capabilities', () => {
      const capabilities = CAPABILITY_PRESETS.slice(0, 3);
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          capabilities,
        },
      };
      render(<CapabilitiesStep {...props} />);

      expect(screen.getByText('Selected Capabilities (3)')).toBeInTheDocument();
    });

    it('should allow removing capabilities from summary', async () => {
      const user = userEvent.setup();
      const selectedCapability = CAPABILITY_PRESETS.find((p) => p.id === 'extract')!;
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          capabilities: [selectedCapability],
        },
      };
      render(<CapabilitiesStep {...props} />);

      await user.click(screen.getByRole('button', { name: /Remove Extract/i }));

      expect(defaultProps.onChange).toHaveBeenCalledWith({
        capabilities: [],
      });
    });
  });

  describe('Error Handling', () => {
    it('should display capabilities error when provided', () => {
      const props = {
        ...defaultProps,
        errors: { capabilities: 'Please add at least one capability' },
      };
      render(<CapabilitiesStep {...props} />);

      expect(
        screen.getByText('Please add at least one capability')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons for preset selection', () => {
      render(<CapabilitiesStep {...defaultProps} />);

      const button = screen.getByTestId('capability-preset-extract');
      expect(button).toHaveAttribute('aria-pressed');
    });

    it('should have accessible remove buttons', () => {
      const selectedCapability = CAPABILITY_PRESETS.find((p) => p.id === 'extract')!;
      const props = {
        ...defaultProps,
        formData: {
          ...defaultFormData,
          capabilities: [selectedCapability],
        },
      };
      render(<CapabilitiesStep {...props} />);

      expect(
        screen.getByRole('button', { name: /Remove Extract/i })
      ).toBeInTheDocument();
    });
  });
});
