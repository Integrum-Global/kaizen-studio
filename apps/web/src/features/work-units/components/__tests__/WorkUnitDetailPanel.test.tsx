/**
 * WorkUnitDetailPanel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkUnitDetailPanel } from '../WorkUnitDetailPanel';
import { UserLevelProvider } from '@/contexts/UserLevelContext';
import type { WorkUnit, RunResult, SubUnit } from '../../types';

// Mock the auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      organization_id: 'org-123',
    },
    isAuthenticated: true,
  })),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WorkUnitDetailPanel', () => {
  const createMockWorkUnit = (overrides?: Partial<WorkUnit>): WorkUnit => ({
    id: 'wu-123',
    name: 'Invoice Processor',
    description: 'Processes incoming invoices through extraction and validation',
    type: 'composite',
    capabilities: ['extract', 'validate', 'route', 'archive'],
    trustInfo: {
      status: 'valid',
      establishedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2024-12-31T23:59:59Z',
      delegatedBy: {
        userId: 'user-456',
        userName: 'Sarah Chen',
        role: 'CFO',
      },
    },
    subUnits: [
      { id: 'sub-1', name: 'Data Extractor', type: 'atomic', trustStatus: 'valid', position: 1 },
      { id: 'sub-2', name: 'Invoice Validator', type: 'atomic', trustStatus: 'valid', position: 2 },
    ],
    subUnitCount: 2,
    createdBy: 'user-123',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    ...overrides,
  });

  const createMockRuns = (): RunResult[] => [
    {
      id: 'run-1',
      status: 'completed',
      startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    },
    {
      id: 'run-2',
      status: 'failed',
      startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      error: 'Validation error',
    },
  ];

  const defaultHandlers = {
    onClose: vi.fn(),
    onRun: vi.fn(),
    onConfigure: vi.fn(),
    onDelegate: vi.fn(),
    onViewTrustChain: vi.fn(),
    onViewRun: vi.fn(),
  };

  const createQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

  /**
   * Create mock API response for UserLevelProvider
   * The determineUserLevel function calculates level from:
   * - Level 3: canEstablishTrust=true OR trustChainPosition='root'|'intermediate'
   * - Level 2: delegationsGiven > 0
   * - Level 1: default
   */
  const getMockLevelResponse = (level: 1 | 2 | 3) => {
    switch (level) {
      case 3:
        return {
          level: 3,
          delegationsReceived: 5,
          delegationsGiven: 3,
          canEstablishTrust: true,
          trustChainPosition: 'intermediate',
        };
      case 2:
        return {
          level: 2,
          delegationsReceived: 2,
          delegationsGiven: 1, // This triggers Level 2
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        };
      default:
        return {
          level: 1,
          delegationsReceived: 1,
          delegationsGiven: 0, // No delegations given = Level 1
          canEstablishTrust: false,
          trustChainPosition: 'leaf',
        };
    }
  };

  const renderWithProviders = (
    workUnit: WorkUnit | null,
    isOpen: boolean,
    userLevel: 1 | 2 | 3 = 2,
    recentRuns: RunResult[] = []
  ) => {
    const queryClient = createQueryClient();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => getMockLevelResponse(userLevel),
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <UserLevelProvider>
          <WorkUnitDetailPanel
            workUnit={workUnit}
            isOpen={isOpen}
            userLevel={userLevel}
            recentRuns={recentRuns}
            {...defaultHandlers}
          />
        </UserLevelProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('basic rendering', () => {
    it('should not render when workUnit is null', () => {
      renderWithProviders(null, true);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      renderWithProviders(createMockWorkUnit(), false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render panel when workUnit and isOpen are provided', () => {
      renderWithProviders(createMockWorkUnit(), true);
      expect(screen.getByText('Invoice Processor')).toBeInTheDocument();
    });

    it('should display work unit name', () => {
      renderWithProviders(createMockWorkUnit(), true);
      expect(screen.getByText('Invoice Processor')).toBeInTheDocument();
    });

    it('should display work unit type', () => {
      renderWithProviders(createMockWorkUnit(), true);
      expect(screen.getByText('Composite Work Unit')).toBeInTheDocument();
    });

    it('should display atomic type for atomic work unit', () => {
      renderWithProviders(createMockWorkUnit({ type: 'atomic' }), true);
      expect(screen.getByText('Atomic Work Unit')).toBeInTheDocument();
    });

    it('should display description', () => {
      renderWithProviders(createMockWorkUnit(), true);
      expect(
        screen.getByText('Processes incoming invoices through extraction and validation')
      ).toBeInTheDocument();
    });
  });

  describe('trust status display', () => {
    it('should show trust status badge', () => {
      renderWithProviders(createMockWorkUnit(), true);
      expect(screen.getByText('Trust Valid')).toBeInTheDocument();
    });

    it('should show expired trust status', () => {
      renderWithProviders(
        createMockWorkUnit({ trustInfo: { status: 'expired' } }),
        true
      );
      expect(screen.getByText('Trust Expired')).toBeInTheDocument();
    });

    it('should call onViewTrustChain when trust badge is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(createMockWorkUnit(), true);

      // Find the trust badge in the header area
      const trustBadges = screen.getAllByText('Trust Valid');
      await user.click(trustBadges[0]);

      expect(defaultHandlers.onViewTrustChain).toHaveBeenCalled();
    });
  });

  describe('capabilities display', () => {
    it('should display capabilities for Level 2+', () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      expect(screen.getByText('CAPABILITIES')).toBeInTheDocument();
    });

    it('should show "What it can do" for Level 1', () => {
      renderWithProviders(createMockWorkUnit(), true, 1);
      expect(screen.getByText('WHAT IT CAN DO')).toBeInTheDocument();
    });

    it('should display all capabilities', () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      expect(screen.getByText('extract')).toBeInTheDocument();
      expect(screen.getByText('validate')).toBeInTheDocument();
    });
  });

  describe('trust section (Level 2+)', () => {
    it('should show trust section for Level 2', async () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      // Wait for async context to update with Level 2 data
      await waitFor(() => {
        expect(screen.getByText('TRUST')).toBeInTheDocument();
      });
    });

    it('should show trust section for Level 3', async () => {
      renderWithProviders(createMockWorkUnit(), true, 3);
      // Wait for async context to update with Level 3 data
      await waitFor(() => {
        expect(screen.getByText('TRUST')).toBeInTheDocument();
      });
    });

    it('should not show trust section for Level 1', () => {
      renderWithProviders(createMockWorkUnit(), true, 1);
      expect(screen.queryByText('TRUST')).not.toBeInTheDocument();
    });

    it('should show delegated by info', async () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      await waitFor(() => {
        expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
        expect(screen.getByText('(CFO)')).toBeInTheDocument();
      });
    });

    it('should show View Trust Chain button', async () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      await waitFor(() => {
        expect(screen.getByText('View Trust Chain')).toBeInTheDocument();
      });
    });
  });

  describe('sub-units (composite only, Level 2+)', () => {
    it('should show sub-units for composite work unit', async () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      await waitFor(() => {
        expect(screen.getByText('SUB-UNITS (2)')).toBeInTheDocument();
      });
    });

    it('should not show sub-units for atomic work unit', () => {
      renderWithProviders(
        createMockWorkUnit({ type: 'atomic', subUnits: undefined }),
        true,
        2
      );
      expect(screen.queryByText(/SUB-UNITS/)).not.toBeInTheDocument();
    });

    it('should not show sub-units for Level 1', () => {
      renderWithProviders(createMockWorkUnit(), true, 1);
      expect(screen.queryByText('SUB-UNITS')).not.toBeInTheDocument();
    });

    it('should display sub-unit names', async () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      await waitFor(() => {
        expect(screen.getByText('Data Extractor')).toBeInTheDocument();
        expect(screen.getByText('Invoice Validator')).toBeInTheDocument();
      });
    });
  });

  describe('recent runs', () => {
    it('should show recent runs section', () => {
      renderWithProviders(createMockWorkUnit(), true, 2, createMockRuns());
      expect(screen.getByText('RECENT RUNS')).toBeInTheDocument();
    });

    it('should show "Recent Results" for Level 1', () => {
      renderWithProviders(createMockWorkUnit(), true, 1, createMockRuns());
      expect(screen.getByText('RECENT RESULTS')).toBeInTheDocument();
    });

    it('should show empty state when no runs', () => {
      renderWithProviders(createMockWorkUnit(), true, 2, []);
      expect(screen.getByText('No recent runs')).toBeInTheDocument();
    });

    it('should display run status badges', () => {
      renderWithProviders(createMockWorkUnit(), true, 2, createMockRuns());
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('should call onViewRun when run is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(createMockWorkUnit(), true, 2, createMockRuns());

      // Find and click the first run item
      const completedBadge = screen.getByText('Completed');
      const runItem = completedBadge.closest('[role="button"]');
      if (runItem) {
        await user.click(runItem);
        expect(defaultHandlers.onViewRun).toHaveBeenCalledWith('run-1');
      }
    });
  });

  describe('action buttons - Level 1', () => {
    it('should show single Run Now button for Level 1', () => {
      renderWithProviders(createMockWorkUnit(), true, 1);
      expect(screen.getByText('Run Now')).toBeInTheDocument();
    });

    it('should not show Configure or Delegate for Level 1', () => {
      renderWithProviders(createMockWorkUnit(), true, 1);
      expect(screen.queryByText('Configure')).not.toBeInTheDocument();
      expect(screen.queryByText('Delegate')).not.toBeInTheDocument();
    });

    it('should disable Run when trust is invalid', () => {
      renderWithProviders(
        createMockWorkUnit({ trustInfo: { status: 'expired' } }),
        true,
        1
      );
      expect(screen.getByText('Run Now')).toBeDisabled();
    });
  });

  describe('action buttons - Level 2+', () => {
    it('should show Run, Configure, and Delegate buttons', () => {
      renderWithProviders(createMockWorkUnit(), true, 2);
      expect(screen.getByText('Run')).toBeInTheDocument();
      expect(screen.getByText('Configure')).toBeInTheDocument();
      expect(screen.getByText('Delegate')).toBeInTheDocument();
    });

    it('should call onRun when Run is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(createMockWorkUnit(), true, 2);

      await user.click(screen.getByText('Run'));
      expect(defaultHandlers.onRun).toHaveBeenCalled();
    });

    it('should call onConfigure when Configure is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(createMockWorkUnit(), true, 2);

      await user.click(screen.getByText('Configure'));
      expect(defaultHandlers.onConfigure).toHaveBeenCalled();
    });

    it('should call onDelegate when Delegate is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(createMockWorkUnit(), true, 2);

      await user.click(screen.getByText('Delegate'));
      expect(defaultHandlers.onDelegate).toHaveBeenCalled();
    });

    it('should disable Delegate when trust is invalid', () => {
      renderWithProviders(
        createMockWorkUnit({ trustInfo: { status: 'expired' } }),
        true,
        2
      );
      expect(screen.getByText('Delegate')).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show loading state when isLoading is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => getMockLevelResponse(2),
      });

      render(
        <QueryClientProvider client={createQueryClient()}>
          <UserLevelProvider>
            <WorkUnitDetailPanel
              workUnit={createMockWorkUnit()}
              isOpen={true}
              userLevel={2}
              isLoading={true}
              {...defaultHandlers}
            />
          </UserLevelProvider>
        </QueryClientProvider>
      );

      // When loading, the Run button should be disabled
      await waitFor(() => {
        const runButton = screen.getByText('Run');
        expect(runButton).toBeDisabled();
      });
    });

    it('should disable Run button when loading', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => getMockLevelResponse(2),
      });

      render(
        <QueryClientProvider client={createQueryClient()}>
          <UserLevelProvider>
            <WorkUnitDetailPanel
              workUnit={createMockWorkUnit()}
              isOpen={true}
              userLevel={2}
              isLoading={true}
              {...defaultHandlers}
            />
          </UserLevelProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Run')).toBeDisabled();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when closed', async () => {
      const user = userEvent.setup();
      renderWithProviders(createMockWorkUnit(), true, 2);

      // Press Escape to close
      await user.keyboard('{Escape}');
      expect(defaultHandlers.onClose).toHaveBeenCalled();
    });
  });
});
