# Layout Components

This directory contains the application shell layout components for Kaizen Studio.

## Components

### AppShell

The main application layout wrapper that provides the overall structure.

**Features:**

- Responsive sidebar (desktop) and sheet (mobile)
- Main content area with header
- Outlet for nested routes

**Usage:**

```tsx
import { AppShell } from "@/components/layout";

// In your router
<Route element={<AppShell />}>
  <Route path="/dashboard" element={<Dashboard />} />
  {/* ... other routes */}
</Route>;
```

### Sidebar

Desktop navigation sidebar with collapsible state.

**Features:**

- Logo at top
- Navigation sections (BUILD, DEPLOY, GOVERN, OBSERVE, ADMIN)
- Active route highlighting
- Icons-only mode when collapsed
- User menu at bottom
- Collapse toggle button

**Props:** None (uses `useUIStore` for state)

### MobileSidebar

Mobile navigation drawer using Sheet component.

**Features:**

- Same navigation as Sidebar
- Closes automatically on navigation
- Controlled open/close state

**Props:**

```tsx
interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Header

Top header bar with navigation and actions.

**Features:**

- Mobile menu button
- Breadcrumb navigation (desktop)
- Search bar (desktop)
- Notifications dropdown
- User menu (mobile)

**Props:**

```tsx
interface HeaderProps {
  onMenuClick?: () => void; // Called when mobile menu button is clicked
}
```

### Breadcrumb

Automatic breadcrumb generation from current route.

**Features:**

- Auto-generates from URL pathname
- Clickable ancestor links
- Current page not clickable
- Responsive (hidden on mobile in Header)

**Props:** None (uses `useLocation`)

### UserMenu

User dropdown menu with theme toggle and actions.

**Features:**

- User avatar with initials
- Email display
- Theme toggle (light/dark/system)
- Settings link
- Logout button
- Collapsed mode (icon only)

**Props:**

```tsx
interface UserMenuProps {
  collapsed?: boolean; // Show compact version
}
```

## Navigation Structure

The navigation is organized into sections:

### BUILD

- **Agents** (`/agents`) - AI agent management
- **Pipelines** (`/pipelines`) - Workflow pipelines
- **Connectors** (`/connectors`) - Data connectors

### DEPLOY

- **Deployments** (`/deployments`) - Deployment management
- **Gateways** (`/gateways`) - API gateways

### GOVERN

- **Teams** (`/teams`) - Team management
- **Roles** (`/roles`) - Role management
- **Policies** (`/policies`) - Policy configuration
- **Audit Logs** (`/audit`) - Audit trail

### OBSERVE

- **Metrics** (`/metrics`) - Performance metrics
- **Logs** (`/logs`) - Application logs

### ADMIN

- **Settings** (`/settings`) - Application settings
- **API Keys** (`/api-keys`) - API key management
- **Webhooks** (`/webhooks`) - Webhook configuration

## State Management

The layout components use Zustand stores:

### UI Store (`useUIStore`)

```tsx
interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  notifications: Notification[];

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}
```

### Auth Store (`useAuthStore`)

```tsx
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  permissions: string[];
  isAuthenticated: boolean;

  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}
```

## Responsive Behavior

### Desktop (≥768px)

- Sidebar visible
- Full breadcrumb in header
- Search bar visible
- User menu in sidebar

### Tablet (≥640px, <768px)

- Mobile sidebar (sheet)
- Simplified header
- Search visible
- User menu in header

### Mobile (<640px)

- Mobile sidebar (sheet)
- Hamburger menu button
- No search
- User menu in header
- Simplified breadcrumb

## Theme Support

All components support dark mode through Tailwind's dark mode class strategy:

```tsx
// Set theme
const { setTheme } = useUIStore();
setTheme("dark"); // 'light' | 'dark' | 'system'
```

The theme is:

- Persisted in localStorage
- Applied to document root
- Synced across tabs
- Respects system preference (system mode)

## Icons

Icons are from `lucide-react`:

- Home, Users, Workflow, Box, Server, Shield, BarChart
- Settings, Key, Webhook, FileText, GitBranch
- Bell, Menu, ChevronLeft, ChevronRight
- Sun, Moon, Monitor, LogOut, Search

## Example: Adding a New Route

1. Update `navSections` in `Sidebar.tsx` and `MobileSidebar.tsx`:

```tsx
{
  title: 'BUILD',
  items: [
    // ... existing items
    { label: 'My Feature', href: '/my-feature', icon: MyIcon },
  ],
}
```

2. Add route in `App.tsx`:

```tsx
<Route path="/my-feature" element={<MyFeature />} />
```

3. The route will automatically:
   - Appear in both sidebars
   - Get active highlighting
   - Generate breadcrumbs
   - Close mobile menu on navigation

## Styling

Components use:

- **Tailwind CSS** - Utility classes
- **shadcn/ui** - Base components (Button, Sheet, DropdownMenu, etc.)
- **CSS Variables** - Theme colors defined in `index.css`
- **cn()** - Class name merging utility

Color scheme:

- `bg-background` - Main background
- `bg-accent` - Hover states
- `bg-primary` - Active/primary actions
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
