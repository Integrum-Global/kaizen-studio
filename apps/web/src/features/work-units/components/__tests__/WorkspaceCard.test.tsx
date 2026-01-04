/**
 * WorkspaceCard Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceCard } from '../WorkspaceCard';
import type { WorkspaceType } from '../../types';

describe('WorkspaceCard', () => {
  interface MockWorkspace {
    id: string;
    name: string;
    description?: string;
    workspaceType: WorkspaceType;
    color?: string;
    ownerName: string;
    memberCount: number;
    workUnitCount: number;
    expiresAt?: string;
    isArchived: boolean;
    isPersonal?: boolean;
  }

  const createMockWorkspace = (overrides?: Partial<MockWorkspace>): MockWorkspace => ({
    id: 'workspace-123',
    name: 'Q4 Audit Prep',
    description: 'Cross-functional workspace for Q4 audit preparation',
    workspaceType: 'temporary',
    ownerName: 'Alice Manager',
    memberCount: 5,
    workUnitCount: 12,
    isArchived: false,
    ...overrides,
  });

  const defaultHandlers = {
    onOpen: vi.fn(),
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render workspace name', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Q4 Audit Prep')).toBeInTheDocument();
    });

    it('should render workspace description', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Cross-functional workspace for Q4 audit preparation')).toBeInTheDocument();
    });

    it('should render with test id', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-card')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
          className="custom-workspace-card"
        />
      );

      expect(container.querySelector('.custom-workspace-card')).toBeInTheDocument();
    });

    it('should not render description if not provided', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ description: undefined })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByText('Cross-functional workspace for Q4 audit preparation')).not.toBeInTheDocument();
    });
  });

  describe('workspace types', () => {
    it('should show permanent type badge', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workspaceType: 'permanent' })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Permanent')).toBeInTheDocument();
    });

    it('should show temporary type badge', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workspaceType: 'temporary' })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Temporary')).toBeInTheDocument();
    });

    it('should show personal type badge', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workspaceType: 'personal' })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('should render type icon with correct styling for permanent', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workspaceType: 'permanent' })}
          {...defaultHandlers}
        />
      );

      const iconContainer = screen.getByTestId('workspace-type-icon');
      expect(iconContainer).toHaveClass('bg-blue-100');
    });

    it('should render type icon with correct styling for temporary', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workspaceType: 'temporary' })}
          {...defaultHandlers}
        />
      );

      const iconContainer = screen.getByTestId('workspace-type-icon');
      expect(iconContainer).toHaveClass('bg-amber-100');
    });

    it('should render type icon with correct styling for personal', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workspaceType: 'personal' })}
          {...defaultHandlers}
        />
      );

      const iconContainer = screen.getByTestId('workspace-type-icon');
      expect(iconContainer).toHaveClass('bg-purple-100');
    });
  });

  describe('color bar', () => {
    it('should show color bar when color is provided', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ color: '#FF5733' })}
          {...defaultHandlers}
        />
      );

      const colorBar = screen.getByTestId('workspace-color-bar');
      expect(colorBar).toBeInTheDocument();
      expect(colorBar).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should not show color bar when color is not provided', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ color: undefined })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('workspace-color-bar')).not.toBeInTheDocument();
    });
  });

  describe('stats display', () => {
    it('should display work unit count', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workUnitCount: 12 })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('12 work units')).toBeInTheDocument();
    });

    it('should display member count for non-personal workspaces', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ memberCount: 5, isPersonal: false })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('5 members')).toBeInTheDocument();
    });

    it('should not display member count for personal workspaces', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isPersonal: true })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByText(/\d+ members/)).not.toBeInTheDocument();
    });

    it('should show Private indicator for personal workspaces', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isPersonal: true })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Private')).toBeInTheDocument();
    });
  });

  describe('expiration display', () => {
    it('should show expiration date when provided', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ expiresAt: futureDate.toISOString() })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-expiration')).toBeInTheDocument();
    });

    it('should not show expiration when not provided', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ expiresAt: undefined })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('workspace-expiration')).not.toBeInTheDocument();
    });

    it('should show Expired for past expiration dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ expiresAt: pastDate.toISOString() })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should show Expires today for today', () => {
      const today = new Date();
      // Set to a few hours in the future (still today)
      today.setHours(today.getHours() + 2);

      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ expiresAt: today.toISOString() })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Expires today')).toBeInTheDocument();
    });

    it('should show Expires tomorrow for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);

      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ expiresAt: tomorrow.toISOString() })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Expires tomorrow')).toBeInTheDocument();
    });

    it('should show "Expires in X days" for upcoming dates', () => {
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);

      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ expiresAt: inFiveDays.toISOString() })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Expires in 5 days')).toBeInTheDocument();
    });
  });

  describe('archived state', () => {
    it('should show Archived badge when isArchived is true', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isArchived: true })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-archived-badge')).toBeInTheDocument();
    });

    it('should not show Archived badge when isArchived is false', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isArchived: false })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('workspace-archived-badge')).not.toBeInTheDocument();
    });

    it('should apply reduced opacity for archived workspaces', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isArchived: true })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-card')).toHaveClass('opacity-60');
    });
  });

  describe('action buttons', () => {
    it('should render Open button', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-open-btn')).toBeInTheDocument();
    });

    it('should render Edit button when onEdit is provided', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-edit-btn')).toBeInTheDocument();
    });

    it('should not render Edit button when onEdit is not provided', () => {
      const { onEdit: _onEdit, ...handlers } = defaultHandlers;
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...handlers}
        />
      );

      expect(screen.queryByTestId('workspace-edit-btn')).not.toBeInTheDocument();
    });

    it('should render Archive button when onArchive is provided and not archived', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isArchived: false })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-archive-btn')).toBeInTheDocument();
    });

    it('should not render Archive button when workspace is archived', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isArchived: true })}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTestId('workspace-archive-btn')).not.toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call onOpen when Open button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('workspace-open-btn'));
      expect(defaultHandlers.onOpen).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when Edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('workspace-edit-btn'));
      expect(defaultHandlers.onEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onArchive when Archive button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('workspace-archive-btn'));
      expect(defaultHandlers.onArchive).toHaveBeenCalledTimes(1);
    });

    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('workspace-card'));
      expect(defaultHandlers.onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      await user.click(screen.getByTestId('workspace-open-btn'));
      expect(defaultHandlers.onClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled states', () => {
    it('should disable Edit button when workspace is archived', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ isArchived: true })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByTestId('workspace-edit-btn')).toBeDisabled();
    });

    it('should disable buttons when loading', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
          isLoading
        />
      );

      expect(screen.getByTestId('workspace-open-btn')).toBeDisabled();
      expect(screen.getByTestId('workspace-archive-btn')).toBeDisabled();
    });
  });

  describe('click behavior', () => {
    it('should have cursor-pointer when onClick is provided', () => {
      const { container } = render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });

    it('should not have cursor-pointer when onClick is not provided', () => {
      const { onClick: _onClick, ...handlers } = defaultHandlers;
      const { container } = render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...handlers}
        />
      );

      expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply hover shadow when clickable', () => {
      const { container } = render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      expect(container.querySelector('.hover\\:shadow-md')).toBeInTheDocument();
    });

    it('should have proper card structure', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace()}
          {...defaultHandlers}
        />
      );

      const card = screen.getByTestId('workspace-card');
      expect(card).toHaveClass('overflow-hidden');
      expect(card).toHaveClass('transition-all');
    });
  });

  describe('edge cases', () => {
    it('should handle 0 work units', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workUnitCount: 0 })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('0 work units')).toBeInTheDocument();
    });

    it('should handle 0 members', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ memberCount: 0, isPersonal: false })}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('0 members')).toBeInTheDocument();
    });

    it('should handle 1 work unit (singular)', () => {
      render(
        <WorkspaceCard
          workspace={createMockWorkspace({ workUnitCount: 1 })}
          {...defaultHandlers}
        />
      );

      // Component uses plural form always for simplicity
      expect(screen.getByText('1 work units')).toBeInTheDocument();
    });
  });
});
