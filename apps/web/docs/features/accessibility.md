# Accessibility Features

Kaizen Studio follows WCAG 2.1 Level AA guidelines to ensure the platform is accessible to all users.

## Overview

Accessibility features include:
- **Keyboard Navigation**: Full keyboard support throughout the application
- **Screen Reader Support**: Proper ARIA attributes and semantic HTML
- **Focus Management**: Visible focus indicators and focus trapping in modals
- **Color Contrast**: Sufficient contrast ratios for text and UI elements
- **Reduced Motion**: Respects user's motion preferences

## Landmarks

The application uses HTML5 landmark elements for screen reader navigation:

- `<main>` - Main content area on all pages
- `<nav>` - Navigation sidebar and header navigation
- `<aside>` - Sidebar complementary content
- `<header>` - Application header when present

## Headings

Every page follows proper heading hierarchy:
- `<h1>` - Page title (one per page)
- `<h2>` - Section headings
- `<h3>` - Subsection headings

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move to next interactive element |
| Shift+Tab | Move to previous interactive element |
| Enter | Activate buttons, follow links |
| Space | Activate buttons, toggle checkboxes |
| Escape | Close dialogs and modals |
| Arrow keys | Navigate within menus and tabs |

## Focus Management

### Focus Indicators
All interactive elements have visible focus indicators using Tailwind's `focus-visible:ring` classes:

```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### Modal Focus Trapping
Dialogs and modals trap focus to prevent tabbing to background content:
- Focus moves to first focusable element when opened
- Tab cycles within the modal
- Escape closes the modal
- Focus returns to trigger element on close

## Forms

### Labels
All form inputs have associated labels via:
- `<label htmlFor="input-id">` elements
- `aria-label` for icon-only inputs
- `aria-labelledby` for complex labels

### Validation
Form validation provides accessible feedback:
- `aria-invalid="true"` on invalid inputs
- `role="alert"` on error messages
- Error messages linked with `aria-describedby`

## Buttons

All buttons have accessible names through:
- Visible text content
- `aria-label` for icon buttons
- `title` attribute as fallback

Icon buttons always have descriptive `aria-label`:
```tsx
<Button aria-label="Open settings">
  <Settings className="h-4 w-4" />
</Button>
```

## Images

- Meaningful images have descriptive `alt` text
- Decorative images use `alt=""` or `role="presentation"`
- SVG icons are aria-hidden when used with text

## Tables

Tables include proper accessibility structure:
- `<th>` elements for headers
- `scope="col"` or `scope="row"` on headers
- Caption or aria-label for table purpose

## Color and Contrast

The design system ensures:
- Text contrast ratio of 4.5:1 minimum
- Large text contrast ratio of 3:1 minimum
- Non-text contrast ratio of 3:1 for UI components
- Status indicators never rely solely on color

## Motion

The application respects `prefers-reduced-motion`:
- Animations are disabled or reduced
- Transitions remain for essential feedback
- No autoplay videos or animations

CSS example:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Touch Accessibility

Mobile and touch users benefit from:
- Minimum touch target size of 44x44 pixels (WCAG recommendation)
- Adequate spacing between interactive elements
- Swipe gestures have button alternatives

## Testing

Run accessibility tests:
```bash
npx playwright test e2e/accessibility.spec.ts --project=chromium
```

Tests cover:
- Skip links and landmark navigation
- Heading hierarchy on all pages
- Form control labeling
- Button accessibility
- Keyboard navigation
- Focus management in dialogs
- ARIA attributes
- Image alt text
- Table accessibility
- Color contrast
- Motion preferences
- Touch targets

## Best Practices for Development

1. **Use Semantic HTML**: Prefer `<button>`, `<nav>`, `<main>` over divs
2. **Add ARIA When Needed**: Use ARIA attributes for complex widgets
3. **Test with Keyboard**: Verify all interactions work without mouse
4. **Check Focus**: Ensure focus is visible and logical
5. **Provide Text Alternatives**: All images and icons need alt text or aria-label
6. **Announce Changes**: Use aria-live for dynamic content updates
