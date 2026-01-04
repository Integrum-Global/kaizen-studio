/**
 * TrustStatusBadge Component
 *
 * Displays trust status with appropriate visual treatment.
 * Trust is central to the EATP model - this badge appears on every work unit
 * to provide immediate visibility into trust state.
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { cn } from '@/lib/utils';
import { CheckCircle, Clock, XCircle, MoreHorizontal } from 'lucide-react';
import type { TrustStatus } from '../types';

export interface TrustStatusBadgeProps {
  /**
   * Current trust status
   */
  status: TrustStatus;

  /**
   * ISO date string for trust expiration
   */
  expiresAt?: string;

  /**
   * Whether to show expiry countdown
   */
  showExpiry?: boolean;

  /**
   * Size variant
   */
  size?: 'sm' | 'md';

  /**
   * Click handler for viewing trust details
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const statusConfig = {
  valid: {
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    icon: CheckCircle,
    label: 'Trust Valid',
    shortLabel: 'Valid',
  },
  expired: {
    color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    icon: Clock,
    label: 'Trust Expired',
    shortLabel: 'Expired',
  },
  revoked: {
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    icon: XCircle,
    label: 'Trust Revoked',
    shortLabel: 'Revoked',
  },
  pending: {
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
    icon: MoreHorizontal,
    label: 'Setup Pending',
    shortLabel: 'Pending',
  },
};

/**
 * Format expiry time as a relative countdown
 */
function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const expiry = new Date(isoDate);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30);
    return `${months}mo`;
  }
  if (diffDays > 0) {
    return `${diffDays}d`;
  }
  if (diffHours > 0) {
    return `${diffHours}h`;
  }
  return 'Soon';
}

/**
 * TrustStatusBadge shows the trust status with visual indicators.
 *
 * The design follows the EATP principle that trust should always be visible.
 * Users should never have to guess whether they can execute a task.
 */
export function TrustStatusBadge({
  status,
  expiresAt,
  showExpiry = false,
  size = 'md',
  onClick,
  className,
}: TrustStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const isClickable = !!onClick;
  const Component = isClickable ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        size === 'sm' ? 'text-xs' : 'text-sm',
        config.color,
        isClickable && 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        className
      )}
      role={isClickable ? 'button' : 'status'}
      aria-label={`Trust status: ${config.label}${showExpiry && expiresAt ? `, expires in ${formatRelativeTime(expiresAt)}` : ''}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
      {showExpiry && expiresAt && status === 'valid' && (
        <span className="text-green-600 dark:text-green-400">
          ({formatRelativeTime(expiresAt)})
        </span>
      )}
    </Component>
  );
}

export default TrustStatusBadge;
