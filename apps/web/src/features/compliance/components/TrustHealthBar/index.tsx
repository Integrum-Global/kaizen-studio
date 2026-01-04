/**
 * TrustHealthBar Component
 *
 * Stacked horizontal bar showing trust health distribution.
 * Displays valid, expiring, expired, and revoked trust counts.
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TrustHealthBarProps } from '../../types';

/**
 * Segment configuration
 */
const SEGMENTS = {
  valid: {
    color: 'bg-green-500',
    label: 'Valid',
    description: 'Active trust relationships',
  },
  expiring: {
    color: 'bg-amber-500',
    label: 'Expiring',
    description: 'Expiring within 7 days',
  },
  expired: {
    color: 'bg-red-500',
    label: 'Expired',
    description: 'Trust has expired',
  },
  revoked: {
    color: 'bg-gray-400',
    label: 'Revoked',
    description: 'Trust was revoked',
  },
};

type SegmentKey = keyof typeof SEGMENTS;

interface SegmentData {
  key: SegmentKey;
  count: number;
  percentage: number;
}

/**
 * Legend item component
 */
function LegendItem({
  segment,
  count,
}: {
  segment: (typeof SEGMENTS)[SegmentKey];
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-3 h-3 rounded-sm', segment.color)} />
      <span className="text-sm">
        {segment.label}: <strong>{count}</strong>
      </span>
    </div>
  );
}

/**
 * TrustHealthBar Component
 */
export function TrustHealthBar({
  valid,
  expiring,
  expired,
  revoked,
  className,
  showLegend = true,
  showPercentage = true,
  animate = true,
}: TrustHealthBarProps) {
  // Calculate totals and percentages
  const { total, segments, healthPercentage } = useMemo(() => {
    const total = valid + expiring + expired + revoked;

    if (total === 0) {
      return {
        total: 0,
        segments: [],
        healthPercentage: 0,
      };
    }

    const allSegments: SegmentData[] = [
      { key: 'valid' as const, count: valid, percentage: (valid / total) * 100 },
      { key: 'expiring' as const, count: expiring, percentage: (expiring / total) * 100 },
      { key: 'expired' as const, count: expired, percentage: (expired / total) * 100 },
      { key: 'revoked' as const, count: revoked, percentage: (revoked / total) * 100 },
    ];
    const segments = allSegments.filter((s) => s.count > 0);

    // Health percentage = valid / total * 100
    const healthPercentage = Math.round((valid / total) * 100);

    return { total, segments, healthPercentage };
  }, [valid, expiring, expired, revoked]);

  // Empty state
  if (total === 0) {
    return (
      <div
        className={cn('space-y-2', className)}
        data-testid="trust-health-bar"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Trust Health</span>
          <span className="text-sm text-muted-foreground">No data</span>
        </div>
        <div className="h-4 rounded-full bg-muted" />
        <p className="text-xs text-muted-foreground">
          No trust relationships to display
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="trust-health-bar"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Trust Health</span>
        {showPercentage && (
          <span
            className={cn(
              'text-sm font-semibold',
              healthPercentage >= 90
                ? 'text-green-600'
                : healthPercentage >= 70
                  ? 'text-amber-600'
                  : 'text-red-600'
            )}
            data-testid="health-percentage"
          >
            {healthPercentage}%
          </span>
        )}
      </div>

      {/* Stacked Bar */}
      <div
        className="h-4 rounded-full overflow-hidden flex bg-muted"
        data-testid="health-bar-container"
      >
        {segments.map((segment, index) => (
          <div
            key={segment.key}
            className={cn(
              SEGMENTS[segment.key].color,
              animate && 'transition-all duration-500 ease-out',
              index === 0 && 'rounded-l-full',
              index === segments.length - 1 && 'rounded-r-full'
            )}
            style={{ width: `${segment.percentage}%` }}
            title={`${SEGMENTS[segment.key].label}: ${segment.count} (${Math.round(segment.percentage)}%)`}
            data-testid={`segment-${segment.key}`}
          />
        ))}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 text-xs" data-testid="health-legend">
          <LegendItem segment={SEGMENTS.valid} count={valid} />
          {expiring > 0 && <LegendItem segment={SEGMENTS.expiring} count={expiring} />}
          {expired > 0 && <LegendItem segment={SEGMENTS.expired} count={expired} />}
          {revoked > 0 && <LegendItem segment={SEGMENTS.revoked} count={revoked} />}
        </div>
      )}
    </div>
  );
}

export default TrustHealthBar;
