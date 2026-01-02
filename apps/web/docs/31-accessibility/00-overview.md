# Accessibility

WCAG 2.1 Level AA compliance utilities and components.

## Components

### VisuallyHidden

Hide content visually while keeping it accessible to screen readers:

```tsx
import { VisuallyHidden } from "@/components/shared";

<button>
  <Icon />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</button>
```

Props:
- `children` - Content to hide visually
- `as` - Element type ('span' | 'div'), default 'span'
- `className` - Additional classes

### SkipLink

Skip navigation link for keyboard users:

```tsx
import { SkipLink } from "@/components/shared";

function App() {
  return (
    <>
      <SkipLink href="#main-content" />
      <nav>...</nav>
      <main id="main-content">...</main>
    </>
  );
}
```

Props:
- `href` - Target ID, default '#main-content'
- `children` - Link text, default 'Skip to main content'

### LiveRegion

Announce dynamic content to screen readers:

```tsx
import { LiveRegion } from "@/components/shared";

function NotificationArea() {
  const [message, setMessage] = useState("");

  return (
    <LiveRegion politeness="polite">
      {message}
    </LiveRegion>
  );
}
```

Props:
- `politeness` - 'polite' | 'assertive' | 'off'
- `atomic` - Announce entire region (boolean)
- `relevant` - What changes to announce

## Hooks

### useAnnounce

Programmatic screen reader announcements:

```tsx
import { useAnnounce } from "@/hooks";

function SaveButton() {
  const { announce } = useAnnounce();

  const handleSave = async () => {
    await save();
    announce("Changes saved successfully");
  };

  return <button onClick={handleSave}>Save</button>;
}
```

Politeness levels:
- `polite` - Wait for user to finish (default)
- `assertive` - Interrupt immediately

### useFocusTrap

Trap focus within modal/dialog:

```tsx
import { useFocusTrap } from "@/hooks";

function Modal({ isOpen, onClose }) {
  const { containerRef } = useFocusTrap(isOpen);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      <button onClick={onClose}>Close</button>
      <input placeholder="Name" />
      <button>Submit</button>
    </div>
  );
}
```

Features:
- Tab cycles through focusable elements
- Shift+Tab cycles backwards
- Focus restored on unmount

### useReducedMotion

Respect user's motion preferences:

```tsx
import { useReducedMotion } from "@/hooks";

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={reducedMotion ? "" : "animate-bounce"}
    >
      Content
    </div>
  );
}
```

### useAriaDescribedBy

Generate ARIA description IDs:

```tsx
import { useAriaDescribedBy } from "@/hooks";

function FormField({ error, description }) {
  const { describedBy, descriptionId, errorId } = useAriaDescribedBy(
    !!description,
    !!error
  );

  return (
    <div>
      <input aria-describedby={describedBy} />
      {description && <p id={descriptionId}>{description}</p>}
      {error && <p id={errorId}>{error}</p>}
    </div>
  );
}
```

## CSS Utilities

### sr-only

Screen reader only content:

```html
<span class="sr-only">Description for screen readers</span>
```

### focus:not-sr-only

Show on focus (for skip links):

```html
<a href="#main" class="sr-only focus:not-sr-only">
  Skip to content
</a>
```

## Best Practices

### 1. Semantic HTML

Use correct elements:

```tsx
// Good
<button onClick={handleClick}>Save</button>
<nav aria-label="Main navigation">...</nav>
<main id="main-content">...</main>

// Bad
<div onClick={handleClick}>Save</div>
<div>Navigation</div>
```

### 2. ARIA Labels

Provide context for interactive elements:

```tsx
// Icon-only button
<button aria-label="Delete item">
  <TrashIcon />
</button>

// Form field
<input
  aria-label="Search"
  aria-describedby="search-help"
/>
<p id="search-help">Enter keywords to search</p>
```

### 3. Focus Management

Manage focus for modals and dynamic content:

```tsx
// Focus first element when modal opens
useEffect(() => {
  if (isOpen) {
    firstInputRef.current?.focus();
  }
}, [isOpen]);

// Return focus when modal closes
const { containerRef } = useFocusTrap(isOpen);
```

### 4. Color Contrast

WCAG 2.1 AA requirements:
- Normal text: 4.5:1 ratio
- Large text (18px+): 3:1 ratio
- UI components: 3:1 ratio

### 5. Keyboard Navigation

Ensure all interactions work with keyboard:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
>
  Interactive element
</div>
```

## Testing

### Unit Tests

Test accessibility attributes:

```tsx
it("should have correct ARIA attributes", () => {
  render(<LiveRegion politeness="assertive">Message</LiveRegion>);

  const region = screen.getByRole("status");
  expect(region).toHaveAttribute("aria-live", "assertive");
  expect(region).toHaveAttribute("aria-atomic", "true");
});
```

### Lighthouse Audit

Run accessibility audit:

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Click "Analyze page load"

Target score: 90+

### Screen Reader Testing

Test with:
- VoiceOver (macOS): Cmd+F5
- NVDA (Windows): Free download
- JAWS (Windows): Commercial

### Keyboard Testing

Verify:
- Tab navigation order
- Focus visibility
- Enter/Space activation
- Escape to close modals
- Arrow keys in menus

## Checklist

### Components
- [ ] All images have alt text
- [ ] Forms have labels
- [ ] Buttons have accessible names
- [ ] Links have descriptive text
- [ ] Icons have sr-only labels

### Keyboard
- [ ] All interactive elements focusable
- [ ] Focus order is logical
- [ ] Focus indicator visible
- [ ] Skip link present
- [ ] Escape closes modals

### Screen Readers
- [ ] Headings structure correct
- [ ] Landmarks present (nav, main, aside)
- [ ] Live regions for updates
- [ ] Error messages announced
- [ ] Loading states announced

### Visual
- [ ] Color contrast meets 4.5:1
- [ ] Text resizable to 200%
- [ ] No content lost on zoom
- [ ] Reduced motion respected
