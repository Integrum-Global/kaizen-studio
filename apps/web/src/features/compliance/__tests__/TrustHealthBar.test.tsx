/**
 * TrustHealthBar Tests
 *
 * Tests for the trust health bar component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustHealthBar } from '../components/TrustHealthBar';

describe('TrustHealthBar', () => {
  describe('Basic Rendering', () => {
    it('should render with test id', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={5} revoked={5} />);
      expect(screen.getByTestId('trust-health-bar')).toBeInTheDocument();
    });

    it('should display Trust Health title', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={5} revoked={5} />);
      expect(screen.getByText('Trust Health')).toBeInTheDocument();
    });

    it('should render bar container', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={5} revoked={5} />);
      expect(screen.getByTestId('health-bar-container')).toBeInTheDocument();
    });
  });

  describe('Percentage Display', () => {
    it('should display health percentage by default', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={5} revoked={5} />);
      expect(screen.getByTestId('health-percentage')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should hide percentage when showPercentage is false', () => {
      render(
        <TrustHealthBar
          valid={80}
          expiring={10}
          expired={5}
          revoked={5}
          showPercentage={false}
        />
      );
      expect(screen.queryByTestId('health-percentage')).not.toBeInTheDocument();
    });

    it('should round percentage correctly', () => {
      render(<TrustHealthBar valid={87} expiring={13} expired={0} revoked={0} />);
      expect(screen.getByText('87%')).toBeInTheDocument();
    });
  });

  describe('Legend Display', () => {
    it('should display legend by default', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={5} revoked={5} />);
      expect(screen.getByTestId('health-legend')).toBeInTheDocument();
    });

    it('should hide legend when showLegend is false', () => {
      render(
        <TrustHealthBar
          valid={80}
          expiring={10}
          expired={5}
          revoked={5}
          showLegend={false}
        />
      );
      expect(screen.queryByTestId('health-legend')).not.toBeInTheDocument();
    });

    it('should display valid count in legend', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={5} revoked={5} />);
      expect(screen.getByText(/Valid:/)).toBeInTheDocument();
      // 80 appears in percentage and in the legend, verify legend contains it
      const legend = screen.getByTestId('health-legend');
      expect(legend).toHaveTextContent('80');
    });

    it('should display expiring count in legend when > 0', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={0} revoked={0} />);
      expect(screen.getByText(/Expiring:/)).toBeInTheDocument();
    });

    it('should not display expiring in legend when 0', () => {
      render(<TrustHealthBar valid={100} expiring={0} expired={0} revoked={0} />);
      expect(screen.queryByText(/Expiring:/)).not.toBeInTheDocument();
    });
  });

  describe('Bar Segments', () => {
    it('should render valid segment', () => {
      render(<TrustHealthBar valid={100} expiring={0} expired={0} revoked={0} />);
      expect(screen.getByTestId('segment-valid')).toBeInTheDocument();
    });

    it('should render expiring segment when count > 0', () => {
      render(<TrustHealthBar valid={80} expiring={20} expired={0} revoked={0} />);
      expect(screen.getByTestId('segment-valid')).toBeInTheDocument();
      expect(screen.getByTestId('segment-expiring')).toBeInTheDocument();
    });

    it('should render all segments when all have values', () => {
      render(<TrustHealthBar valid={70} expiring={15} expired={10} revoked={5} />);
      expect(screen.getByTestId('segment-valid')).toBeInTheDocument();
      expect(screen.getByTestId('segment-expiring')).toBeInTheDocument();
      expect(screen.getByTestId('segment-expired')).toBeInTheDocument();
      expect(screen.getByTestId('segment-revoked')).toBeInTheDocument();
    });

    it('should not render segments with zero values', () => {
      render(<TrustHealthBar valid={100} expiring={0} expired={0} revoked={0} />);
      expect(screen.queryByTestId('segment-expiring')).not.toBeInTheDocument();
      expect(screen.queryByTestId('segment-expired')).not.toBeInTheDocument();
      expect(screen.queryByTestId('segment-revoked')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when all values are 0', () => {
      render(<TrustHealthBar valid={0} expiring={0} expired={0} revoked={0} />);
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByText('No trust relationships to display')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should show green percentage for 90%+ health', () => {
      render(<TrustHealthBar valid={95} expiring={5} expired={0} revoked={0} />);
      const percentage = screen.getByTestId('health-percentage');
      expect(percentage.className).toContain('text-green');
    });

    it('should show amber percentage for 70-89% health', () => {
      render(<TrustHealthBar valid={75} expiring={15} expired={10} revoked={0} />);
      const percentage = screen.getByTestId('health-percentage');
      expect(percentage.className).toContain('text-amber');
    });

    it('should show red percentage for <70% health', () => {
      render(<TrustHealthBar valid={50} expiring={20} expired={20} revoked={10} />);
      const percentage = screen.getByTestId('health-percentage');
      expect(percentage.className).toContain('text-red');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(
        <TrustHealthBar
          valid={80}
          expiring={10}
          expired={5}
          revoked={5}
          className="custom-class"
        />
      );
      const container = screen.getByTestId('trust-health-bar');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Animation', () => {
    it('should have transition class by default', () => {
      render(<TrustHealthBar valid={80} expiring={10} expired={5} revoked={5} />);
      const segment = screen.getByTestId('segment-valid');
      expect(segment.className).toContain('transition');
    });

    it('should not have transition class when animate is false', () => {
      render(
        <TrustHealthBar
          valid={80}
          expiring={10}
          expired={5}
          revoked={5}
          animate={false}
        />
      );
      const segment = screen.getByTestId('segment-valid');
      expect(segment.className).not.toContain('transition');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single value (all valid)', () => {
      render(<TrustHealthBar valid={100} expiring={0} expired={0} revoked={0} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle very small percentages', () => {
      render(<TrustHealthBar valid={999} expiring={1} expired={0} revoked={0} />);
      expect(screen.getByTestId('segment-expiring')).toBeInTheDocument();
    });

    it('should handle all expired/revoked', () => {
      render(<TrustHealthBar valid={0} expiring={0} expired={50} revoked={50} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
