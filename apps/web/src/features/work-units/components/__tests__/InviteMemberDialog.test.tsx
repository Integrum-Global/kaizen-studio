/**
 * InviteMemberDialog Component Tests
 *
 * Tests for the dialog that invites members to a workspace with role selection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InviteMemberDialog } from '../InviteMemberDialog';
import type { WorkspaceMember } from '../../types';

// Mock the hooks
const mockUseUsers = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('@/features/users/hooks/useUsers', () => ({
  useUsers: (...args: unknown[]) => mockUseUsers(...args),
}));

vi.mock('../../hooks', () => ({
  useAddWorkspaceMember: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('InviteMemberDialog', () => {
  // Test data factories
  const createMockUser = (id: string, overrides?: Partial<{ name: string; email: string; department: string }>) => ({
    id,
    name: `User ${id}`,
    email: `user-${id}@example.com`,
    department: 'Engineering',
    ...overrides,
  });

  const createExistingMember = (userId: string): WorkspaceMember => ({
    userId,
    role: 'member',
    joinedAt: '2024-01-01T00:00:00Z',
    user: {
      id: userId,
      name: `User ${userId}`,
      email: `user-${userId}@example.com`,
    },
  });

  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    workspaceId: 'ws-123',
    workspaceName: 'Test Workspace',
    existingMembers: [] as WorkspaceMember[],
  };

  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock response
    mockUseUsers.mockReturnValue({
      data: { records: [] },
      isLoading: false,
    });

    mockMutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderDialog = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <InviteMemberDialog {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('dialog structure', () => {
    it('should render dialog with correct title', () => {
      renderDialog();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Invite Member' })).toBeInTheDocument();
    });

    it('should render dialog description with workspace name', () => {
      renderDialog({ workspaceName: 'Q4 Audit Prep' });

      expect(
        screen.getByText(/Invite a user to "Q4 Audit Prep"/)
      ).toBeInTheDocument();
    });

    it('should have search input for users', () => {
      renderDialog();

      expect(
        screen.getByPlaceholderText('Search users by name or email...')
      ).toBeInTheDocument();
    });

    it('should have Cancel and Invite Member buttons', () => {
      renderDialog();

      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Invite Member/ })).toBeInTheDocument();
    });

    it('should show trust delegation note', () => {
      renderDialog();

      expect(
        screen.getByText(/Adding a member creates a trust delegation/)
      ).toBeInTheDocument();
    });
  });

  describe('role options', () => {
    it('should display all three role options', () => {
      renderDialog();

      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Member')).toBeInTheDocument();
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });

    it('should display role descriptions', () => {
      renderDialog();

      expect(screen.getByText('Can manage members and work units')).toBeInTheDocument();
      expect(screen.getByText('Can run work units')).toBeInTheDocument();
      expect(screen.getByText('Read-only access')).toBeInTheDocument();
    });

    it('should default to Member role', () => {
      renderDialog();

      // The radio group should exist with member selected
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();

      // Member label should be visible and its parent should have selected styling
      const memberText = screen.getByText('Member');
      const memberLabel = memberText.closest('label');
      expect(memberLabel).toHaveClass('border-primary');
    });

    it('should allow changing role selection', async () => {
      const user = userEvent.setup();
      renderDialog();

      // Click on the Admin label/row to select it
      const adminText = screen.getByText('Admin');
      const adminLabel = adminText.closest('label');
      expect(adminLabel).toBeInTheDocument();
      await user.click(adminLabel!);

      // Admin label should now have selected styling
      expect(adminLabel).toHaveClass('border-primary');
    });
  });

  describe('user search', () => {
    it('should show search prompt when no search query', () => {
      renderDialog();

      // Initially, the user list is hidden until search starts
      expect(screen.queryByText('No users found')).not.toBeInTheDocument();
    });

    it('should pass search query to useUsers hook', async () => {
      const user = userEvent.setup();

      mockUseUsers.mockReturnValue({
        data: { records: [] },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');

      expect(mockUseUsers).toHaveBeenLastCalledWith({ search: 'alice' });
    });

    it('should show "No users found" when search returns empty', async () => {
      const user = userEvent.setup();

      mockUseUsers.mockReturnValue({
        data: { records: [] },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  describe('user list', () => {
    it('should display available users', async () => {
      const user = userEvent.setup();
      const users = [
        createMockUser('u-1', { name: 'Alice Chen', email: 'alice@example.com' }),
        createMockUser('u-2', { name: 'Bob Smith', email: 'bob@example.com' }),
      ];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog();

      // Type to trigger user list display
      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'a');

      expect(screen.getByText('Alice Chen')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should filter out users already in workspace', async () => {
      const user = userEvent.setup();
      const users = [
        createMockUser('u-1', { name: 'Alice Chen' }),
        createMockUser('u-2', { name: 'Bob Smith' }),
        createMockUser('u-3', { name: 'Carol Johnson' }),
      ];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      // u-2 is already a member
      renderDialog({
        existingMembers: [createExistingMember('u-2')],
      });

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'a');

      expect(screen.getByText('Alice Chen')).toBeInTheDocument();
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Carol Johnson')).toBeInTheDocument();
    });

    it('should show user emails', async () => {
      const user = userEvent.setup();
      const users = [
        createMockUser('u-1', { name: 'Alice Chen', email: 'alice@example.com' }),
      ];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');

      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    it('should show avatar initials', async () => {
      const user = userEvent.setup();
      const users = [
        createMockUser('u-1', { name: 'Alice Chen' }),
      ];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');

      expect(screen.getByText('AL')).toBeInTheDocument();
    });
  });

  describe('user selection', () => {
    it('should allow selecting a user', async () => {
      const user = userEvent.setup();
      const users = [createMockUser('u-1', { name: 'Alice Chen' })];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');

      const userOption = screen.getByTestId('user-option-u-1');
      await user.click(userOption);

      // Check mark should appear
      expect(screen.getByTestId('user-option-u-1').querySelector('svg')).toBeInTheDocument();
    });

    it('should clear selection when search changes', async () => {
      const user = userEvent.setup();
      const users = [createMockUser('u-1', { name: 'Alice Chen' })];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');

      // Select user
      await user.click(screen.getByTestId('user-option-u-1'));

      // Type more to search again - this should clear selection
      await user.type(searchInput, 'x');

      // Selection should be cleared
      const userOption = screen.queryByTestId('user-option-u-1');
      if (userOption) {
        // If user is still shown, check there's no check mark
        expect(userOption.querySelector('[class*="text-primary"]')).not.toBeInTheDocument();
      }
    });
  });

  describe('invite action', () => {
    it('should disable Invite button when no user selected', () => {
      renderDialog();

      expect(screen.getByRole('button', { name: /Invite Member/ })).toBeDisabled();
    });

    it('should enable Invite button when user is selected', async () => {
      const user = userEvent.setup();
      const users = [createMockUser('u-1', { name: 'Alice Chen' })];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');
      await user.click(screen.getByTestId('user-option-u-1'));

      expect(screen.getByRole('button', { name: /Invite Member/ })).not.toBeDisabled();
    });

    it('should call mutateAsync with correct params', async () => {
      const user = userEvent.setup();
      const users = [createMockUser('u-1', { name: 'Alice Chen' })];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog();

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');
      await user.click(screen.getByTestId('user-option-u-1'));

      // Change role to Admin
      await user.click(screen.getByRole('radio', { name: /Admin/i }));

      // Click Invite
      await user.click(screen.getByRole('button', { name: /Invite Member/ }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          workspaceId: 'ws-123',
          userId: 'u-1',
          role: 'admin',
        });
      });
    });

    it('should close dialog after successful invite', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const users = [createMockUser('u-1', { name: 'Alice Chen' })];

      mockUseUsers.mockReturnValue({
        data: { records: users },
        isLoading: false,
      });

      renderDialog({ onOpenChange });

      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      await user.type(searchInput, 'alice');
      await user.click(screen.getByTestId('user-option-u-1'));
      await user.click(screen.getByRole('button', { name: /Invite Member/ }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('cancel action', () => {
    it('should close dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      renderDialog();

      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'invite-member-title'
      );
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-describedby',
        'invite-member-description'
      );
    });

    it('should have labeled sections', () => {
      renderDialog();

      expect(screen.getByText('Select User')).toBeInTheDocument();
      expect(screen.getByText('Select Role')).toBeInTheDocument();
    });

    it('should have radio group for role selection', () => {
      renderDialog();

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });
});
