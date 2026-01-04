/**
 * TrustStatusBadge Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrustStatusBadge } from '../TrustStatusBadge';

describe('TrustStatusBadge', () => {
  describe('status display', () => {
    it('should render valid status with correct label', () => {
      render(<TrustStatusBadge status="valid" />);

      expect(screen.getByText('Trust Valid')).toBeInTheDocument();
    });

    it('should render expired status with correct label', () => {
      render(<TrustStatusBadge status="expired" />);

      expect(screen.getByText('Trust Expired')).toBeInTheDocument();
    });

    it('should render revoked status with correct label', () => {
      render(<TrustStatusBadge status="revoked" />);

      expect(screen.getByText('Trust Revoked')).toBeInTheDocument();
    });

    it('should render pending status with correct label', () => {
      render(<TrustStatusBadge status="pending" />);

      expect(screen.getByText('Setup Pending')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('should render md size by default', () => {
      render(<TrustStatusBadge status="valid" />);

      expect(screen.getByText('Trust Valid')).toBeInTheDocument();
    });

    it('should render short label for sm size', () => {
      render(<TrustStatusBadge status="valid" size="sm" />);

      expect(screen.getByText('Valid')).toBeInTheDocument();
    });

    it('should render short labels for all statuses in sm size', () => {
      const { rerender } = render(<TrustStatusBadge status="valid" size="sm" />);
      expect(screen.getByText('Valid')).toBeInTheDocument();

      rerender(<TrustStatusBadge status="expired" size="sm" />);
      expect(screen.getByText('Expired')).toBeInTheDocument();

      rerender(<TrustStatusBadge status="revoked" size="sm" />);
      expect(screen.getByText('Revoked')).toBeInTheDocument();

      rerender(<TrustStatusBadge status="pending" size="sm" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('click functionality', () => {
    it('should call onClick when provided', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<TrustStatusBadge status="valid" onClick={handleClick} />);

      const badge = screen.getByRole('button');
      await user.click(badge);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render as span when onClick is not provided', () => {
      render(<TrustStatusBadge status="valid" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render as button when onClick is provided', () => {
      render(<TrustStatusBadge status="valid" onClick={() => {}} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('expiry display', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should not show expiry by default', () => {
      const futureDate = new Date('2024-01-20T12:00:00Z').toISOString();
      render(<TrustStatusBadge status="valid" expiresAt={futureDate} />);

      expect(screen.queryByText(/\d+d/)).not.toBeInTheDocument();
    });

    it('should show expiry when showExpiry is true and status is valid', () => {
      const futureDate = new Date('2024-01-20T12:00:00Z').toISOString();
      render(
        <TrustStatusBadge
          status="valid"
          expiresAt={futureDate}
          showExpiry
        />
      );

      expect(screen.getByText('(5d)')).toBeInTheDocument();
    });

    it('should not show expiry for non-valid statuses', () => {
      const futureDate = new Date('2024-01-20T12:00:00Z').toISOString();
      render(
        <TrustStatusBadge
          status="expired"
          expiresAt={futureDate}
          showExpiry
        />
      );

      expect(screen.queryByText(/\(\d+d\)/)).not.toBeInTheDocument();
    });

    it('should show hours when less than a day', () => {
      const futureDate = new Date('2024-01-15T20:00:00Z').toISOString();
      render(
        <TrustStatusBadge
          status="valid"
          expiresAt={futureDate}
          showExpiry
        />
      );

      expect(screen.getByText('(8h)')).toBeInTheDocument();
    });

    it('should show months when more than 30 days', () => {
      const futureDate = new Date('2024-04-15T12:00:00Z').toISOString();
      render(
        <TrustStatusBadge
          status="valid"
          expiresAt={futureDate}
          showExpiry
        />
      );

      expect(screen.getByText('(3mo)')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have correct aria-label for status', () => {
      render(<TrustStatusBadge status="valid" />);

      expect(
        screen.getByLabelText('Trust status: Trust Valid')
      ).toBeInTheDocument();
    });

    it('should include expiry in aria-label when shown', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const futureDate = new Date('2024-01-20T12:00:00Z').toISOString();
      render(
        <TrustStatusBadge
          status="valid"
          expiresAt={futureDate}
          showExpiry
        />
      );

      expect(
        screen.getByLabelText(/Trust status: Trust Valid, expires in 5d/)
      ).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('styling', () => {
    it('should apply valid status colors', () => {
      const { container } = render(<TrustStatusBadge status="valid" />);

      const badge = container.querySelector('.bg-green-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply expired status colors', () => {
      const { container } = render(<TrustStatusBadge status="expired" />);

      const badge = container.querySelector('.bg-amber-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply revoked status colors', () => {
      const { container } = render(<TrustStatusBadge status="revoked" />);

      const badge = container.querySelector('.bg-red-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply pending status colors', () => {
      const { container } = render(<TrustStatusBadge status="pending" />);

      const badge = container.querySelector('.bg-gray-100');
      expect(badge).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <TrustStatusBadge status="valid" className="custom-class" />
      );

      const badge = container.querySelector('.custom-class');
      expect(badge).toBeInTheDocument();
    });
  });
});
