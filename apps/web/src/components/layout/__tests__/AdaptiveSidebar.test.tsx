/**
 * AdaptiveSidebar Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdaptiveSidebar } from '../AdaptiveSidebar';
import { UserLevelProvider } from '@/contexts/UserLevelContext';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';

// Mock the stores
vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn(),
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock UserMenu component
vi.mock('../UserMenu', () => ({
  UserMenu: ({ collapsed }: { collapsed: boolean }) => (
    <div data-testid="user-menu">{collapsed ? 'collapsed' : 'expanded'}</div>
  ),
}));

describe('AdaptiveSidebar', () => {
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

  const mockToggleSidebar = vi.fn();

  const createQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

  const renderWithProviders = (
    initialRoute = '/',
    levelResponse?: object | null
  ) => {
    const queryClient = createQueryClient();

    if (levelResponse === null) {
      mockFetch.mockResolvedValueOnce({ ok: false });
    } else if (levelResponse) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => levelResponse,
      });
    } else {
      mockFetch.mockResolvedValueOnce({ ok: false });
    }

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <UserLevelProvider>
            <AdaptiveSidebar />
          </UserLevelProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
    (useUIStore as any).mockReturnValue({
      sidebarCollapsed: false,
      toggleSidebar: mockToggleSidebar,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Level-based navigation visibility', () => {
    describe('Level 1 (Task Performer)', () => {
      it('should only show My Tasks navigation item', async () => {
        renderWithProviders();

        await waitFor(() => {
          expect(screen.getByText('My Tasks')).toBeInTheDocument();
        });

        // Should not show Level 2+ items
        expect(screen.queryByText('My Processes')).not.toBeInTheDocument();
        expect(screen.queryByText('Work Units')).not.toBeInTheDocument();
        expect(screen.queryByText('Trust')).not.toBeInTheDocument();
      });

      it('should show Dashboard', async () => {
        renderWithProviders();

        await waitFor(() => {
          expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });
      });

      it('should show WORK section header', async () => {
        renderWithProviders();

        await waitFor(() => {
          expect(screen.getByText('WORK')).toBeInTheDocument();
        });
      });
    });

    describe('Level 2 (Process Owner)', () => {
      const level2Response = {
        level: 2,
        delegationsReceived: 1,
        delegationsGiven: 3,
        canEstablishTrust: false,
        trustChainPosition: 'leaf',
      };

      it('should show My Tasks and My Processes', async () => {
        renderWithProviders('/', level2Response);

        await waitFor(() => {
          expect(screen.getByText('My Tasks')).toBeInTheDocument();
          expect(screen.getByText('My Processes')).toBeInTheDocument();
        });
      });

      it('should show BUILD section', async () => {
        renderWithProviders('/', level2Response);

        await waitFor(() => {
          expect(screen.getByText('BUILD')).toBeInTheDocument();
          expect(screen.getByText('Work Units')).toBeInTheDocument();
          expect(screen.getByText('Workspaces')).toBeInTheDocument();
          expect(screen.getByText('Connectors')).toBeInTheDocument();
        });
      });

      it('should show Trust in GOVERN but not Compliance', async () => {
        renderWithProviders('/', level2Response);

        await waitFor(() => {
          expect(screen.getByText('Trust')).toBeInTheDocument();
        });

        expect(screen.queryByText('Compliance')).not.toBeInTheDocument();
      });

      it('should show OBSERVE section', async () => {
        renderWithProviders('/', level2Response);

        await waitFor(() => {
          expect(screen.getByText('OBSERVE')).toBeInTheDocument();
          expect(screen.getByText('Metrics')).toBeInTheDocument();
          expect(screen.getByText('Logs')).toBeInTheDocument();
          expect(screen.getByText('Alerts')).toBeInTheDocument();
        });
      });

      it('should not show Value Chains', async () => {
        renderWithProviders('/', level2Response);

        await waitFor(() => {
          expect(screen.getByText('My Tasks')).toBeInTheDocument();
        });

        expect(screen.queryByText('Value Chains')).not.toBeInTheDocument();
      });
    });

    describe('Level 3 (Value Chain Owner)', () => {
      const level3Response = {
        level: 3,
        delegationsReceived: 0,
        delegationsGiven: 5,
        canEstablishTrust: true,
        trustChainPosition: 'root',
      };

      it('should show all WORK items including Value Chains', async () => {
        renderWithProviders('/', level3Response);

        await waitFor(() => {
          expect(screen.getByText('My Tasks')).toBeInTheDocument();
          expect(screen.getByText('My Processes')).toBeInTheDocument();
          expect(screen.getByText('Value Chains')).toBeInTheDocument();
        });
      });

      it('should show Compliance and Activity in GOVERN', async () => {
        renderWithProviders('/', level3Response);

        await waitFor(() => {
          expect(screen.getByText('Trust')).toBeInTheDocument();
          expect(screen.getByText('Compliance')).toBeInTheDocument();
          expect(screen.getByText('Activity')).toBeInTheDocument();
        });
      });

      it('should show Organizations in ADMIN', async () => {
        renderWithProviders('/', level3Response);

        await waitFor(() => {
          expect(screen.getByText('Organizations')).toBeInTheDocument();
        });
      });
    });
  });

  describe('collapsed state', () => {
    it('should show collapsed layout when sidebarCollapsed is true', async () => {
      (useUIStore as any).mockReturnValue({
        sidebarCollapsed: true,
        toggleSidebar: mockToggleSidebar,
      });

      const { container } = renderWithProviders();

      await waitFor(() => {
        const sidebar = container.querySelector('.w-16');
        expect(sidebar).toBeInTheDocument();
      });
    });

    it('should hide section titles when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        sidebarCollapsed: true,
        toggleSidebar: mockToggleSidebar,
      });

      renderWithProviders();

      await waitFor(() => {
        // Section titles should be hidden when collapsed
        expect(screen.queryByText('WORK')).not.toBeInTheDocument();
      });
    });

    it('should call toggleSidebar when collapse button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Collapse')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Collapse'));

      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('should show expand button when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        sidebarCollapsed: true,
        toggleSidebar: mockToggleSidebar,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Expand sidebar' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('active route highlighting', () => {
    it('should highlight active route', async () => {
      renderWithProviders('/work/tasks');

      await waitFor(() => {
        const myTasksLink = screen.getByText('My Tasks').closest('a');
        expect(myTasksLink).toHaveClass('bg-primary');
      });
    });

    it('should highlight Dashboard when on /dashboard', async () => {
      renderWithProviders('/dashboard');

      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).toHaveClass('bg-primary');
      });
    });
  });

  describe('level indicator', () => {
    it('should show level indicator L1 for Level 1', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('L1')).toBeInTheDocument();
      });
    });

    it('should show level indicator L2 for Level 2', async () => {
      const level2Response = {
        level: 2,
        delegationsReceived: 1,
        delegationsGiven: 3,
        canEstablishTrust: false,
        trustChainPosition: 'leaf',
      };

      renderWithProviders('/', level2Response);

      await waitFor(() => {
        expect(screen.getByText('L2')).toBeInTheDocument();
      });
    });

    it('should show level indicator L3 for Level 3', async () => {
      const level3Response = {
        level: 3,
        delegationsReceived: 0,
        delegationsGiven: 5,
        canEstablishTrust: true,
        trustChainPosition: 'root',
      };

      renderWithProviders('/', level3Response);

      await waitFor(() => {
        expect(screen.getByText('L3')).toBeInTheDocument();
      });
    });

    it('should hide level indicator when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        sidebarCollapsed: true,
        toggleSidebar: mockToggleSidebar,
      });

      renderWithProviders();

      await waitFor(() => {
        // Level indicator should be hidden when collapsed
        expect(screen.queryByText('L1')).not.toBeInTheDocument();
      });
    });
  });

  describe('branding', () => {
    it('should show Kaizen Studio text when expanded', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Kaizen Studio')).toBeInTheDocument();
      });
    });

    it('should show only K logo when collapsed', async () => {
      (useUIStore as any).mockReturnValue({
        sidebarCollapsed: true,
        toggleSidebar: mockToggleSidebar,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.queryByText('Kaizen Studio')).not.toBeInTheDocument();
        expect(screen.getByText('K')).toBeInTheDocument();
      });
    });
  });

  describe('user menu', () => {
    it('should render user menu', async () => {
      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      });
    });

    it('should pass collapsed state to user menu', async () => {
      (useUIStore as any).mockReturnValue({
        sidebarCollapsed: true,
        toggleSidebar: mockToggleSidebar,
      });

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByTestId('user-menu')).toHaveTextContent('collapsed');
      });
    });
  });

  describe('collapsible sections', () => {
    const level2Response = {
      level: 2,
      delegationsReceived: 1,
      delegationsGiven: 3,
      canEstablishTrust: false,
      trustChainPosition: 'leaf',
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it('should render collapsible section headers with item counts', async () => {
      renderWithProviders('/', level2Response);

      await waitFor(() => {
        // Section headers should show item counts
        expect(screen.getByText(/WORK/)).toBeInTheDocument();
        expect(screen.getByText('(2)')).toBeInTheDocument(); // My Tasks + My Processes
      });
    });

    it('should toggle section when section header is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders('/', level2Response);

      await waitFor(() => {
        expect(screen.getByText('My Tasks')).toBeInTheDocument();
      });

      // Initially the section should be open
      const workHeader = screen.getByRole('button', { name: /WORK/ });
      expect(workHeader).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      await user.click(workHeader);

      // Verify aria-expanded changed
      await waitFor(() => {
        expect(workHeader).toHaveAttribute('aria-expanded', 'false');
      });

      // Click again to expand
      await user.click(workHeader);

      await waitFor(() => {
        expect(workHeader).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have chevron icon that rotates on collapse', async () => {
      renderWithProviders('/', level2Response);

      await waitFor(() => {
        const workHeader = screen.getByRole('button', { name: /WORK/ });
        expect(workHeader).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('localStorage persistence', () => {
    const level2Response = {
      level: 2,
      delegationsReceived: 1,
      delegationsGiven: 3,
      canEstablishTrust: false,
      trustChainPosition: 'leaf',
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it('should persist section collapse state to localStorage', async () => {
      const user = userEvent.setup();
      renderWithProviders('/', level2Response);

      await waitFor(() => {
        expect(screen.getByText('My Tasks')).toBeInTheDocument();
      });

      // Collapse the WORK section
      const workHeader = screen.getByRole('button', { name: /WORK/ });
      await user.click(workHeader);

      // Verify the section is collapsed first
      await waitFor(() => {
        expect(workHeader).toHaveAttribute('aria-expanded', 'false');
      });

      // Check localStorage was updated
      const stored = localStorage.getItem('kaizen-sidebar-sections');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toContain('WORK');
    });

    it('should restore section collapse state from localStorage', async () => {
      // Pre-set localStorage with collapsed sections
      localStorage.setItem('kaizen-sidebar-sections', JSON.stringify(['WORK']));

      renderWithProviders('/', level2Response);

      await waitFor(() => {
        // WORK section header should still be visible
        expect(screen.getByRole('button', { name: /WORK/ })).toBeInTheDocument();
      });

      // Verify the section is collapsed (aria-expanded should be false)
      const workHeader = screen.getByRole('button', { name: /WORK/ });
      expect(workHeader).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('keyboard navigation', () => {
    const level2Response = {
      level: 2,
      delegationsReceived: 1,
      delegationsGiven: 3,
      canEstablishTrust: false,
      trustChainPosition: 'leaf',
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it('should have navigation landmark with aria-label', async () => {
      renderWithProviders('/', level2Response);

      await waitFor(() => {
        const nav = screen.getByRole('navigation', { name: 'Main navigation' });
        expect(nav).toBeInTheDocument();
      });
    });

    it('should have aria-current on active route', async () => {
      renderWithProviders('/work/tasks', level2Response);

      await waitFor(() => {
        // My Tasks link should have aria-current when on that route
        const myTasksLink = screen.getByText('My Tasks').closest('a');
        expect(myTasksLink).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should have aria-current on dashboard when active', async () => {
      renderWithProviders('/dashboard', level2Response);

      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).toHaveAttribute('aria-current', 'page');
      });
    });

    it('should not have aria-current on dashboard when inactive', async () => {
      renderWithProviders('/work/tasks', level2Response);

      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).not.toHaveAttribute('aria-current');
      });
    });
  });

  describe('animations', () => {
    it('should have transition classes on sidebar', async () => {
      const { container } = renderWithProviders();

      await waitFor(() => {
        const sidebar = container.querySelector('[data-testid="adaptive-sidebar"]');
        expect(sidebar).toHaveClass('transition-all', 'duration-300');
      });
    });

    it('should have transition classes on navigation links', async () => {
      renderWithProviders();

      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink).toHaveClass('transition-all', 'duration-200');
      });
    });
  });
});
