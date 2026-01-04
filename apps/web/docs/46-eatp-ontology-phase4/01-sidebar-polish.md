# Sidebar Navigation Polish

The AdaptiveSidebar component has been enhanced with collapsible sections, animations, keyboard navigation, and localStorage persistence.

## What It Is

The sidebar now provides:
- **Collapsible Sections**: Click section headers to expand/collapse
- **Smooth Animations**: CSS transitions for expand/collapse
- **State Persistence**: Section states saved to localStorage
- **Keyboard Navigation**: Full keyboard accessibility
- **Visual Feedback**: Item counts, chevron rotation

## Component Usage

```tsx
import { AdaptiveSidebar } from '@/components/layout/AdaptiveSidebar';

// In your layout
function AppLayout() {
  return (
    <div className="flex h-screen">
      <AdaptiveSidebar />
      <main className="flex-1">{/* content */}</main>
    </div>
  );
}
```

## Features

### Collapsible Sections
Each navigation section (WORK, BUILD, GOVERN, etc.) can be collapsed by clicking the section header.

```tsx
// Section header with collapse button
<button
  aria-expanded={isOpen}
  aria-controls="section-work"
>
  <span>WORK (3)</span>
  <ChevronDown className={isOpen ? 'rotate-0' : '-rotate-90'} />
</button>
```

### LocalStorage Persistence
Section collapse states are automatically persisted:

```typescript
const STORAGE_KEY = 'kaizen-sidebar-sections';

// State is restored on mount
const stored = localStorage.getItem(STORAGE_KEY);
const collapsedSections = stored ? JSON.parse(stored) : [];

// State is saved on change
localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsedSections]));
```

### Keyboard Navigation
The sidebar supports keyboard navigation:

| Key | Action |
|-----|--------|
| `Arrow Down` | Focus next nav item |
| `Arrow Up` | Focus previous nav item |
| `Home` | Focus first nav item |
| `End` | Focus last nav item |
| `Enter/Space` | Activate focused item |
| `Tab` | Move to next focusable element |

### Accessibility
- All section headers have `aria-expanded` and `aria-controls`
- Navigation uses `role="navigation"` with `aria-label`
- Active links have `aria-current="page"`
- Focus indicators are visible
- Focus rings use consistent styling

## Animation Specifications

| Animation | Duration | Easing |
|-----------|----------|--------|
| Section expand/collapse | 200ms | ease-in-out |
| Chevron rotation | 200ms | ease |
| Nav item hover | 200ms | transition-all |
| Sidebar width change | 300ms | transition-all |

## Props

The AdaptiveSidebar component doesn't take any props. It uses:
- `useUIStore` for collapsed sidebar state
- `useUserLevel` for level-based section visibility
- Internal state for section collapse

## CSS Classes

Key Tailwind classes used:

```css
/* Section header */
.text-xs.font-semibold.uppercase.tracking-wider
.transition-colors.duration-200

/* Collapsible content */
.transition-all.duration-200.ease-in-out
.data-[state=open]:animate-in
.data-[state=closed]:animate-out

/* Nav items */
.transition-all.duration-200
.focus-visible:ring-2.focus-visible:ring-ring
```

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test section collapse
it('should collapse section on click', async () => {
  const user = userEvent.setup();
  render(<AdaptiveSidebar />);

  const header = screen.getByRole('button', { name: /WORK/ });
  expect(header).toHaveAttribute('aria-expanded', 'true');

  await user.click(header);
  expect(header).toHaveAttribute('aria-expanded', 'false');
});

// Test localStorage persistence
it('should persist collapse state', async () => {
  const user = userEvent.setup();
  render(<AdaptiveSidebar />);

  const header = screen.getByRole('button', { name: /WORK/ });
  await user.click(header);

  const stored = localStorage.getItem('kaizen-sidebar-sections');
  expect(JSON.parse(stored)).toContain('WORK');
});
```
