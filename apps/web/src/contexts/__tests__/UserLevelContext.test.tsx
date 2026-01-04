/**
 * UserLevelContext Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  UserLevelProvider,
  useUserLevel,
  usePermission,
  useMinLevel,
  ForLevel,
  ForPermission,
  getLevelLabel,
  getLevelDescription,
} from '../UserLevelContext';
import { useAuthStore } from '@/store/auth';

// Mock the auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserLevelContext', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    organization_id: 'org-123',
    organization_name: 'Test Organization',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const createQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

  const renderWithProviders = (ui: React.ReactElement) => {
    const queryClient = createQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <UserLevelProvider>{ui}</UserLevelProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('UserLevelProvider', () => {
    it('should provide default Level 1 when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      function TestComponent() {
        const { level } = useUserLevel();
        return <div>Level: {level}</div>;
      }

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Level: 1')).toBeInTheDocument();
      });
    });

    it('should provide Level 3 for users who can establish trust', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          level: 3,
          delegationsReceived: 0,
          delegationsGiven: 5,
          canEstablishTrust: true,
          trustChainPosition: 'root',
        }),
      });

      function TestComponent() {
        const { level } = useUserLevel();
        return <div>Level: {level}</div>;
      }

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Level: 3')).toBeInTheDocument();
      });
    });

    it('should provide Level 2 for users with delegations given', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          level: 2,
          delegationsReceived: 1,
          delegationsGiven: 3,
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        }),
      });

      function TestComponent() {
        const { level } = useUserLevel();
        return <div>Level: {level}</div>;
      }

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByText('Level: 2')).toBeInTheDocument();
      });
    });

    it('should provide user context values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      function TestComponent() {
        const { userId, userName, email, organizationId } = useUserLevel();
        return (
          <div>
            <span data-testid="userId">{userId}</span>
            <span data-testid="userName">{userName}</span>
            <span data-testid="email">{email}</span>
            <span data-testid="orgId">{organizationId}</span>
          </div>
        );
      }

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('userId')).toHaveTextContent('user-123');
        expect(screen.getByTestId('userName')).toHaveTextContent('Test User');
        expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('orgId')).toHaveTextContent('org-123');
      });
    });
  });

  describe('useUserLevel', () => {
    it('should throw error when used outside provider', () => {
      function TestComponent() {
        useUserLevel();
        return null;
      }

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useUserLevel must be used within a UserLevelProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('usePermission', () => {
    it('should return correct permissions for Level 1', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      function TestComponent() {
        const canRun = usePermission('canRun');
        const canConfigure = usePermission('canConfigure');
        return (
          <div>
            <span data-testid="canRun">{canRun ? 'yes' : 'no'}</span>
            <span data-testid="canConfigure">{canConfigure ? 'yes' : 'no'}</span>
          </div>
        );
      }

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('canRun')).toHaveTextContent('yes');
        expect(screen.getByTestId('canConfigure')).toHaveTextContent('no');
      });
    });
  });

  describe('useMinLevel', () => {
    it('should return true when user meets minimum level', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          level: 2,
          delegationsReceived: 1,
          delegationsGiven: 3,
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        }),
      });

      function TestComponent() {
        const meetsLevel1 = useMinLevel(1);
        const meetsLevel2 = useMinLevel(2);
        const meetsLevel3 = useMinLevel(3);
        return (
          <div>
            <span data-testid="level1">{meetsLevel1 ? 'yes' : 'no'}</span>
            <span data-testid="level2">{meetsLevel2 ? 'yes' : 'no'}</span>
            <span data-testid="level3">{meetsLevel3 ? 'yes' : 'no'}</span>
          </div>
        );
      }

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('level1')).toHaveTextContent('yes');
        expect(screen.getByTestId('level2')).toHaveTextContent('yes');
        expect(screen.getByTestId('level3')).toHaveTextContent('no');
      });
    });
  });

  describe('ForLevel', () => {
    it('should render children when user meets minimum level', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          level: 2,
          delegationsReceived: 0,
          delegationsGiven: 1,
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        }),
      });

      renderWithProviders(
        <ForLevel min={2}>
          <span>Level 2 content</span>
        </ForLevel>
      );

      await waitFor(() => {
        expect(screen.getByText('Level 2 content')).toBeInTheDocument();
      });
    });

    it('should not render children when user does not meet minimum level', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      renderWithProviders(
        <ForLevel min={2}>
          <span>Level 2 content</span>
        </ForLevel>
      );

      await waitFor(() => {
        expect(screen.queryByText('Level 2 content')).not.toBeInTheDocument();
      });
    });

    it('should render fallback when user does not meet minimum level', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      renderWithProviders(
        <ForLevel min={2} fallback={<span>Not available</span>}>
          <span>Level 2 content</span>
        </ForLevel>
      );

      await waitFor(() => {
        expect(screen.getByText('Not available')).toBeInTheDocument();
        expect(screen.queryByText('Level 2 content')).not.toBeInTheDocument();
      });
    });
  });

  describe('ForPermission', () => {
    it('should render children when user has permission', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      renderWithProviders(
        <ForPermission permission="canRun">
          <span>Can run content</span>
        </ForPermission>
      );

      await waitFor(() => {
        expect(screen.getByText('Can run content')).toBeInTheDocument();
      });
    });

    it('should not render children when user lacks permission', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      renderWithProviders(
        <ForPermission permission="canConfigure">
          <span>Configure content</span>
        </ForPermission>
      );

      await waitFor(() => {
        expect(screen.queryByText('Configure content')).not.toBeInTheDocument();
      });
    });

    it('should render fallback when user lacks permission', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      renderWithProviders(
        <ForPermission permission="canConfigure" fallback={<span>Upgrade required</span>}>
          <span>Configure content</span>
        </ForPermission>
      );

      await waitFor(() => {
        expect(screen.getByText('Upgrade required')).toBeInTheDocument();
      });
    });
  });

  describe('getLevelLabel', () => {
    it('should return correct label for Level 1', () => {
      expect(getLevelLabel(1)).toBe('Task Performer');
    });

    it('should return correct label for Level 2', () => {
      expect(getLevelLabel(2)).toBe('Process Owner');
    });

    it('should return correct label for Level 3', () => {
      expect(getLevelLabel(3)).toBe('Value Chain Owner');
    });

    it('should return Unknown for invalid level', () => {
      // @ts-expect-error Testing invalid level
      expect(getLevelLabel(4)).toBe('Unknown');
    });
  });

  describe('getLevelDescription', () => {
    it('should return correct description for Level 1', () => {
      expect(getLevelDescription(1)).toBe('Execute assigned tasks and view results');
    });

    it('should return correct description for Level 2', () => {
      expect(getLevelDescription(2)).toBe('Configure processes and delegate to team members');
    });

    it('should return correct description for Level 3', () => {
      expect(getLevelDescription(3)).toBe('Manage enterprise-wide value chains and compliance');
    });

    it('should return empty string for invalid level', () => {
      // @ts-expect-error Testing invalid level
      expect(getLevelDescription(4)).toBe('');
    });
  });
});
