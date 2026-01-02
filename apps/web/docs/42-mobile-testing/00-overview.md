# Mobile Testing Guide

Responsive testing checklist for Kaizen Studio frontend.

## Breakpoints

| Breakpoint | Width | Device Class |
|------------|-------|--------------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

## Test Devices

### Mobile (375px)
- iPhone SE (375 x 667)
- iPhone 12/13/14 (390 x 844)
- Pixel 5 (393 x 851)

### Tablet (768px)
- iPad (768 x 1024)
- iPad Air (820 x 1180)

### Desktop (1280px+)
- MacBook Air (1440 x 900)
- Full HD (1920 x 1080)

## Component Behavior

### Sidebar
- **Desktop**: Fixed sidebar visible
- **Tablet**: Collapsible sidebar
- **Mobile**: Sheet overlay (MobileSidebar)

### Header
- **Desktop**: Full navigation + UserMenu
- **Mobile**: Hamburger menu + compact UserMenu

### Data Tables
- **Desktop**: Full table with columns
- **Mobile**: Card layout or horizontal scroll

### Forms
- **Desktop**: Multi-column layout
- **Mobile**: Single column stack

### Pipeline Canvas
- **Desktop**: Full canvas with zoom/pan
- **Tablet**: Canvas with touch gestures
- **Mobile**: Simplified view or warning

## E2E Test Coverage

All 18 E2E specs include responsive tests:

```typescript
test.describe('Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display on mobile', async ({ page }) => {
    await page.goto('/route');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Desktop View', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('should display full layout', async ({ page }) => {
    await page.goto('/route');
    await expect(page.locator('aside')).toBeVisible();
  });
});
```

## Manual Testing Checklist

### Navigation
- [ ] Hamburger menu opens on mobile
- [ ] Sidebar collapses at md breakpoint
- [ ] Navigation links work at all sizes
- [ ] Breadcrumbs truncate gracefully

### Forms
- [ ] Inputs full width on mobile
- [ ] Labels above inputs on mobile
- [ ] Error messages visible
- [ ] Submit buttons reachable

### Tables/Lists
- [ ] Tables scroll horizontally or convert to cards
- [ ] List items stack on mobile
- [ ] Actions accessible via menu

### Dialogs
- [ ] Dialogs center at all sizes
- [ ] Content scrolls if needed
- [ ] Close button reachable
- [ ] Form inputs accessible

### Dashboard
- [ ] Widgets stack on mobile
- [ ] Charts resize correctly
- [ ] Stats cards readable

### Pipeline Canvas
- [ ] Canvas fills available space
- [ ] Node palette accessible
- [ ] Config panel slides in
- [ ] Touch pan/zoom works (tablet)

## Playwright Configuration

`playwright.config.ts`:
```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
]
```

## Running Tests

```bash
# All browsers including mobile
npx playwright test

# Mobile only
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"

# Specific viewport
npx playwright test --headed --viewport-size=375,667
```

## Responsive Utilities

### useBreakpoint Hook
```typescript
import { useBreakpoint } from '@/features/responsive';

function Component() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  if (isMobile) return <MobileView />;
  if (isTablet) return <TabletView />;
  return <DesktopView />;
}
```

### Show/Hide Components
```typescript
import { Show, Hide } from '@/features/responsive';

<Show above="md">
  <Sidebar />
</Show>

<Hide above="md">
  <MobileSidebar />
</Hide>
```

### ResponsiveContainer
```typescript
import { ResponsiveContainer } from '@/features/responsive';

<ResponsiveContainer
  mobile={<MobileLayout />}
  tablet={<TabletLayout />}
  desktop={<DesktopLayout />}
/>
```
