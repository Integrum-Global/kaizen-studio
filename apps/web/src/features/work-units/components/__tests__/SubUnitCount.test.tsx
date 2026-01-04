/**
 * SubUnitCount Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubUnitCount } from '../SubUnitCount';

describe('SubUnitCount', () => {
  describe('count display', () => {
    it('should display singular form for count of 1', () => {
      render(<SubUnitCount count={1} />);

      expect(screen.getByText('Uses 1 unit')).toBeInTheDocument();
    });

    it('should display plural form for count greater than 1', () => {
      render(<SubUnitCount count={5} />);

      expect(screen.getByText('Uses 5 units')).toBeInTheDocument();
    });

    it('should display plural form for count of 0', () => {
      render(<SubUnitCount count={0} />);

      expect(screen.getByText('Uses 0 units')).toBeInTheDocument();
    });

    it('should display large numbers correctly', () => {
      render(<SubUnitCount count={100} />);

      expect(screen.getByText('Uses 100 units')).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('should call onClick when provided', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<SubUnitCount count={3} onClick={handleClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render as div when onClick is not provided', () => {
      render(<SubUnitCount count={3} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render as button when onClick is provided', () => {
      render(<SubUnitCount count={3} onClick={() => {}} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have cursor-pointer when clickable', () => {
      const { container } = render(<SubUnitCount count={3} onClick={() => {}} />);

      const button = container.querySelector('.cursor-pointer');
      expect(button).toBeInTheDocument();
    });

    it('should not have cursor-pointer when not clickable', () => {
      const { container } = render(<SubUnitCount count={3} />);

      const button = container.querySelector('.cursor-pointer');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have correct aria-label for singular', () => {
      render(<SubUnitCount count={1} />);

      expect(
        screen.getByLabelText('Uses 1 work unit')
      ).toBeInTheDocument();
    });

    it('should have correct aria-label for plural', () => {
      render(<SubUnitCount count={5} />);

      expect(
        screen.getByLabelText('Uses 5 work units')
      ).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SubUnitCount count={3} className="custom-class" />
      );

      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });

    it('should have muted text color', () => {
      const { container } = render(<SubUnitCount count={3} />);

      const element = container.querySelector('.text-muted-foreground');
      expect(element).toBeInTheDocument();
    });

    it('should have icon before text', () => {
      const { container } = render(<SubUnitCount count={3} />);

      // Layers icon should be present
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
