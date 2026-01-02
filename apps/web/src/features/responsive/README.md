# Responsive Feature Module

A comprehensive responsive design system for Kaizen Studio frontend providing breakpoint detection, media queries, window size tracking, and device orientation detection.

## Features

- **Breakpoint Detection**: Detect and respond to mobile/tablet/desktop breakpoints
- **Media Queries**: Generic hook for any CSS media query
- **Window Size Tracking**: Debounced window dimensions tracking
- **Device Orientation**: Portrait/landscape detection
- **Responsive Components**: Container, Show/Hide components for conditional rendering
- **SSR-Safe**: All hooks work in server-side rendering environments
- **Performance Optimized**: Uses matchMedia API and debounced listeners

## Installation

The responsive module is part of the core frontend application and doesn't require separate installation.

## Quick Start

```tsx
import {
  useBreakpoint,
  useMediaQuery,
  useWindowSize,
  useOrientation,
  ResponsiveContainer,
  Show,
  Hide,
} from "@/features/responsive";

function MyComponent() {
  const { breakpoint, isMobile, isDesktop } = useBreakpoint();
  const { width, height } = useWindowSize();
  const { orientation } = useOrientation();

  return (
    <ResponsiveContainer padding="md">
      <Show on="mobile">
        <MobileNav />
      </Show>
      <Hide on="mobile">
        <DesktopNav />
      </Hide>

      <p>Current breakpoint: {breakpoint}</p>
      <p>
        Window size: {width} x {height}
      </p>
      <p>Orientation: {orientation}</p>
    </ResponsiveContainer>
  );
}
```

## Breakpoints

The responsive system uses Tailwind CSS breakpoints:

- **Mobile**: 0-639px (< sm breakpoint)
- **Tablet**: 640-1023px (sm to < xl breakpoint)
- **Desktop**: 1024px+ (xl breakpoint and above)

## Hooks

### useBreakpoint

Detects the current breakpoint based on window width.

```tsx
const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

// Returns:
// - breakpoint: 'mobile' | 'tablet' | 'desktop'
// - isMobile: boolean
// - isTablet: boolean
// - isDesktop: boolean
```

**Example**:

```tsx
function Navigation() {
  const { isMobile, isDesktop } = useBreakpoint();

  return (
    <nav>
      {isMobile && <MobileMenu />}
      {isDesktop && <DesktopMenu />}
    </nav>
  );
}
```

### useMediaQuery

Generic hook for any CSS media query.

```tsx
const matches = useMediaQuery("(min-width: 768px)");
```

**Examples**:

```tsx
// Width queries
const isWide = useMediaQuery("(min-width: 1200px)");
const isNarrow = useMediaQuery("(max-width: 480px)");

// Orientation
const isLandscape = useMediaQuery("(orientation: landscape)");

// Color scheme
const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

// Hover capability
const hasHover = useMediaQuery("(hover: hover)");

// Complex queries
const isTabletRange = useMediaQuery(
  "(min-width: 640px) and (max-width: 1023px)"
);
```

### useWindowSize

Returns current window dimensions with debounced resize handling (100ms).

```tsx
const { width, height } = useWindowSize();
```

**Example**:

```tsx
function ResizeInfo() {
  const { width, height } = useWindowSize();

  return (
    <div>
      Window size: {width} x {height}
    </div>
  );
}
```

### useOrientation

Detects device/window orientation.

```tsx
const { orientation, isPortrait, isLandscape } = useOrientation();

// Returns:
// - orientation: 'portrait' | 'landscape'
// - isPortrait: boolean
// - isLandscape: boolean
```

**Example**:

```tsx
function OrientationWarning() {
  const { isPortrait } = useOrientation();

  if (isPortrait) {
    return <div>This feature works best in landscape mode</div>;
  }

  return null;
}
```

## Components

### ResponsiveContainer

A container with responsive padding that adapts across breakpoints.

```tsx
<ResponsiveContainer padding="md">
  <YourContent />
</ResponsiveContainer>
```

**Props**:

- `padding`: `'none' | 'sm' | 'md' | 'lg' | 'xl'` (default: `'md'`)
- `className`: Additional CSS classes
- `children`: React children

**Padding values**:

- `none`: No padding
- `sm`: p-2 sm:p-3 lg:p-4
- `md`: p-4 sm:p-6 lg:p-8
- `lg`: p-6 sm:p-8 lg:p-12
- `xl`: p-8 sm:p-12 lg:p-16

**Example**:

```tsx
<ResponsiveContainer padding="lg" className="bg-gray-50">
  <h1>My Content</h1>
  <p>This has responsive padding</p>
</ResponsiveContainer>
```

### Show

Conditionally renders children only at specified breakpoints.

```tsx
<Show on="mobile">
  <MobileComponent />
</Show>

<Show on={["tablet", "desktop"]}>
  <DesktopComponent />
</Show>
```

**Props**:

- `on`: `Breakpoint | Breakpoint[]` - Breakpoint(s) to show on
- `children`: React children

**Examples**:

```tsx
// Show only on mobile
<Show on="mobile">
  <MobileNav />
</Show>

// Show on tablet and desktop
<Show on={["tablet", "desktop"]}>
  <FullMenu />
</Show>

// Show on all breakpoints (no point, but valid)
<Show on={["mobile", "tablet", "desktop"]}>
  <AlwaysVisible />
</Show>
```

### Hide

Conditionally hides children at specified breakpoints.

```tsx
<Hide on="mobile">
  <ComplexVisualization />
</Hide>

<Hide on={["mobile", "tablet"]}>
  <DesktopOnlyFeature />
</Hide>
```

**Props**:

- `on`: `Breakpoint | Breakpoint[]` - Breakpoint(s) to hide on
- `children`: React children

**Examples**:

```tsx
// Hide only on mobile
<Hide on="mobile">
  <ComplexChart />
</Hide>

// Hide on mobile and tablet
<Hide on={["mobile", "tablet"]}>
  <AdvancedFeature />
</Hide>
```

## Common Patterns

### Responsive Navigation

```tsx
function Navigation() {
  const { isMobile } = useBreakpoint();

  return (
    <nav>
      <Logo />
      <Show on="mobile">
        <HamburgerMenu />
      </Show>
      <Hide on="mobile">
        <FullNavigationMenu />
      </Hide>
    </nav>
  );
}
```

### Responsive Grid

```tsx
function ProductGrid() {
  const { breakpoint } = useBreakpoint();

  const columns = {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  }[breakpoint];

  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Responsive Container with Content

```tsx
function DashboardPage() {
  const { isMobile } = useBreakpoint();

  return (
    <ResponsiveContainer padding={isMobile ? "sm" : "lg"}>
      <h1 className={isMobile ? "text-2xl" : "text-4xl"}>Dashboard</h1>

      <Show on="desktop">
        <Sidebar />
      </Show>

      <MainContent />
    </ResponsiveContainer>
  );
}
```

### Window Size Based Rendering

```tsx
function Chart() {
  const { width, height } = useWindowSize();

  return <ChartComponent width={width - 100} height={height * 0.6} />;
}
```

### Orientation-Specific UI

```tsx
function VideoPlayer() {
  const { isLandscape } = useOrientation();

  return (
    <div className={isLandscape ? "h-full" : "h-64"}>
      <video controls />
    </div>
  );
}
```

## Performance Considerations

1. **matchMedia API**: All breakpoint detection uses the native `matchMedia` API which is more efficient than resize listeners
2. **Debounced Resize**: `useWindowSize` debounces resize events (100ms) to prevent excessive re-renders
3. **Conditional Rendering**: Use `Show`/`Hide` components for cleaner conditional rendering instead of ternaries
4. **SSR Safety**: All hooks return default values on server and sync on client mount

## Testing

The module includes comprehensive test coverage:

- **70 tests total**
- Breakpoint detection and transitions
- Media query matching and changes
- Window resize handling and debouncing
- Orientation changes
- Component conditional rendering
- SSR safety

Run tests:

```bash
npm test -- src/features/responsive/__tests__/
```

## Browser Support

All modern browsers support the APIs used:

- `window.matchMedia` (IE 10+)
- `MediaQueryList.addEventListener` (Chrome 45+, Firefox 55+, Safari 14+)
- `window.innerWidth/innerHeight` (All browsers)

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Breakpoint,
  Orientation,
  BreakpointConfig,
  ResponsiveState,
  WindowSize,
  UseBreakpointResult,
  UseOrientationResult,
  ResponsivePadding,
  ResponsiveContainerProps,
  ShowProps,
  HideProps,
} from "@/features/responsive";
```

## Related Documentation

- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/breakpoints)
- [MDN: Using Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries)
- [React Hook Best Practices](https://react.dev/reference/react)

## Contributing

When adding new responsive features:

1. Add types to `types/index.ts`
2. Create hook in `hooks/`
3. Add comprehensive tests in `__tests__/`
4. Update this README with examples
5. Export from `index.ts`

## License

Part of Kaizen Studio frontend application.
