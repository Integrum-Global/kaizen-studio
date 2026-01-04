/**
 * CapabilityTags Component
 *
 * Displays work unit capabilities as compact tags.
 * Capabilities represent what a work unit can do (e.g., extract, validate, route).
 *
 * @see docs/plans/eatp-frontend/03-work-units-ui.md
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface CapabilityTagsProps {
  /**
   * List of capability names
   */
  capabilities: string[];

  /**
   * Maximum number of visible tags before showing "+N more"
   */
  maxVisible?: number;

  /**
   * Click handler for individual capability
   */
  onClick?: (capability: string) => void;

  /**
   * Size variant
   */
  size?: 'sm' | 'md';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * CapabilityTags renders capabilities as a horizontal list of badges.
 *
 * When there are more capabilities than maxVisible, it shows a "+N more"
 * badge with a tooltip listing all capabilities.
 */
export function CapabilityTags({
  capabilities,
  maxVisible = 4,
  onClick,
  size = 'md',
  className,
}: CapabilityTagsProps) {
  if (!capabilities || capabilities.length === 0) {
    return (
      <span className="text-sm text-muted-foreground italic">
        No capabilities defined
      </span>
    );
  }

  const visibleCapabilities = capabilities.slice(0, maxVisible);
  const hiddenCount = capabilities.length - maxVisible;
  const hasOverflow = hiddenCount > 0;

  const badgeSize = size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5';

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      role="list"
      aria-label="Capabilities"
    >
      {visibleCapabilities.map((capability) => (
        <Badge
          key={capability}
          variant="secondary"
          className={cn(
            badgeSize,
            'font-normal',
            onClick && 'cursor-pointer hover:bg-secondary/80'
          )}
          onClick={onClick ? () => onClick(capability) : undefined}
          role="listitem"
        >
          {capability}
        </Badge>
      ))}

      {hasOverflow && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(badgeSize, 'font-normal cursor-help')}
                role="listitem"
              >
                +{hiddenCount} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs font-medium mb-1">All capabilities:</p>
              <div className="flex flex-wrap gap-1">
                {capabilities.map((cap) => (
                  <Badge
                    key={cap}
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    {cap}
                  </Badge>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default CapabilityTags;
