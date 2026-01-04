/**
 * WorkUnitIcon Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkUnitIcon } from '../WorkUnitIcon';

describe('WorkUnitIcon', () => {
  describe('atomic type', () => {
    it('should render atomic icon with correct aria-label', () => {
      render(<WorkUnitIcon type="atomic" />);

      const icon = screen.getByRole('img', { name: 'Atomic work unit' });
      expect(icon).toBeInTheDocument();
    });

    it('should apply correct size classes for sm', () => {
      const { container } = render(<WorkUnitIcon type="atomic" size="sm" />);

      const iconContainer = container.querySelector('.w-8.h-8');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply correct size classes for md (default)', () => {
      const { container } = render(<WorkUnitIcon type="atomic" />);

      const iconContainer = container.querySelector('.w-12.h-12');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply correct size classes for lg', () => {
      const { container } = render(<WorkUnitIcon type="atomic" size="lg" />);

      const iconContainer = container.querySelector('.w-16.h-16');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('composite type', () => {
    it('should render composite icon with correct aria-label', () => {
      render(<WorkUnitIcon type="composite" />);

      const icon = screen.getByRole('img', { name: 'Composite work unit' });
      expect(icon).toBeInTheDocument();
    });

    it('should render stacked circles for composite type', () => {
      const { container } = render(<WorkUnitIcon type="composite" />);

      // Composite icons have multiple circle elements for the stacked effect
      const circles = container.querySelectorAll('svg');
      expect(circles.length).toBeGreaterThan(1);
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <WorkUnitIcon type="atomic" className="custom-class" />
      );

      const iconContainer = container.querySelector('.custom-class');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have rounded background', () => {
      const { container } = render(<WorkUnitIcon type="atomic" />);

      const iconContainer = container.querySelector('.rounded-lg');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should have muted background', () => {
      const { container } = render(<WorkUnitIcon type="composite" />);

      const iconContainer = container.querySelector('.bg-muted');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
