/**
 * WorkspaceCard Component
 *
 * Card display for a workspace, showing type, membership, and work unit counts.
 * Workspaces are purpose-driven collections of work units that can cross departmental boundaries.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  Archive,
  FolderOpen,
  Users,
  Boxes,
  Calendar,
  Building2,
  FolderClock,
  Star,
  Lock,
} from 'lucide-react';
import type { WorkspaceType } from '../types';

interface WorkspaceCardProps {
  /** The workspace to display */
  workspace: {
    id: string;
    name: string;
    description?: string;
    workspaceType: WorkspaceType;
    color?: string;
    ownerName: string;
    memberCount: number;
    workUnitCount: number;
    expiresAt?: string;
    isArchived: boolean;
    isPersonal?: boolean;
  };
  /** Open/view workspace handler */
  onOpen: () => void;
  /** Edit workspace handler */
  onEdit?: () => void;
  /** Archive workspace handler */
  onArchive?: () => void;
  /** Optional card click handler */
  onClick?: () => void;
  /** Whether the card is in a loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get icon component for workspace type
 */
function getTypeIcon(type: WorkspaceType) {
  switch (type) {
    case 'permanent':
      return Building2;
    case 'temporary':
      return FolderClock;
    case 'personal':
      return Star;
    default:
      return FolderOpen;
  }
}

/**
 * Get badge variant for workspace type
 */
function getTypeBadgeVariant(type: WorkspaceType): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'permanent':
      return 'default';
    case 'temporary':
      return 'secondary';
    case 'personal':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get display label for workspace type
 */
function getTypeLabel(type: WorkspaceType): string {
  switch (type) {
    case 'permanent':
      return 'Permanent';
    case 'temporary':
      return 'Temporary';
    case 'personal':
      return 'Personal';
    default:
      return type;
  }
}

/**
 * Format expiration date
 */
function formatExpiration(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();

  // Check if expired
  if (date < now) {
    return 'Expired';
  }

  // Compare calendar days
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expirationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((expirationDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Expires today';
  } else if (diffDays === 1) {
    return 'Expires tomorrow';
  } else if (diffDays <= 7) {
    return `Expires in ${diffDays} days`;
  } else {
    return `Expires: ${date.toLocaleDateString()}`;
  }
}

/**
 * WorkspaceCard displays a workspace with its type, members, and work units.
 *
 * Key features:
 * - Workspace type indicator (permanent/temporary/personal)
 * - Member count display
 * - Work unit count display
 * - Expiration date for temporary workspaces
 * - Action buttons (Open, Edit, Archive)
 */
export function WorkspaceCard({
  workspace,
  onOpen,
  onEdit,
  onArchive,
  onClick,
  isLoading,
  className,
}: WorkspaceCardProps) {
  const TypeIcon = getTypeIcon(workspace.workspaceType);
  const isExpired =
    workspace.expiresAt && new Date(workspace.expiresAt) < new Date();

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        onClick && 'cursor-pointer hover:shadow-md',
        workspace.isArchived && 'opacity-60',
        className
      )}
      onClick={onClick}
      data-testid="workspace-card"
    >
      {/* Color accent bar */}
      {workspace.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: workspace.color }}
          data-testid="workspace-color-bar"
        />
      )}

      <CardHeader className={cn('pb-3', workspace.color && 'pt-5')}>
        <div className="flex items-start gap-4">
          {/* Workspace type icon */}
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              workspace.workspaceType === 'permanent' && 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
              workspace.workspaceType === 'temporary' && 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
              workspace.workspaceType === 'personal' && 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
            )}
            data-testid="workspace-type-icon"
          >
            <TypeIcon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-lg truncate">{workspace.name}</h3>
              <Badge variant={getTypeBadgeVariant(workspace.workspaceType)}>
                {getTypeLabel(workspace.workspaceType)}
              </Badge>
            </div>
            {workspace.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {workspace.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          {/* Work Unit Count */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Boxes className="w-4 h-4" />
                  <span>{workspace.workUnitCount} work units</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{workspace.workUnitCount} work unit{workspace.workUnitCount !== 1 ? 's' : ''} in this workspace</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Member Count */}
          {!workspace.isPersonal && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{workspace.memberCount} members</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Personal indicator */}
          {workspace.isPersonal && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Private</span>
            </div>
          )}
        </div>

        {/* Expiration Row */}
        {workspace.expiresAt && (
          <div
            className={cn(
              'flex items-center gap-1.5 text-sm',
              isExpired
                ? 'text-red-600 dark:text-red-500'
                : 'text-muted-foreground'
            )}
            data-testid="workspace-expiration"
          >
            <Calendar className="w-4 h-4" />
            <span>{formatExpiration(workspace.expiresAt)}</span>
          </div>
        )}

        {/* Archived Badge */}
        {workspace.isArchived && (
          <Badge variant="outline" className="text-muted-foreground" data-testid="workspace-archived-badge">
            <Archive className="w-3 h-3 mr-1" />
            Archived
          </Badge>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/20">
        <div className="flex items-center gap-2 w-full">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            disabled={isLoading}
            data-testid="workspace-open-btn"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Open
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              disabled={isLoading || workspace.isArchived}
              data-testid="workspace-edit-btn"
            >
              <Settings className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          <div className="flex-1" />
          {onArchive && !workspace.isArchived && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              disabled={isLoading}
              data-testid="workspace-archive-btn"
            >
              <Archive className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default WorkspaceCard;
