/**
 * SubUnitCount Component
 *
 * Badge showing how many work units a composite uses.
 * Only displayed for composite work units.
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

export interface SubUnitCountProps {
  /**
   * Number of sub-units in the composite work unit
   */
  count: number;

  /**
   * Click handler to expand sub-unit list
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * SubUnitCount displays a badge indicating the number of work units
 * that a composite work unit orchestrates.
 */
export function SubUnitCount({ count, onClick, className }: SubUnitCountProps) {
  const isClickable = !!onClick;
  const Component = isClickable ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
        isClickable && 'hover:text-foreground cursor-pointer transition-colors',
        className
      )}
      aria-label={`Uses ${count} work ${count === 1 ? 'unit' : 'units'}`}
    >
      <Layers className="w-4 h-4" />
      <span>Uses {count} {count === 1 ? 'unit' : 'units'}</span>
    </Component>
  );
}

export default SubUnitCount;
