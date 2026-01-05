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
import { Bot, GitBranch } from 'lucide-react';

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
 * The design uses distinct visual metaphors:
 * - Atomic: Bot icon (single AI agent) with blue accent
 * - Composite: GitBranch icon (workflow/pipeline) with purple accent
 */
export function WorkUnitIcon({ type, size = 'md', className }: WorkUnitIconProps) {
  const config = sizeConfig[size];
  const isAtomic = type === 'atomic';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg',
        isAtomic ? 'bg-primary/10' : 'bg-purple-100 dark:bg-purple-900/30',
        config.container,
        className
      )}
      role="img"
      aria-label={isAtomic ? 'Atomic work unit (single agent)' : 'Composite work unit (pipeline)'}
    >
      {isAtomic ? (
        <Bot className={cn('text-primary', config.icon)} />
      ) : (
        <GitBranch className={cn('text-purple-600 dark:text-purple-400', config.icon)} />
      )}
    </div>
  );
}

export default WorkUnitIcon;
