# EATP Frontend: Navigation Implementation

## Document Control
- **Version**: 1.0
- **Date**: 2026-01-03
- **Status**: Planning
- **Author**: Kaizen Studio Team

---

## Overview

This document defines the implementation of the level-adaptive navigation system for Kaizen Studio. The sidebar and routing adapt based on the user's trust level, showing only relevant sections.

See ontology reference: `docs/plans/eatp-ontology/06-navigation-architecture.md`

---

## Navigation Structure

### Sidebar Sections

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   WORK                           ← User-centric section              │
│   ├── My Tasks                   ← Level 1+: Run tasks               │
│   ├── My Processes               ← Level 2+: Manage processes        │
│   └── Value Chains               ← Level 3: Enterprise view          │
│                                                                      │
│   BUILD                          ← Creator-centric section           │
│   ├── Work Units                 ← Unified agents + pipelines        │
│   ├── Workspaces                 ← Purpose-driven collections        │
│   └── Connectors                 ← ESAs and integrations             │
│                                                                      │
│   GOVERN                         ← Trust and compliance              │
│   ├── Trust                      ← Delegation management             │
│   ├── Compliance                 ← Audit and constraints             │
│   └── Activity                   ← Execution history                 │
│                                                                      │
│   ──────────────────────────────                                     │
│                                                                      │
│   ADMIN                          ← System administration             │
│   ├── Users                      ← User management                   │
│   ├── Settings                   ← System settings                   │
│   └── Logs                       ← System logs                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Level-Based Visibility

| Section | Item | Level 1 | Level 2 | Level 3 |
|---------|------|---------|---------|---------|
| WORK | My Tasks | ✓ | ✓ | ✓ |
| WORK | My Processes | - | ✓ | ✓ |
| WORK | Value Chains | - | - | ✓ |
| BUILD | Work Units | - | ✓ | ✓ |
| BUILD | Workspaces | - | ✓ | ✓ |
| BUILD | Connectors | - | ✓ | ✓ |
| GOVERN | Trust | - | ✓* | ✓ |
| GOVERN | Compliance | - | - | ✓ |
| GOVERN | Activity | - | ✓ | ✓ |
| ADMIN | All | - | - | ✓ |

*Level 2 sees "My Delegations" subset only

---

## Route Structure

### URL Patterns

```typescript
const routes = {
  // WORK section
  '/work/tasks': 'MyTasksPage',
  '/work/tasks/:id': 'TaskDetailPage',
  '/work/tasks/:id/run': 'TaskRunPage',
  '/work/processes': 'MyProcessesPage',
  '/work/processes/:id': 'ProcessDetailPage',
  '/work/value-chains': 'ValueChainsPage',
  '/work/value-chains/:id': 'ValueChainDetailPage',

  // BUILD section
  '/build/work-units': 'WorkUnitsPage',
  '/build/work-units/new': 'WorkUnitCreatePage',
  '/build/work-units/:id': 'WorkUnitDetailPage',
  '/build/work-units/:id/edit': 'WorkUnitEditPage',
  '/build/workspaces': 'WorkspacesPage',
  '/build/workspaces/new': 'WorkspaceCreatePage',
  '/build/workspaces/:id': 'WorkspaceDetailPage',
  '/build/connectors': 'ConnectorsPage',
  '/build/connectors/:id': 'ConnectorDetailPage',

  // GOVERN section
  '/govern/trust': 'TrustPage',
  '/govern/trust/delegations': 'DelegationsPage',
  '/govern/trust/chains': 'TrustChainsPage',
  '/govern/compliance': 'CompliancePage',
  '/govern/compliance/constraints': 'ConstraintsPage',
  '/govern/activity': 'ActivityPage',

  // ADMIN section
  '/admin/users': 'UsersPage',
  '/admin/settings': 'SettingsPage',
  '/admin/logs': 'LogsPage',
};
```

### Route Guards

```typescript
const routeGuards: Record<string, { minLevel: 1 | 2 | 3 }> = {
  '/work/tasks': { minLevel: 1 },
  '/work/processes': { minLevel: 2 },
  '/work/value-chains': { minLevel: 3 },
  '/build/*': { minLevel: 2 },
  '/govern/trust': { minLevel: 2 },
  '/govern/compliance': { minLevel: 3 },
  '/govern/activity': { minLevel: 2 },
  '/admin/*': { minLevel: 3 },
};
```

---

## Component Implementation

### Sidebar Component

```tsx
interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  href: string;
  minLevel: 1 | 2 | 3;
  badge?: number;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  minLevel: 1 | 2 | 3;
}

const navigationConfig: NavSection[] = [
  {
    id: 'work',
    label: 'WORK',
    minLevel: 1,
    items: [
      {
        id: 'tasks',
        label: 'My Tasks',
        icon: CheckSquare,
        href: '/work/tasks',
        minLevel: 1,
      },
      {
        id: 'processes',
        label: 'My Processes',
        icon: GitBranch,
        href: '/work/processes',
        minLevel: 2,
      },
      {
        id: 'value-chains',
        label: 'Value Chains',
        icon: Network,
        href: '/work/value-chains',
        minLevel: 3,
      },
    ],
  },
  {
    id: 'build',
    label: 'BUILD',
    minLevel: 2,
    items: [
      {
        id: 'work-units',
        label: 'Work Units',
        icon: Boxes,
        href: '/build/work-units',
        minLevel: 2,
      },
      {
        id: 'workspaces',
        label: 'Workspaces',
        icon: FolderKanban,
        href: '/build/workspaces',
        minLevel: 2,
      },
      {
        id: 'connectors',
        label: 'Connectors',
        icon: Plug,
        href: '/build/connectors',
        minLevel: 2,
      },
    ],
  },
  {
    id: 'govern',
    label: 'GOVERN',
    minLevel: 2,
    items: [
      {
        id: 'trust',
        label: 'Trust',
        icon: Shield,
        href: '/govern/trust',
        minLevel: 2,
      },
      {
        id: 'compliance',
        label: 'Compliance',
        icon: Scale,
        href: '/govern/compliance',
        minLevel: 3,
      },
      {
        id: 'activity',
        label: 'Activity',
        icon: Activity,
        href: '/govern/activity',
        minLevel: 2,
      },
    ],
  },
  {
    id: 'admin',
    label: 'ADMIN',
    minLevel: 3,
    items: [
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        href: '/admin/users',
        minLevel: 3,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/admin/settings',
        minLevel: 3,
      },
      {
        id: 'logs',
        label: 'Logs',
        icon: FileText,
        href: '/admin/logs',
        minLevel: 3,
      },
    ],
  },
];
```

### Sidebar Implementation

```tsx
function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { level } = useUser();
  const pathname = usePathname();

  // Filter navigation based on user level
  const visibleSections = useMemo(() => {
    return navigationConfig
      .filter(section => section.minLevel <= level)
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.minLevel <= level),
      }))
      .filter(section => section.items.length > 0);
  }, [level]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <Logo collapsed={collapsed} />
        <button
          onClick={onToggle}
          className="ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {visibleSections.map(section => (
          <div key={section.id} className="mb-6">
            {/* Section header */}
            {!collapsed && (
              <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground">
                {section.label}
              </h3>
            )}

            {/* Section items */}
            <ul className="space-y-1 px-2">
              {section.items.map(item => (
                <li key={item.id}>
                  <NavLink
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={pathname.startsWith(item.href)}
                    collapsed={collapsed}
                    badge={item.badge}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <UserMenu collapsed={collapsed} />
    </aside>
  );
}
```

### NavLink Component

```tsx
interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: number;
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  badge,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />

      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}

      {collapsed && badge && badge > 0 && (
        <span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-primary" />
      )}
    </Link>
  );
}
```

---

## Route Protection

### Protected Route Component

```tsx
interface ProtectedRouteProps {
  minLevel: 1 | 2 | 3;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ProtectedRoute({
  minLevel,
  children,
  fallback,
}: ProtectedRouteProps) {
  const { level, isLoading } = useUser();
  const router = useRouter();

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check access
  if (level < minLevel) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Redirect to appropriate default page
    const defaultRoutes = {
      1: '/work/tasks',
      2: '/work/processes',
      3: '/work/value-chains',
    };

    router.replace(defaultRoutes[level]);
    return null;
  }

  return <>{children}</>;
}
```

### App Router Layout

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 pl-64">
                {children}
              </main>
            </div>
          </UserProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

// app/work/processes/page.tsx
export default function ProcessesPage() {
  return (
    <ProtectedRoute minLevel={2}>
      <MyProcessesPage />
    </ProtectedRoute>
  );
}

// app/govern/compliance/page.tsx
export default function CompliancePage() {
  return (
    <ProtectedRoute minLevel={3}>
      <ComplianceDashboard />
    </ProtectedRoute>
  );
}
```

---

## Mobile Navigation

### Bottom Navigation (Mobile)

For Level 1 users on mobile, use a simpler bottom navigation:

```tsx
function MobileBottomNav() {
  const { level } = useUser();
  const pathname = usePathname();

  const mobileItems = useMemo(() => {
    const items = [
      { id: 'tasks', icon: CheckSquare, href: '/work/tasks', label: 'Tasks' },
    ];

    if (level >= 2) {
      items.push(
        { id: 'processes', icon: GitBranch, href: '/work/processes', label: 'Processes' },
        { id: 'work-units', icon: Boxes, href: '/build/work-units', label: 'Build' },
      );
    }

    if (level >= 3) {
      items.push(
        { id: 'govern', icon: Shield, href: '/govern/trust', label: 'Govern' },
      );
    }

    // Always show profile/more
    items.push(
      { id: 'more', icon: Menu, href: '/more', label: 'More' },
    );

    return items;
  }, [level]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex justify-around">
        {mobileItems.map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs',
              pathname.startsWith(item.href)
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

### Mobile "More" Menu

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   More                                                       [×]   │
│                                                                     │
│   ─────────────────────────────────────────────────────────────    │
│                                                                     │
│   WORK                                                              │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 📋 My Tasks                                             →   │  │
│   │ 🔄 My Processes                                         →   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   BUILD                                      (Level 2+ only)        │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 📦 Work Units                                           →   │  │
│   │ 📁 Workspaces                                           →   │  │
│   │ 🔌 Connectors                                           →   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   GOVERN                                     (Level 2+ only)        │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ 🛡️ Trust                                                 →   │  │
│   │ 📊 Activity                                             →   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ─────────────────────────────────────────────────────────────    │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ⚙️ Settings                                             →   │  │
│   │ 🚪 Sign Out                                                 │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Breadcrumb Navigation

### Breadcrumb Component

```tsx
interface BreadcrumbItem {
  label: string;
  href?: string;
}

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Usage
<Breadcrumbs items={[
  { label: 'BUILD', href: '/build' },
  { label: 'Work Units', href: '/build/work-units' },
  { label: 'Invoice Processor' },
]} />
```

### Auto-Generated Breadcrumbs

```tsx
function useAutoBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    let path = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      path += `/${segment}`;

      // Map segments to labels
      const label = segmentLabels[segment] || formatSegmentLabel(segment);

      items.push({
        label,
        href: i < segments.length - 1 ? path : undefined,
      });
    }

    return items;
  }, [pathname]);
}

const segmentLabels: Record<string, string> = {
  work: 'WORK',
  build: 'BUILD',
  govern: 'GOVERN',
  admin: 'ADMIN',
  tasks: 'My Tasks',
  processes: 'My Processes',
  'value-chains': 'Value Chains',
  'work-units': 'Work Units',
  workspaces: 'Workspaces',
  connectors: 'Connectors',
  trust: 'Trust',
  compliance: 'Compliance',
  activity: 'Activity',
};
```

---

## Keyboard Navigation

### Global Keyboard Shortcuts

```tsx
function useGlobalShortcuts() {
  const router = useRouter();
  const { level } = useUser();

  useHotkeys('g t', () => router.push('/work/tasks'), { description: 'Go to Tasks' });
  useHotkeys('g p', () => level >= 2 && router.push('/work/processes'), { description: 'Go to Processes' });
  useHotkeys('g w', () => level >= 2 && router.push('/build/work-units'), { description: 'Go to Work Units' });
  useHotkeys('g s', () => level >= 2 && router.push('/build/workspaces'), { description: 'Go to Workspaces' });
  useHotkeys('/', () => focusSearch(), { description: 'Focus search' });
  useHotkeys('?', () => openShortcutsModal(), { description: 'Show shortcuts' });
}
```

### Shortcuts Reference Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Keyboard Shortcuts                                         [×]   │
│                                                                     │
│   ─────────────────────────────────────────────────────────────    │
│                                                                     │
│   Navigation                                                        │
│                                                                     │
│   g then t        Go to My Tasks                                   │
│   g then p        Go to My Processes                               │
│   g then w        Go to Work Units                                 │
│   g then s        Go to Workspaces                                 │
│                                                                     │
│   Actions                                                           │
│                                                                     │
│   /               Focus search                                      │
│   n               Create new (context-aware)                        │
│   Enter           Open selected item                                │
│   Escape          Close modal/panel                                 │
│                                                                     │
│   Work Units                                                        │
│                                                                     │
│   r               Run selected work unit                            │
│   d               Delegate selected work unit                       │
│   c               Configure selected work unit                      │
│                                                                     │
│   ─────────────────────────────────────────────────────────────    │
│                                                                     │
│   Press ? anytime to see this help                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Search Integration

### Global Search

```tsx
function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { level } = useUser();

  // Search across all accessible content
  const { data: results } = useQuery({
    queryKey: ['globalSearch', query, level],
    queryFn: () => searchApi.search(query, { level }),
    enabled: query.length >= 2,
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto rounded border bg-background px-1.5 text-xs">/</kbd>
      </button>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search work units, tasks, workspaces..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {results?.workUnits?.length > 0 && (
            <CommandGroup heading="Work Units">
              {results.workUnits.map(wu => (
                <CommandItem key={wu.id} onSelect={() => navigate(`/build/work-units/${wu.id}`)}>
                  <Boxes className="mr-2 h-4 w-4" />
                  {wu.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.tasks?.length > 0 && (
            <CommandGroup heading="Tasks">
              {results.tasks.map(task => (
                <CommandItem key={task.id} onSelect={() => navigate(`/work/tasks/${task.id}`)}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {task.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.workspaces?.length > 0 && (
            <CommandGroup heading="Workspaces">
              {results.workspaces.map(ws => (
                <CommandItem key={ws.id} onSelect={() => navigate(`/build/workspaces/${ws.id}`)}>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  {ws.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

---

## Responsive Breakpoints

| Breakpoint | Sidebar | Bottom Nav | Breadcrumbs |
|------------|---------|------------|-------------|
| Mobile (<768px) | Hidden | Visible | Simplified |
| Tablet (768-1024px) | Collapsed | Hidden | Full |
| Desktop (>1024px) | Expanded | Hidden | Full |

---

## References

- **Ontology**: `docs/plans/eatp-ontology/06-navigation-architecture.md`
- **Level-Based Experience**: `docs/plans/eatp-frontend/05-level-based-experience.md`
- **Component Architecture**: `docs/plans/eatp-frontend/01-component-architecture.md`
