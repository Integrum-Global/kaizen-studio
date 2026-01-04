/**
 * AdaptiveSidebar Component
 *
 * Navigation sidebar that adapts based on user level.
 * Shows different navigation items depending on whether the user is:
 * - Level 1 (Task Performer): Only "My Tasks"
 * - Level 2 (Process Owner): Full BUILD and partial GOVERN sections
 * - Level 3 (Value Chain Owner): All sections including compliance
 *
 * Features:
 * - Level-based section visibility
 * - Collapsible sections with smooth animations
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - LocalStorage persistence for section state
 * - Tooltip support in collapsed mode
 *
 * @see docs/plans/eatp-ontology/03-user-experience-levels.md
 */

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  Workflow,
  Network,
  Box,
  Folder,
  Server,
  Shield,
  ShieldCheck,
  FileText,
  BarChart,
  Activity,
  AlertCircle,
  Settings,
  Key,
  Webhook,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { UserMenu } from './UserMenu';
import { useUserLevel, getLevelLabel } from '@/contexts/UserLevelContext';
import type { UserLevel } from '@/features/work-units/types';

const STORAGE_KEY = 'kaizen-sidebar-sections';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  minLevel: UserLevel;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Navigation configuration with level requirements
 *
 * Based on EATP Ontology user experience levels:
 * - Level 1: WORK > My Tasks only
 * - Level 2: WORK, BUILD, partial GOVERN
 * - Level 3: All sections
 */
const navSections: NavSection[] = [
  {
    title: 'WORK',
    items: [
      { label: 'My Tasks', href: '/work/tasks', icon: ClipboardList, minLevel: 1 },
      { label: 'My Processes', href: '/work/processes', icon: Workflow, minLevel: 2 },
      { label: 'Value Chains', href: '/work/value-chains', icon: Network, minLevel: 3 },
    ],
  },
  {
    title: 'BUILD',
    items: [
      { label: 'Work Units', href: '/build/work-units', icon: Box, minLevel: 2 },
      { label: 'Workspaces', href: '/build/workspaces', icon: Folder, minLevel: 2 },
      { label: 'Connectors', href: '/connectors', icon: Server, minLevel: 2 },
    ],
  },
  {
    title: 'GOVERN',
    items: [
      { label: 'Trust', href: '/trust', icon: ShieldCheck, minLevel: 2 },
      { label: 'Compliance', href: '/governance/compliance', icon: Shield, minLevel: 3 },
      { label: 'Activity', href: '/audit', icon: Activity, minLevel: 3 },
    ],
  },
  {
    title: 'OBSERVE',
    items: [
      { label: 'Metrics', href: '/metrics', icon: BarChart, minLevel: 2 },
      { label: 'Logs', href: '/logs', icon: FileText, minLevel: 2 },
      { label: 'Alerts', href: '/alerts', icon: AlertCircle, minLevel: 2 },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Teams', href: '/teams', icon: Users, minLevel: 2 },
      { label: 'Organizations', href: '/organizations', icon: Building2, minLevel: 3 },
      { label: 'Settings', href: '/settings', icon: Settings, minLevel: 2 },
      { label: 'API Keys', href: '/api-keys', icon: Key, minLevel: 2 },
      { label: 'Webhooks', href: '/webhooks', icon: Webhook, minLevel: 2 },
    ],
  },
];

/**
 * Filter nav items based on user level
 */
function getVisibleSections(userLevel: UserLevel): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.minLevel <= userLevel),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * Hook to manage section collapse state with localStorage persistence
 */
function useSectionState(visibleSections: NavSection[]) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // Ignore parse errors
    }
    return new Set<string>();
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsedSections]));
    } catch {
      // Ignore storage errors
    }
  }, [collapsedSections]);

  const toggleSection = useCallback((sectionTitle: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  }, []);

  const isSectionCollapsed = useCallback(
    (sectionTitle: string) => collapsedSections.has(sectionTitle),
    [collapsedSections]
  );

  const expandAll = useCallback(() => {
    setCollapsedSections(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedSections(new Set(visibleSections.map((s) => s.title)));
  }, [visibleSections]);

  return {
    toggleSection,
    isSectionCollapsed,
    expandAll,
    collapseAll,
  };
}

/**
 * Collapsible section header with animation
 * Note: The toggle is handled by Collapsible's onOpenChange, NOT by onClick
 * to avoid double-toggling when CollapsibleTrigger is clicked.
 */
function SectionHeader({
  title,
  isOpen,
  itemCount,
}: {
  title: string;
  isOpen: boolean;
  itemCount: number;
}) {
  return (
    <CollapsibleTrigger asChild>
      <button
        className={cn(
          'flex w-full items-center justify-between px-6 py-1.5 text-xs font-semibold uppercase tracking-wider',
          'text-muted-foreground hover:text-foreground transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm'
        )}
        aria-expanded={isOpen}
        aria-controls={`section-${title.toLowerCase()}`}
      >
        <span className="flex items-center gap-2">
          {title}
          <span className="text-[10px] text-muted-foreground/60">({itemCount})</span>
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            isOpen ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>
    </CollapsibleTrigger>
  );
}

/**
 * Level indicator badge
 */
function LevelIndicator({ level }: { level: UserLevel }) {
  const colors = {
    1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    2: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div
      className={cn(
        'px-2 py-1 rounded-md text-xs font-medium',
        colors[level]
      )}
      title={getLevelLabel(level)}
    >
      L{level}
    </div>
  );
}

/**
 * AdaptiveSidebar adapts navigation based on user level.
 *
 * Key behaviors:
 * 1. Level 1 users only see "My Tasks" in the WORK section
 * 2. Level 2 users see BUILD sections and partial GOVERN
 * 3. Level 3 users see all sections including compliance
 *
 * The sidebar also supports:
 * - Collapsed mode for more screen space
 * - Collapsible sections with smooth animations
 * - Keyboard navigation (Arrow Up/Down, Enter)
 * - LocalStorage persistence for section state
 */
export function AdaptiveSidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { level, isLoading } = useUserLevel();
  const navRef = useRef<HTMLElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Get sections visible to this user
  const visibleSections = getVisibleSections(level);

  // Section collapse state with persistence
  const { toggleSection, isSectionCollapsed } = useSectionState(visibleSections);

  // Flatten all navigation items for keyboard navigation
  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Home, minLevel: 1 as UserLevel },
    ...visibleSections.flatMap((section) => section.items),
  ];

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, allNavItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(allNavItems.length - 1);
          break;
      }
    },
    [allNavItems.length]
  );

  // Focus the item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && navRef.current) {
      const links = navRef.current.querySelectorAll<HTMLAnchorElement>('a[data-nav-item]');
      links[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
      data-testid="adaptive-sidebar"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarCollapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">K</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">K</span>
            </div>
            <span className="text-lg font-bold">Kaizen Studio</span>
          </div>
        )}
        {!sidebarCollapsed && !isLoading && (
          <LevelIndicator level={level} />
        )}
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 overflow-y-auto py-4"
        role="navigation"
        aria-label="Main navigation"
        onKeyDown={handleKeyDown}
      >
        {/* Dashboard - always visible */}
        <div className="mb-4 px-3">
          <Link
            to="/dashboard"
            data-nav-item
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              location.pathname === '/dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Navigation Sections */}
        {visibleSections.map((section, idx) => {
          const isOpen = !isSectionCollapsed(section.title);

          return (
            <Collapsible
              key={section.title}
              open={sidebarCollapsed ? true : isOpen}
              onOpenChange={() => !sidebarCollapsed && toggleSection(section.title)}
              className="mb-2"
            >
              {!sidebarCollapsed && (
                <SectionHeader
                  title={section.title}
                  isOpen={isOpen}
                  itemCount={section.items.length}
                />
              )}
              {sidebarCollapsed && idx > 0 && <Separator className="mx-3 my-2" />}

              <CollapsibleContent
                id={`section-${section.title.toLowerCase()}`}
                className={cn(
                  'overflow-hidden transition-all duration-200 ease-in-out',
                  'data-[state=open]:animate-in data-[state=closed]:animate-out',
                  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                  'data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2'
                )}
              >
                <div className="space-y-1 px-3 pt-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    const Icon = item.icon;

                    if (sidebarCollapsed) {
                      return (
                        <TooltipProvider key={item.href} delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={item.href}
                                data-nav-item
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                  isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="flex items-center gap-2">
                              {item.label}
                              {item.badge && (
                                <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        data-nav-item
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t p-4">
        <UserMenu collapsed={sidebarCollapsed} />
      </div>

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full transition-all duration-200"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

export default AdaptiveSidebar;
