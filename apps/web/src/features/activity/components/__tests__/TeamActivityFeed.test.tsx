/**
 * TeamActivityFeed Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamActivityFeed } from '../TeamActivityFeed';
import type { ActivityEvent } from '@/features/work-units/api/work-units';

describe('TeamActivityFeed', () => {
  const createMockEvent = (
    overrides?: Partial<ActivityEvent>
  ): ActivityEvent => ({
    id: `event-${Math.random().toString(36).slice(2)}`,
    type: 'completion',
    userId: 'user-123',
    userName: 'Alice Smith',
    workUnitId: 'wu-456',
    workUnitName: 'Invoice Processor',
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  const defaultHandlers = {
    onViewError: vi.fn(),
    onRetry: vi.fn(),
    onViewAll: vi.fn(),
    onRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render feed with test id', () => {
      render(<TeamActivityFeed events={[]} />);
      expect(screen.getByTestId('team-activity-feed')).toBeInTheDocument();
    });

    it('should render header with title', () => {
      render(<TeamActivityFeed events={[]} />);
      expect(screen.getByText('Team Activity')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <TeamActivityFeed events={[]} className="custom-feed" />
      );
      expect(container.querySelector('.custom-feed')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no events', () => {
      render(<TeamActivityFeed events={[]} />);
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
      expect(screen.getByText('Team activity will appear here')).toBeInTheDocument();
    });

    it('should show empty state when events is undefined', () => {
      render(<TeamActivityFeed />);
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show skeletons when loading', () => {
      const { container } = render(<TeamActivityFeed isLoading events={[]} />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should disable refresh button when loading', () => {
      render(
        <TeamActivityFeed
          isLoading
          events={[]}
          onRefresh={defaultHandlers.onRefresh}
        />
      );

      const refreshButton = screen.getByRole('button', { name: '' }); // Refresh button has no text
      expect(refreshButton).toBeDisabled();
    });

    it('should show spinning icon when loading', () => {
      const { container } = render(
        <TeamActivityFeed
          isLoading
          events={[]}
          onRefresh={defaultHandlers.onRefresh}
        />
      );

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when error is present', () => {
      render(
        <TeamActivityFeed
          events={[]}
          error={new Error('Network error')}
        />
      );

      expect(screen.getByText('Failed to load activity')).toBeInTheDocument();
    });

    it('should show refresh button in error state', () => {
      render(
        <TeamActivityFeed
          events={[]}
          error={new Error('Network error')}
          onRefresh={defaultHandlers.onRefresh}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should call onRefresh when refresh clicked in error state', async () => {
      const user = userEvent.setup();

      render(
        <TeamActivityFeed
          events={[]}
          error={new Error('Network error')}
          onRefresh={defaultHandlers.onRefresh}
        />
      );

      await user.click(screen.getByRole('button'));
      expect(defaultHandlers.onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('event rendering', () => {
    it('should render activity events', () => {
      const events = [
        createMockEvent({ userName: 'Alice', workUnitName: 'Task A' }),
        createMockEvent({ userName: 'Bob', workUnitName: 'Task B' }),
      ];

      render(<TeamActivityFeed events={events} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Task A')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Task B')).toBeInTheDocument();
    });

    it('should respect limit prop', () => {
      const events = [
        createMockEvent({ userName: 'Alice' }),
        createMockEvent({ userName: 'Bob' }),
        createMockEvent({ userName: 'Charlie' }),
        createMockEvent({ userName: 'David' }),
      ];

      render(<TeamActivityFeed events={events} limit={2} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
      expect(screen.queryByText('David')).not.toBeInTheDocument();
    });
  });

  describe('event types', () => {
    it('should render run event with spinning icon', () => {
      const { container } = render(
        <TeamActivityFeed
          events={[createMockEvent({ type: 'run' })]}
        />
      );

      expect(screen.getByText('started')).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should render completion event', () => {
      render(
        <TeamActivityFeed
          events={[createMockEvent({ type: 'completion' })]}
        />
      );

      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('should render error event', () => {
      render(
        <TeamActivityFeed
          events={[
            createMockEvent({
              type: 'error',
              details: { errorMessage: 'Something went wrong' },
            }),
          ]}
        />
      );

      expect(screen.getByText('failed')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render delegation event', () => {
      render(
        <TeamActivityFeed
          events={[
            createMockEvent({
              type: 'delegation',
              details: { delegateeName: 'Charlie' },
            }),
          ]}
        />
      );

      expect(screen.getByText('delegated')).toBeInTheDocument();
      expect(screen.getByText('to')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  describe('relative time formatting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should show "Just now" for very recent events', () => {
      const now = new Date('2024-06-15T12:00:00Z');

      render(
        <TeamActivityFeed
          events={[createMockEvent({ timestamp: now.toISOString() })]}
        />
      );

      expect(screen.getByText('Just now')).toBeInTheDocument();
    });

    it('should show minutes ago for recent events', () => {
      const fiveMinutesAgo = new Date('2024-06-15T11:55:00Z');

      render(
        <TeamActivityFeed
          events={[createMockEvent({ timestamp: fiveMinutesAgo.toISOString() })]}
        />
      );

      expect(screen.getByText('5 min ago')).toBeInTheDocument();
    });

    it('should show hours ago for older events', () => {
      const twoHoursAgo = new Date('2024-06-15T10:00:00Z');

      render(
        <TeamActivityFeed
          events={[createMockEvent({ timestamp: twoHoursAgo.toISOString() })]}
        />
      );

      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('should show days ago for multi-day old events', () => {
      const threeDaysAgo = new Date('2024-06-12T12:00:00Z');

      render(
        <TeamActivityFeed
          events={[createMockEvent({ timestamp: threeDaysAgo.toISOString() })]}
        />
      );

      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });
  });

  describe('error event actions', () => {
    it('should show View Error button for error events', () => {
      render(
        <TeamActivityFeed
          events={[
            createMockEvent({
              type: 'error',
              details: { runId: 'run-123' },
            }),
          ]}
          onViewError={defaultHandlers.onViewError}
        />
      );

      expect(screen.getByText('View Error')).toBeInTheDocument();
    });

    it('should call onViewError with runId when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamActivityFeed
          events={[
            createMockEvent({
              type: 'error',
              details: { runId: 'run-123' },
            }),
          ]}
          onViewError={defaultHandlers.onViewError}
        />
      );

      await user.click(screen.getByText('View Error'));
      expect(defaultHandlers.onViewError).toHaveBeenCalledWith('run-123');
    });

    it('should show Retry button for error events', () => {
      render(
        <TeamActivityFeed
          events={[
            createMockEvent({
              type: 'error',
              workUnitId: 'wu-123',
            }),
          ]}
          onRetry={defaultHandlers.onRetry}
        />
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onRetry with workUnitId when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamActivityFeed
          events={[
            createMockEvent({
              type: 'error',
              workUnitId: 'wu-123',
            }),
          ]}
          onRetry={defaultHandlers.onRetry}
        />
      );

      await user.click(screen.getByText('Retry'));
      expect(defaultHandlers.onRetry).toHaveBeenCalledWith('wu-123');
    });

    it('should not show error actions for non-error events', () => {
      render(
        <TeamActivityFeed
          events={[createMockEvent({ type: 'completion' })]}
          onViewError={defaultHandlers.onViewError}
          onRetry={defaultHandlers.onRetry}
        />
      );

      expect(screen.queryByText('View Error')).not.toBeInTheDocument();
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });
  });

  describe('header actions', () => {
    it('should show refresh button when onRefresh is provided', () => {
      render(
        <TeamActivityFeed
          events={[]}
          onRefresh={defaultHandlers.onRefresh}
        />
      );

      // Find the refresh button in header (not in error state)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should call onRefresh when refresh is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamActivityFeed
          events={[]}
          onRefresh={defaultHandlers.onRefresh}
        />
      );

      // Click the first button (refresh in header)
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      expect(defaultHandlers.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should show View All button when showViewAll is true', () => {
      render(
        <TeamActivityFeed
          events={[]}
          showViewAll
          onViewAll={defaultHandlers.onViewAll}
        />
      );

      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    it('should not show View All button when showViewAll is false', () => {
      render(
        <TeamActivityFeed
          events={[]}
          showViewAll={false}
          onViewAll={defaultHandlers.onViewAll}
        />
      );

      expect(screen.queryByText('View All')).not.toBeInTheDocument();
    });

    it('should call onViewAll when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TeamActivityFeed
          events={[]}
          showViewAll
          onViewAll={defaultHandlers.onViewAll}
        />
      );

      await user.click(screen.getByText('View All'));
      expect(defaultHandlers.onViewAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('event test ids', () => {
    it('should have unique test id for each event', () => {
      const events = [
        createMockEvent({ id: 'event-1' }),
        createMockEvent({ id: 'event-2' }),
      ];

      render(<TeamActivityFeed events={events} />);

      expect(screen.getByTestId('activity-item-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('activity-item-event-2')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have proper container styling', () => {
      const { container } = render(<TeamActivityFeed events={[]} />);
      const feed = container.querySelector('.rounded-lg.border');
      expect(feed).toBeInTheDocument();
    });

    it('should have divider between events', () => {
      const { container } = render(
        <TeamActivityFeed
          events={[
            createMockEvent({ id: 'e1' }),
            createMockEvent({ id: 'e2' }),
          ]}
        />
      );

      const divider = container.querySelector('.divide-y');
      expect(divider).toBeInTheDocument();
    });

    it('should apply hover effect on event items', () => {
      const { container } = render(
        <TeamActivityFeed events={[createMockEvent()]} />
      );

      const item = container.querySelector('.hover\\:bg-muted\\/50');
      expect(item).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle event without details', () => {
      render(
        <TeamActivityFeed
          events={[createMockEvent({ type: 'error', details: undefined })]}
        />
      );

      expect(screen.getByText('failed')).toBeInTheDocument();
      // Should not crash when accessing details
    });

    it('should handle event without runId in error details', () => {
      render(
        <TeamActivityFeed
          events={[
            createMockEvent({
              type: 'error',
              details: { errorMessage: 'Error' },
            }),
          ]}
          onViewError={defaultHandlers.onViewError}
        />
      );

      // View Error button should not be shown without runId
      expect(screen.queryByText('View Error')).not.toBeInTheDocument();
    });

    it('should handle singular "1 hour ago"', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const oneHourAgo = new Date('2024-06-15T11:00:00Z');

      render(
        <TeamActivityFeed
          events={[createMockEvent({ timestamp: oneHourAgo.toISOString() })]}
        />
      );

      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('should handle singular "1 day ago"', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const oneDayAgo = new Date('2024-06-14T12:00:00Z');

      render(
        <TeamActivityFeed
          events={[createMockEvent({ timestamp: oneDayAgo.toISOString() })]}
        />
      );

      expect(screen.getByText('1 day ago')).toBeInTheDocument();
      vi.useRealTimers();
    });
  });
});
