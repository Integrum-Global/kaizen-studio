/**
 * useLevelTransition Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useLevelTransition, type LevelTransition } from '../useLevelTransition';
import { UserLevelProvider } from '@/contexts/UserLevelContext';
import { useAuthStore } from '@/store/auth';

// Mock the stores
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
  }),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('useLevelTransition', () => {
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

  function createWrapper() {
    const queryClient = createQueryClient();
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UserLevelProvider>{children}</UserLevelProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
    // Default to Level 1
    mockFetch.mockResolvedValue({ ok: false });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should return current level', async () => {
      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentLevel).toBe(1);
      });
    });

    it('should return level label', async () => {
      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentLevelLabel).toBe('Task Performer');
      });
    });

    it('should return level description', async () => {
      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentLevelDescription).toBe(
          'Execute assigned tasks and view results'
        );
      });
    });

    it('should not have a last transition initially', async () => {
      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.lastTransition).toBeNull();
      });
    });

    it('should not be transitioning initially', async () => {
      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isTransitioning).toBe(false);
      });
    });
  });

  describe('level detection', () => {
    it('should detect Level 2 from delegationsGiven', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          level: 2,
          delegationsReceived: 1,
          delegationsGiven: 3,
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        }),
      });

      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentLevel).toBe(2);
        expect(result.current.currentLevelLabel).toBe('Process Owner');
      });
    });

    it('should detect Level 3 from canEstablishTrust', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          level: 3,
          delegationsReceived: 0,
          delegationsGiven: 5,
          canEstablishTrust: true,
          trustChainPosition: 'root',
        }),
      });

      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.currentLevel).toBe(3);
        expect(result.current.currentLevelLabel).toBe('Value Chain Owner');
      });
    });
  });

  describe('notification options', () => {
    it('should not show toast when showNotifications is false', async () => {
      const { result } = renderHook(
        () => useLevelTransition({ showNotifications: false }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.currentLevel).toBe(1);
      });

      // No toast should be shown on initial render
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe('callback options', () => {
    it('should provide checkTransition function', async () => {
      const { result } = renderHook(() => useLevelTransition(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(typeof result.current.checkTransition).toBe('function');
      });
    });
  });

  describe('transition messages', () => {
    it('should return correct message for 1->2 upgrade', async () => {
      // Start at level 1
      const queryClient = createQueryClient();
      let levelResponse = { ok: false };

      mockFetch.mockImplementation(async () => levelResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <UserLevelProvider>{children}</UserLevelProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useLevelTransition(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentLevel).toBe(1);
      });

      // Upgrade to level 2
      levelResponse = {
        ok: true,
        json: async () => ({
          level: 2,
          delegationsReceived: 1,
          delegationsGiven: 3,
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        }),
      } as any;

      // Trigger refetch
      act(() => {
        result.current.checkTransition();
      });

      // Wait for transition to be detected
      await waitFor(
        () => {
          expect(result.current.lastTransition?.from).toBe(1);
          expect(result.current.lastTransition?.to).toBe(2);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('transition direction', () => {
    it('should mark upgrade correctly', async () => {
      // Start at level 1, then upgrade to 2
      const queryClient = createQueryClient();
      let levelResponse = { ok: false };

      mockFetch.mockImplementation(async () => levelResponse);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <UserLevelProvider>{children}</UserLevelProvider>
          </BrowserRouter>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useLevelTransition(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentLevel).toBe(1);
      });

      // Upgrade to level 2
      levelResponse = {
        ok: true,
        json: async () => ({
          level: 2,
          delegationsReceived: 1,
          delegationsGiven: 3,
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        }),
      } as any;

      act(() => {
        result.current.checkTransition();
      });

      await waitFor(
        () => {
          expect(result.current.lastTransition?.direction).toBe('upgrade');
        },
        { timeout: 2000 }
      );
    });
  });
});
