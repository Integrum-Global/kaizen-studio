/**
 * ExpiryBadge
 *
 * Displays workspace expiration status with visual warnings.
 * Color-coded based on remaining time until expiration.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExpiryBadgeProps {
  /** ISO date string of expiration */
  expiresAt: string;
  /** Optional size variant */
  size?: 'sm' | 'md';
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Additional class names */
  className?: string;
}

type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'normal';

/**
 * Calculate days until expiration and determine status
 */
function getExpiryInfo(expiresAt: string): {
  daysRemaining: number;
  status: ExpiryStatus;
  label: string;
} {
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      status: 'expired',
      label: 'Expired',
    };
  }

  if (daysRemaining === 0) {
    return {
      daysRemaining: 0,
      status: 'critical',
      label: 'Expires today',
    };
  }

  if (daysRemaining === 1) {
    return {
      daysRemaining: 1,
      status: 'critical',
      label: 'Expires tomorrow',
    };
  }

  if (daysRemaining <= 7) {
    return {
      daysRemaining,
      status: 'warning',
      label: `Expires in ${daysRemaining} days`,
    };
  }

  // More than 7 days - show date
  const formattedDate = expiryDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year:
      expiryDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return {
    daysRemaining,
    status: 'normal',
    label: `Expires ${formattedDate}`,
  };
}

/**
 * Get styling based on expiry status
 */
function getStatusStyles(status: ExpiryStatus): {
  badgeVariant: 'destructive' | 'secondary' | 'outline' | 'default';
  icon: typeof AlertTriangle;
  className: string;
} {
  switch (status) {
    case 'expired':
      return {
        badgeVariant: 'destructive',
        icon: AlertTriangle,
        className: 'bg-destructive text-destructive-foreground',
      };
    case 'critical':
      return {
        badgeVariant: 'destructive',
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
    case 'warning':
      return {
        badgeVariant: 'secondary',
        icon: Clock,
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'normal':
    default:
      return {
        badgeVariant: 'outline',
        icon: Calendar,
        className: 'bg-muted text-muted-foreground',
      };
  }
}

export function ExpiryBadge({
  expiresAt,
  size = 'md',
  showIcon = true,
  className,
}: ExpiryBadgeProps) {
  const { status, label } = getExpiryInfo(expiresAt);
  const { icon: Icon, className: statusClassName } = getStatusStyles(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-normal',
        size === 'sm' && 'text-xs px-1.5 py-0',
        statusClassName,
        className
      )}
      data-testid="expiry-badge"
      data-status={status}
    >
      {showIcon && (
        <Icon
          className={cn(
            'shrink-0',
            size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
          )}
        />
      )}
      <span>{label}</span>
    </Badge>
  );
}

export default ExpiryBadge;
