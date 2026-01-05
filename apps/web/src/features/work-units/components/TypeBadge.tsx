/**
 * TypeBadge Component
 *
 * Visual badge to differentiate between atomic and composite work units.
 * Provides accessible type indication through color, text, and shape.
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { cn } from '@/lib/utils';

export interface TypeBadgeProps {
  /**
   * Type of work unit
   */
  type: 'atomic' | 'composite';

  /**
   * Size variant
   */
  size?: 'sm' | 'md';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const typeConfig = {
  atomic: {
    label: 'Agent',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  composite: {
    label: 'Pipeline',
    className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  },
};

const sizeConfig = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
};

/**
 * TypeBadge displays the work unit type as a small pill badge.
 *
 * Design principles:
 * - Uses both color and text for accessibility (WCAG 2.1)
 * - Human-readable labels ("Agent" vs "Pipeline") instead of technical terms
 * - Subtle styling that doesn't compete with trust status badge
 */
export function TypeBadge({ type, size = 'sm', className }: TypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        config.className,
        sizeConfig[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

export default TypeBadge;
