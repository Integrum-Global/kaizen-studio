/**
 * WorkUnitIcon Component
 *
 * Visual differentiation between atomic and composite work units.
 * - Atomic: Single circle icon representing a single capability
 * - Composite: Stacked circles representing orchestration of multiple units
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { cn } from '@/lib/utils';
import { Circle, CircleDot } from 'lucide-react';

export interface WorkUnitIconProps {
  /**
   * Type of work unit
   * - atomic: Single capability
   * - composite: Orchestration of multiple work units
   */
  type: 'atomic' | 'composite';

  /**
   * Size variant
   * - sm: 32px (for compact views, lists)
   * - md: 48px (default, for cards)
   * - lg: 64px (for detail views)
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    iconSmall: 'w-3 h-3',
  },
  md: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
    iconSmall: 'w-4 h-4',
  },
  lg: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
    iconSmall: 'w-6 h-6',
  },
};

/**
 * WorkUnitIcon renders a visual icon representing the work unit type.
 *
 * The design uses subtle visual metaphors:
 * - Atomic units show a single solid circle (focused, direct execution)
 * - Composite units show stacked circles with decreasing opacity (layered orchestration)
 */
export function WorkUnitIcon({ type, size = 'md', className }: WorkUnitIconProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-muted',
        config.container,
        className
      )}
      role="img"
      aria-label={type === 'atomic' ? 'Atomic work unit' : 'Composite work unit'}
    >
      {type === 'atomic' ? (
        <CircleDot className={cn('text-primary', config.icon)} />
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Back circle - most transparent */}
          <Circle
            className={cn(
              'absolute text-primary/30',
              config.iconSmall
            )}
            style={{ transform: 'translate(-25%, -25%)' }}
          />
          {/* Middle circle - medium transparency */}
          <Circle
            className={cn(
              'absolute text-primary/60',
              config.iconSmall
            )}
            style={{ transform: 'translate(-10%, -10%)' }}
          />
          {/* Front circle - full opacity */}
          <Circle
            className={cn(
              'text-primary',
              config.iconSmall
            )}
            style={{ transform: 'translate(5%, 5%)' }}
          />
        </div>
      )}
    </div>
  );
}

export default WorkUnitIcon;
