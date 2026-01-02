# Responsive Utilities

Breakpoint detection, media queries, and conditional rendering for responsive design.

## Breakpoints

| Name | Range | CSS Class Prefix |
|------|-------|------------------|
| mobile | 0-639px | (default) |
| tablet | 640-1023px | sm:, md: |
| desktop | 1024px+ | lg:, xl: |

## Hooks

### useBreakpoint

Detect current breakpoint:

```tsx
import { useBreakpoint } from "@/features/responsive";

function ResponsiveComponent() {
  const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

  return (
    <div>
      <p>Current: {breakpoint}</p>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

Returns:
- `breakpoint` - 'mobile' | 'tablet' | 'desktop'
- `isMobile` - true when width < 640px
- `isTablet` - true when 640px <= width < 1024px
- `isDesktop` - true when width >= 1024px

### useMediaQuery

Generic CSS media query hook:

```tsx
import { useMediaQuery } from "@/features/responsive";

function DarkModeDetector() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isLargeScreen = useMediaQuery("(min-width: 1280px)");

  return (
    <div>
      {prefersDark && <DarkTheme />}
      {!prefersReducedMotion && <Animations />}
    </div>
  );
}
```

Common queries:
- `(min-width: 640px)` - Tablet and up
- `(min-width: 1024px)` - Desktop and up
- `(prefers-color-scheme: dark)` - Dark mode
- `(prefers-reduced-motion: reduce)` - Reduced motion
- `(hover: hover)` - Has hover capability
- `(orientation: landscape)` - Landscape orientation

### useWindowSize

Track window dimensions:

```tsx
import { useWindowSize } from "@/features/responsive";

function SizeDisplay() {
  const { width, height } = useWindowSize();

  return (
    <p>
      Window: {width} x {height}
    </p>
  );
}
```

Features:
- 100ms debounced resize listener
- SSR-safe (returns 0x0 on server)
- Updates on window resize

### useOrientation

Detect device orientation:

```tsx
import { useOrientation } from "@/features/responsive";

function OrientationAware() {
  const orientation = useOrientation();

  return (
    <div className={orientation === "landscape" ? "flex-row" : "flex-col"}>
      <Sidebar />
      <Content />
    </div>
  );
}
```

Returns: `'portrait'` | `'landscape'`

## Components

### Show

Conditionally render on specific breakpoints:

```tsx
import { Show } from "@/features/responsive";

function Navigation() {
  return (
    <>
      <Show on="mobile">
        <MobileNav />
      </Show>

      <Show on="tablet">
        <TabletNav />
      </Show>

      <Show on="desktop">
        <DesktopNav />
      </Show>

      {/* Multiple breakpoints */}
      <Show on={["tablet", "desktop"]}>
        <SidePanel />
      </Show>
    </>
  );
}
```

Props:
- `on` - Breakpoint or array of breakpoints
- `children` - Content to show

### Hide

Conditionally hide on specific breakpoints:

```tsx
import { Hide } from "@/features/responsive";

function Layout() {
  return (
    <div>
      {/* Hide sidebar on mobile */}
      <Hide on="mobile">
        <Sidebar />
      </Hide>

      {/* Hide complex chart on small screens */}
      <Hide on={["mobile", "tablet"]}>
        <DetailedChart />
      </Hide>

      <MainContent />
    </div>
  );
}
```

Props:
- `on` - Breakpoint or array of breakpoints
- `children` - Content to hide

### ResponsiveContainer

Container with responsive padding:

```tsx
import { ResponsiveContainer } from "@/features/responsive";

function Page() {
  return (
    <ResponsiveContainer padding="lg">
      <h1>Page Title</h1>
      <Content />
    </ResponsiveContainer>
  );
}
```

Props:
- `padding` - 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `className` - Additional CSS classes
- `children` - Container content

Padding values:
| Value | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| none | 0 | 0 | 0 |
| sm | 8px | 12px | 16px |
| md | 12px | 16px | 24px |
| lg | 16px | 24px | 32px |
| xl | 24px | 32px | 48px |

## Patterns

### Responsive Layout

```tsx
import { useBreakpoint, Show, Hide } from "@/features/responsive";

function AppLayout() {
  const { isMobile } = useBreakpoint();

  return (
    <div className="flex">
      {/* Desktop sidebar */}
      <Hide on="mobile">
        <aside className="w-64">
          <Sidebar />
        </aside>
      </Hide>

      <main className={isMobile ? "w-full" : "flex-1"}>
        {/* Mobile header with menu */}
        <Show on="mobile">
          <MobileHeader />
        </Show>

        <Content />
      </main>
    </div>
  );
}
```

### Responsive Grid

```tsx
import { useBreakpoint } from "@/features/responsive";

function CardGrid({ items }) {
  const { isMobile, isTablet } = useBreakpoint();

  const columns = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {items.map((item) => (
        <Card key={item.id} {...item} />
      ))}
    </div>
  );
}
```

### Responsive Data Display

```tsx
import { Show, Hide } from "@/features/responsive";

function DataTable({ data }) {
  return (
    <>
      {/* Full table on desktop */}
      <Show on="desktop">
        <table className="w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <TableRow key={row.id} {...row} />
            ))}
          </tbody>
        </table>
      </Show>

      {/* Card list on mobile/tablet */}
      <Hide on="desktop">
        <div className="space-y-4">
          {data.map((item) => (
            <DataCard key={item.id} {...item} />
          ))}
        </div>
      </Hide>
    </>
  );
}
```

## Testing

Test responsive behavior:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBreakpoint } from "@/features/responsive";

describe("useBreakpoint", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  it("should detect mobile breakpoint", () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("mobile");
    expect(result.current.isMobile).toBe(true);
  });

  it("should detect desktop breakpoint", () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());

    expect(result.current.breakpoint).toBe("desktop");
    expect(result.current.isDesktop).toBe(true);
  });
});
```

## Best Practices

1. **Use CSS-first approach** - Prefer Tailwind responsive classes over JS:
   ```tsx
   // Prefer this
   <div className="hidden md:block">Desktop content</div>

   // Over this (when possible)
   <Show on="desktop">Desktop content</Show>
   ```

2. **Use hooks for logic** - Use JS hooks when layout logic is complex:
   ```tsx
   const { isMobile } = useBreakpoint();
   const itemsPerPage = isMobile ? 10 : 25;
   ```

3. **Test all breakpoints** - Always test mobile, tablet, and desktop.

4. **SSR considerations** - All hooks return safe defaults on server:
   - `useBreakpoint()` returns mobile by default
   - `useWindowSize()` returns { width: 0, height: 0 }
   - `useMediaQuery()` returns false

5. **Debounce expensive operations** - Window resize events are debounced (100ms).
