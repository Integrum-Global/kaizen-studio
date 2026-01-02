# Toast Notifications Feature

## Overview

The toast feature provides enhanced toast notifications with variant-based styling, icons, progress bars, and accessibility support. Built on top of the base shadcn/ui toast system with additional functionality.

## Directory Structure

```
src/features/toast/
├── types/
│   └── index.ts           # ToastType, ToastConfig, LoadingToastMethods
├── components/
│   ├── EnhancedToast.tsx  # Main toast component with variants
│   ├── ToastContainer.tsx # Container for toast positioning
│   ├── ToastIcon.tsx      # Variant-specific icons
│   ├── index.ts
│   └── __tests__/         # 93 tests total
│       ├── EnhancedToast.test.tsx
│       ├── ToastContainer.test.tsx
│       └── ToastIcon.test.tsx
├── hooks/
│   ├── useToastActions.ts # Convenience hook for showing toasts
│   └── index.ts
├── utils/
│   └── toastHelpers.ts    # Helper functions for creating toasts
└── index.ts
```

## Types

### ToastType

```typescript
type ToastType = "default" | "success" | "error" | "warning" | "info";
```

### ToastPosition

```typescript
type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";
```

### ToastConfig

```typescript
interface ToastConfig {
  variant?: ToastType;
  duration?: number;        // Auto-dismiss time in ms (0 = no auto-dismiss)
  closable?: boolean;
  icon?: React.ReactNode;
  showProgress?: boolean;   // Progress bar showing time remaining
  position?: ToastPosition;
  ariaLive?: "polite" | "assertive";
  ariaRole?: "alert" | "status";
}
```

### EnhancedToastConfig

```typescript
interface EnhancedToastConfig extends ToastConfig {
  title: string;
  description?: string;
}
```

### LoadingToastMethods

```typescript
interface LoadingToastMethods {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  dismiss: () => void;
}
```

## Components

### EnhancedToast

Toast component with variant-based styling, icons, and progress bar.

```tsx
import { EnhancedToast } from "@/features/toast";

<EnhancedToast
  variant="success"
  title="Success"
  description="Operation completed successfully"
  showProgress={true}
  duration={5000}
  closable={true}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | ToastType | "default" | Toast variant |
| title | ReactNode | - | Toast title |
| description | ReactNode | - | Toast description |
| icon | ReactNode | - | Custom icon (overrides variant icon) |
| showProgress | boolean | false | Show progress bar |
| duration | number | 5000 | Auto-dismiss duration in ms |
| closable | boolean | true | Show close button |
| className | string | - | Custom class name |
| open | boolean | - | Controlled open state |
| onOpenChange | function | - | Open state change callback |

#### Variant Styles

- **default**: Standard border and background
- **success**: Green border/background with check icon
- **error**: Red border/background with X icon
- **warning**: Amber border/background with triangle icon
- **info**: Blue border/background with info icon

### ToastContainer

Container component for positioning toasts.

```tsx
import { ToastContainer } from "@/features/toast";

<ToastContainer position="top-right">
  {/* Toasts rendered here */}
</ToastContainer>
```

### ToastIcon

Icon component for toast variants.

```tsx
import { ToastIcon } from "@/features/toast";

<ToastIcon variant="success" />
<ToastIcon variant="error" customIcon={<CustomIcon />} />
```

## Hooks

### useToastActions

Hook providing convenience methods for showing toasts.

```tsx
import { useToastActions } from "@/features/toast";

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo, showLoading } = useToastActions();

  // Simple toasts
  const handleSuccess = () => {
    showSuccess("Success!", "Operation completed");
  };

  const handleError = () => {
    showError("Error!", "Something went wrong");
  };

  // Loading toast with state updates
  const handleAsync = async () => {
    const loading = showLoading("Processing...");

    try {
      await someAsyncOperation();
      loading.success("Done!", "Processing complete");
    } catch (error) {
      loading.error("Failed!", "Could not complete processing");
    }
  };

  return (
    <>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleAsync}>Process</button>
    </>
  );
}
```

#### Returned Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| showSuccess | (title, description?) => void | Show success toast |
| showError | (title, description?) => void | Show error toast |
| showWarning | (title, description?) => void | Show warning toast |
| showInfo | (title, description?) => void | Show info toast |
| showLoading | (title) => LoadingToastMethods | Show loading toast with update methods |

## Utility Functions

### createToast

Create a toast with full configuration options.

```tsx
import { createToast } from "@/features/toast";

createToast({
  variant: "success",
  title: "Saved",
  description: "Your changes have been saved",
  duration: 3000,
  showProgress: true,
});
```

### Helper Functions

```tsx
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
} from "@/features/toast";

// Quick toast creation
showSuccessToast("Success!", "Operation completed");
showErrorToast("Error!", "Something went wrong");
showWarningToast("Warning!", "Please review your input");
showInfoToast("Info", "New updates available");

// Loading toast with promise-like API
const loading = showLoadingToast("Processing...");
loading.success("Done!");
// or
loading.error("Failed!");
// or
loading.dismiss();
```

## Accessibility

The toast feature implements WCAG 2.1 accessibility standards:

- **ARIA Roles**:
  - Error toasts use `role="alert"` for immediate attention
  - Other variants use `role="status"` for polite notifications
- **ARIA Live Regions**:
  - Error toasts use `aria-live="assertive"`
  - Other variants use `aria-live="polite"`
- **Progress Bar**: Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`
- **Keyboard Navigation**: Close button is keyboard accessible
- **Focus Management**: Toasts don't steal focus from user interactions

## Dark Mode Support

All toast variants include dark mode styles:

- Automatic adaptation to light/dark theme
- Proper contrast ratios in both modes
- Consistent color palette across variants

## Testing

93 tests covering:
- Component rendering with all variants
- Progress bar animation and display
- Icon rendering and custom icons
- ARIA attributes and accessibility
- User interactions (close, dismiss)
- Loading toast state transitions
- Edge cases (0 duration, custom className)

Run tests:
```bash
npm run test src/features/toast
```

## Usage Examples

### Basic Toast

```tsx
import { useToastActions } from "@/features/toast";

function SaveButton() {
  const { showSuccess, showError } = useToastActions();

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess("Saved", "Your changes have been saved");
    } catch {
      showError("Error", "Failed to save changes");
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Form Submission with Loading

```tsx
import { useToastActions } from "@/features/toast";

function ContactForm() {
  const { showLoading } = useToastActions();

  const handleSubmit = async (data: FormData) => {
    const loading = showLoading("Sending message...");

    try {
      await submitForm(data);
      loading.success("Sent!", "Your message has been delivered");
    } catch (error) {
      loading.error("Failed", "Could not send message. Please try again.");
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### Custom Duration and Progress

```tsx
import { createToast } from "@/features/toast";

// Toast with progress bar, 10 second duration
createToast({
  variant: "warning",
  title: "Session Expiring",
  description: "Your session will expire in 10 seconds",
  duration: 10000,
  showProgress: true,
  closable: false,
});
```

## Best Practices

1. **Use appropriate variants**: Match toast variant to message severity
2. **Keep messages concise**: Titles should be 2-4 words, descriptions 1-2 sentences
3. **Use loading toasts for async operations**: Provides feedback during wait times
4. **Set appropriate durations**: Longer durations for important messages
5. **Avoid toast overload**: Don't show multiple toasts simultaneously
6. **Use progress bars sparingly**: Only for time-sensitive notifications
