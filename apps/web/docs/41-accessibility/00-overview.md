# Accessibility Standards

WCAG 2.1 AA compliance guidelines for Kaizen Studio frontend.

## Requirements

### Color Contrast
- Normal text: 4.5:1 ratio minimum
- Large text (18pt+): 3:1 ratio minimum
- UI components: 3:1 ratio minimum

### Keyboard Navigation
- All interactive elements focusable via Tab
- Focus visible on all focusable elements
- Escape closes dialogs/modals
- Arrow keys for menu navigation

### Screen Readers
- All images have alt text
- Form inputs have labels
- Buttons have accessible names
- Live regions announce updates

### Focus Management
- Focus trapped in modals
- Focus returns after modal close
- Skip links for main content
- Logical focus order

## Implementation

### Components with ARIA Support

#### Dialogs
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

#### Forms
```tsx
<form>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" aria-required="true" />
  <span role="alert" aria-live="polite">{error}</span>
</form>
```

#### Navigation
```tsx
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="menuitem">
      <a href="/dashboard">Dashboard</a>
    </li>
  </ul>
</nav>
```

#### Status Indicators
```tsx
<div role="status" aria-live="polite">
  {isLoading ? 'Loading...' : 'Ready'}
</div>
```

### Skip Links

Add to AppShell:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Focus Visible

Tailwind config includes focus-visible:
```css
.focus-visible:ring-2
.focus-visible:ring-primary
.focus-visible:ring-offset-2
```

## Testing

### Manual Testing
1. Tab through all interactive elements
2. Verify focus indicators visible
3. Test with screen reader (VoiceOver/NVDA)
4. Test color contrast with DevTools

### Automated Testing
```bash
# E2E accessibility tests
npx playwright test e2e/accessibility.spec.ts

# Lighthouse audit
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

### E2E Coverage

`e2e/accessibility.spec.ts` (630 lines) tests:
- Skip links
- Landmarks (main, nav, banner)
- Heading structure
- Form controls
- Keyboard navigation
- ARIA attributes
- Focus management
- Color independence

## Checklist

### Global
- [ ] Skip link to main content
- [ ] Consistent heading hierarchy (h1 > h2 > h3)
- [ ] Language attribute on html element
- [ ] Page titles change per route

### Forms
- [ ] All inputs have labels
- [ ] Required fields indicated
- [ ] Error messages announced
- [ ] Submit buttons have accessible names

### Navigation
- [ ] Current page indicated
- [ ] Menu items have roles
- [ ] Breadcrumbs have nav landmark

### Dialogs
- [ ] Focus trapped when open
- [ ] Escape key closes
- [ ] Focus returns on close
- [ ] Title and description present

### Tables
- [ ] Headers marked with th
- [ ] Caption or aria-label present
- [ ] Sortable columns announced

### Images
- [ ] Decorative images have empty alt
- [ ] Informative images have descriptive alt
- [ ] Charts have text alternatives

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
