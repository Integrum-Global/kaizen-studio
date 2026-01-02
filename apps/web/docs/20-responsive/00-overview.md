# Responsive Design System

The responsive design system provides components and hooks for building mobile-first responsive layouts.

## Feature Location

```
src/components/layout/
├── ResponsiveContainer.tsx  # Responsive wrapper with padding
├── ResponsiveGrid.tsx       # Grid with breakpoint columns
├── MobileNav.tsx            # Mobile navigation drawer
├── MobileMenu.tsx           # Hamburger menu button
└── index.ts                 # Barrel exports

src/hooks/
├── useMediaQuery.ts         # Generic media query hook
├── useBreakpoint.ts         # Breakpoint detection hook
└── index.ts                 # Barrel exports
```

## Breakpoints

| Name | Width | Tailwind Prefix |
|------|-------|-----------------|
| Mobile | < 640px | (default) |
| Tablet | 640px - 1024px | `sm:` |
| Desktop | >= 1024px | `lg:` |

## Hooks

### useMediaQuery

Generic hook for any CSS media query.

```tsx
import { useMediaQuery } from '@/hooks';

function MyComponent() {
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <div className={isLargeScreen ? 'grid-cols-3' : 'grid-cols-1'}>
      {/* Content */}
    </div>
  );
}
```

### useBreakpoint

Returns current breakpoint information.

```tsx
import { useBreakpoint } from '@/hooks';

function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
      <p>Current: {breakpoint}</p>
    </div>
  );
}
```

## Components

### ResponsiveContainer

Responsive wrapper that adjusts padding and max-width.

```tsx
import { ResponsiveContainer } from '@/components/layout';

// Basic usage
<ResponsiveContainer>
  <Content />
</ResponsiveContainer>

// With max-width
<ResponsiveContainer maxWidth="xl">
  <Content />
</ResponsiveContainer>

// No padding
<ResponsiveContainer padding={false}>
  <Content />
</ResponsiveContainer>
```

Props:
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' (default: 'full')
- `padding`: boolean (default: true)
- `className`: Additional classes

### ResponsiveGrid

Grid that adjusts columns at breakpoints.

```tsx
import { ResponsiveGrid } from '@/components/layout';

// Default: 1 → 2 → 3 columns
<ResponsiveGrid>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ResponsiveGrid>

// Custom columns
<ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</ResponsiveGrid>

// Custom gap
<ResponsiveGrid gap="lg">
  {/* Content */}
</ResponsiveGrid>
```

Props:
- `cols`: { mobile?: number; tablet?: number; desktop?: number }
- `gap`: 'sm' | 'md' | 'lg' (default: 'md')
- `className`: Additional classes

### MobileNav

Mobile navigation drawer using Sheet component.

```tsx
import { MobileNav } from '@/components/layout';

function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MobileMenu onClick={() => setOpen(true)} />
      <MobileNav open={open} onOpenChange={setOpen}>
        <NavLinks />
      </MobileNav>
    </>
  );
}
```

Props:
- `open`: boolean
- `onOpenChange`: (open: boolean) => void
- `side`: 'left' | 'right' (default: 'left')
- `children`: Navigation content

### MobileMenu

Hamburger menu button for mobile.

```tsx
import { MobileMenu } from '@/components/layout';

<MobileMenu
  onClick={() => setNavOpen(true)}
  label="Open menu"
/>
```

Props:
- `onClick`: () => void
- `label`: string (default: 'Open navigation menu')
- `className`: Additional classes

## Responsive Patterns

### Mobile-First Approach

Always start with mobile styles, then add larger breakpoints:

```css
/* Mobile first */
.container {
  padding: 1rem;       /* Mobile */
}

@media (min-width: 640px) {
  .container {
    padding: 1.5rem;   /* Tablet */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 2rem;     /* Desktop */
  }
}
```

### Tailwind Responsive Classes

```tsx
// Padding that increases at breakpoints
<div className="p-4 sm:p-6 lg:p-8">

// Grid columns that change
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

// Show/hide based on breakpoint
<div className="hidden sm:block">Desktop only</div>
<div className="sm:hidden">Mobile only</div>
```

### Sidebar Pattern

```tsx
function Layout({ children }) {
  const { isMobile } = useBreakpoint();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed w-64">
        <NavLinks />
      </aside>

      {/* Mobile nav */}
      {isMobile && (
        <MobileNav open={navOpen} onOpenChange={setNavOpen}>
          <NavLinks />
        </MobileNav>
      )}

      {/* Main content */}
      <main className="lg:ml-64">
        <ResponsiveContainer>
          {children}
        </ResponsiveContainer>
      </main>
    </div>
  );
}
```

## Standard Spacing Scale

| Breakpoint | Padding | Tailwind |
|------------|---------|----------|
| Mobile | 16px | p-4 |
| Tablet | 24px | sm:p-6 |
| Desktop | 32px | lg:p-8 |
