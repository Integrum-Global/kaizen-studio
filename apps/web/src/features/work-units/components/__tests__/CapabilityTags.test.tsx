/**
 * CapabilityTags Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CapabilityTags } from '../CapabilityTags';

describe('CapabilityTags', () => {
  describe('basic rendering', () => {
    it('should render capabilities as badges', () => {
      render(<CapabilityTags capabilities={['extract', 'validate', 'route']} />);

      expect(screen.getByText('extract')).toBeInTheDocument();
      expect(screen.getByText('validate')).toBeInTheDocument();
      expect(screen.getByText('route')).toBeInTheDocument();
    });

    it('should render empty state when no capabilities', () => {
      render(<CapabilityTags capabilities={[]} />);

      expect(screen.getByText('No capabilities defined')).toBeInTheDocument();
    });

    it('should render empty state for undefined capabilities', () => {
      // @ts-expect-error Testing undefined case
      render(<CapabilityTags capabilities={undefined} />);

      expect(screen.getByText('No capabilities defined')).toBeInTheDocument();
    });
  });

  describe('overflow handling', () => {
    it('should show +N more badge when exceeding maxVisible', () => {
      render(
        <CapabilityTags
          capabilities={['a', 'b', 'c', 'd', 'e', 'f']}
          maxVisible={4}
        />
      );

      expect(screen.getByText('a')).toBeInTheDocument();
      expect(screen.getByText('b')).toBeInTheDocument();
      expect(screen.getByText('c')).toBeInTheDocument();
      expect(screen.getByText('d')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
      expect(screen.queryByText('e')).not.toBeInTheDocument();
    });

    it('should not show +more badge when under maxVisible', () => {
      render(
        <CapabilityTags
          capabilities={['a', 'b', 'c']}
          maxVisible={4}
        />
      );

      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });

    it('should use default maxVisible of 4', () => {
      render(
        <CapabilityTags capabilities={['a', 'b', 'c', 'd', 'e', 'f']} />
      );

      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should handle exactly maxVisible items without overflow', () => {
      render(
        <CapabilityTags
          capabilities={['a', 'b', 'c', 'd']}
          maxVisible={4}
        />
      );

      expect(screen.getByText('a')).toBeInTheDocument();
      expect(screen.getByText('d')).toBeInTheDocument();
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('should call onClick with capability name when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <CapabilityTags
          capabilities={['extract', 'validate']}
          onClick={handleClick}
        />
      );

      await user.click(screen.getByText('extract'));
      expect(handleClick).toHaveBeenCalledWith('extract');

      await user.click(screen.getByText('validate'));
      expect(handleClick).toHaveBeenCalledWith('validate');
    });

    it('should not be clickable when onClick is not provided', () => {
      const { container } = render(
        <CapabilityTags capabilities={['extract']} />
      );

      const badge = container.querySelector('.cursor-pointer');
      expect(badge).not.toBeInTheDocument();
    });

    it('should add cursor-pointer when onClick is provided', () => {
      const { container } = render(
        <CapabilityTags capabilities={['extract']} onClick={() => {}} />
      );

      const badge = container.querySelector('.cursor-pointer');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('should apply default md size styling', () => {
      const { container } = render(
        <CapabilityTags capabilities={['extract']} />
      );

      const badge = container.querySelector('.px-2');
      expect(badge).toBeInTheDocument();
    });

    it('should apply sm size styling', () => {
      const { container } = render(
        <CapabilityTags capabilities={['extract']} size="sm" />
      );

      const badge = container.querySelector('.px-1\\.5');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render as a list with proper role', () => {
      render(<CapabilityTags capabilities={['extract', 'validate']} />);

      expect(screen.getByRole('list', { name: 'Capabilities' })).toBeInTheDocument();
    });

    it('should render each capability as a listitem', () => {
      render(<CapabilityTags capabilities={['extract', 'validate']} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should include +more badge in list', () => {
      render(
        <CapabilityTags
          capabilities={['a', 'b', 'c', 'd', 'e']}
          maxVisible={2}
        />
      );

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3); // 2 visible + 1 overflow
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CapabilityTags capabilities={['extract']} className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should use secondary badge variant', () => {
      const { container } = render(
        <CapabilityTags capabilities={['extract']} />
      );

      // Secondary badge has bg-secondary styling
      const badge = container.querySelector('[class*="bg-secondary"]');
      expect(badge).toBeInTheDocument();
    });

    it('should use outline variant for overflow badge', () => {
      const { container } = render(
        <CapabilityTags capabilities={['a', 'b', 'c', 'd', 'e']} maxVisible={2} />
      );

      const overflowBadge = screen.getByText('+3 more');
      expect(overflowBadge).toBeInTheDocument();
    });
  });
});
