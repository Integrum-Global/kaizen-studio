/**
 * EnterpriseAuditTrail Page Tests
 *
 * Tests for the Level 3 enterprise audit trail page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnterpriseAuditTrail } from '../EnterpriseAuditTrail';
import type { AuditEvent } from '@/features/compliance/types';

// Mock the compliance hooks
vi.mock('@/features/compliance', () => ({
  useAuditEvents: vi.fn(() => ({
    data: {
      events: mockEvents,
      total: 2,
    },
    isLoading: false,
    refetch: vi.fn(),
  })),
  useExportAuditTrail: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

import { useAuditEvents, useExportAuditTrail } from '@/features/compliance';

const mockEvents: AuditEvent[] = [
  {
    id: 'event-1',
    timestamp: '2025-01-04T10:30:00Z',
    type: 'ESTABLISH',
    description: 'Trust established between Engineering and Operations',
    actorId: 'user-1',
    actorName: 'John Admin',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    valueChainId: 'vc-1',
    valueChainName: 'CI/CD Pipeline',
    metadata: { trustLevel: 'full' },
  },
  {
    id: 'event-2',
    timestamp: '2025-01-04T09:15:00Z',
    type: 'DELEGATE',
    description: 'Delegation created for API Service work unit',
    actorId: 'user-2',
    actorName: 'Jane Manager',
    targetId: 'user-3',
    targetName: 'Bob Developer',
    departmentId: 'dept-2',
    departmentName: 'Operations',
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement, initialEntries: string[] = ['/govern/audit-trail']) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EnterpriseAuditTrail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the page container', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByTestId('enterprise-audit-trail')).toBeInTheDocument();
    });

    it('should display the page title', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByRole('heading', { name: 'Enterprise Audit Trail' })).toBeInTheDocument();
    });

    it('should display the page description', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(
        screen.getByText('Complete history of trust operations across the organization')
      ).toBeInTheDocument();
    });
  });

  describe('controls', () => {
    it('should render refresh button', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should render export dropdown', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      // There are multiple comboboxes - one for export and one for event type filter
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    });

    it('should render search input', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
    });
  });

  describe('event type filter', () => {
    it('should render event type filter dropdown', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      // There should be two comboboxes (event type and export)
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('events display', () => {
    it('should display events count', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByText('2 events found')).toBeInTheDocument();
    });

    it('should render audit event rows', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByTestId('audit-event-row-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('audit-event-row-event-2')).toBeInTheDocument();
    });

    it('should display event type badges', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByText('ESTABLISH')).toBeInTheDocument();
      expect(screen.getByText('DELEGATE')).toBeInTheDocument();
    });

    it('should display actor names', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByText('By: John Admin')).toBeInTheDocument();
      expect(screen.getByText('By: Jane Manager')).toBeInTheDocument();
    });

    it('should display department badges', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
    });

    it('should display event descriptions', () => {
      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByText('Trust established between Engineering and Operations')).toBeInTheDocument();
      expect(screen.getByText('Delegation created for API Service work unit')).toBeInTheDocument();
    });
  });

  describe('event expansion', () => {
    it('should expand event when clicked', () => {
      renderWithProviders(<EnterpriseAuditTrail />);

      const eventRow = screen.getByTestId('audit-event-row-event-1');
      fireEvent.click(eventRow);

      // Check for expanded content (metadata)
      expect(screen.getByText('Additional Details')).toBeInTheDocument();
    });

    it('should collapse event when clicked again', () => {
      renderWithProviders(<EnterpriseAuditTrail />);

      const eventRow = screen.getByTestId('audit-event-row-event-1');

      // Expand
      fireEvent.click(eventRow);
      expect(screen.getByText('Additional Details')).toBeInTheDocument();

      // Collapse
      fireEvent.click(eventRow);
      expect(screen.queryByText('Additional Details')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should not display events when loading', () => {
      vi.mocked(useAuditEvents).mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(<EnterpriseAuditTrail />);
      // Events should not be displayed when loading
      expect(screen.queryByTestId('audit-event-row-event-1')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty message when no events', () => {
      vi.mocked(useAuditEvents).mockReturnValue({
        data: { events: [], total: 0 },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByText('No audit events found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or date range')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should display pagination when multiple pages', () => {
      vi.mocked(useAuditEvents).mockReturnValue({
        data: { events: mockEvents, total: 100 },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(<EnterpriseAuditTrail />);
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
    });
  });

  describe('filters', () => {
    it('should show clear filters button when filters are active', () => {
      renderWithProviders(<EnterpriseAuditTrail />);

      // Type in search to activate filter
      const searchInput = screen.getByPlaceholderText('Search events...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });
  });

  describe('refresh', () => {
    it('should call refetch when refresh button clicked', () => {
      const mockRefetch = vi.fn();
      vi.mocked(useAuditEvents).mockReturnValue({
        data: { events: mockEvents, total: 2 },
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      renderWithProviders(<EnterpriseAuditTrail />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});

describe('EnterpriseAuditTrail URL parameters', () => {
  it('should expand event from URL parameter', () => {
    renderWithProviders(<EnterpriseAuditTrail />, ['/govern/audit-trail?eventId=event-1']);

    // Event should be expanded from URL
    expect(screen.getByText('Additional Details')).toBeInTheDocument();
  });
});
