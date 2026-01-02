# Enhanced Toast Notification System

A comprehensive toast notification feature for Kaizen Studio with variant-based styling, accessibility support, and convenient hooks.

## Features

- **Multiple Variants**: Success, error, warning, info, and default toasts with appropriate icons and colors
- **Accessibility**: Proper ARIA attributes (role, aria-live) based on toast type
- **Progress Bar**: Optional visual indicator showing time remaining
- **Customizable**: Position, duration, icons, and styling
- **Responsive**: Works seamlessly on mobile and desktop
- **Type-Safe**: Full TypeScript support with strict mode compliance
- **Well-Tested**: 93 comprehensive tests ensuring reliability

## Installation

The toast feature is already integrated into the Kaizen Studio frontend. No additional installation required.

## Quick Start

### Basic Usage

```tsx
import { useToastActions } from "@/features/toast";

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToastActions();

  const handleSuccess = () => {
    showSuccess("Success!", "Operation completed successfully");
  };

  const handleError = () => {
    showError("Error!", "Something went wrong");
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### Loading Toast

```tsx
import { useToastActions } from "@/features/toast";

function MyComponent() {
  const { showLoading } = useToastActions();

  const handleAsyncOperation = async () => {
    const loading = showLoading("Processing...");

    try {
      await someAsyncOperation();
      loading.success("Done!", "Operation completed");
    } catch (error) {
      loading.error("Failed!", "Operation failed");
    }
  };

  return <button onClick={handleAsyncOperation}>Process</button>;
}
```

### Using Helper Functions

```tsx
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from "@/features/toast";

// Show a success toast
showSuccessToast("Success", "Your changes have been saved");

// Show an error toast
showErrorToast("Error", "Failed to save changes");

// Show a warning toast
showWarningToast("Warning", "This action cannot be undone");

// Show an info toast
showInfoToast("Info", "New features are available");
```

## API Reference

### useToastActions Hook

Returns convenience methods for showing toasts.

```tsx
const { showSuccess, showError, showWarning, showInfo, showLoading } =
  useToastActions();
```

#### Methods

- **showSuccess(title: string, description?: string)**: Show a success toast with green styling
- **showError(title: string, description?: string)**: Show an error toast with red styling
- **showWarning(title: string, description?: string)**: Show a warning toast with amber styling
- **showInfo(title: string, description?: string)**: Show an info toast with blue styling
- **showLoading(title: string)**: Show a loading toast that can be updated

#### Loading Toast Methods

The `showLoading` method returns an object with:

- **success(title: string, description?: string)**: Update to success state
- **error(title: string, description?: string)**: Update to error state
- **dismiss()**: Dismiss the toast

### Components

#### EnhancedToast

Main toast component with variant-based styling.

```tsx
<EnhancedToast
  variant="success"
  title="Success"
  description="Operation completed"
  showProgress={true}
  duration={5000}
  closable={true}
  open={true}
/>
```

**Props:**

- `variant?: ToastType` - Toast type (default | success | error | warning | info)
- `title?: ReactNode` - Toast title
- `description?: ReactNode` - Toast description
- `icon?: ReactNode` - Custom icon (overrides default)
- `showProgress?: boolean` - Show progress bar (default: false)
- `duration?: number` - Duration in ms (default: 5000)
- `closable?: boolean` - Show close button (default: true)
- `className?: string` - Custom CSS classes
- `open?: boolean` - Whether toast is open
- `onOpenChange?: (open: boolean) => void` - Callback when open state changes

#### ToastContainer

Container for managing toast positioning and stacking.

```tsx
<ToastContainer position="top-right" maxVisible={5} newestOnTop={true}>
  {toasts.map((toast) => (
    <EnhancedToast key={toast.id} {...toast} />
  ))}
</ToastContainer>
```

**Props:**

- `position?: ToastPosition` - Position (top-right | top-left | bottom-right | bottom-left | top-center | bottom-center)
- `maxVisible?: number` - Maximum visible toasts (default: 5)
- `newestOnTop?: boolean` - Stack newest on top (default: true)
- `className?: string` - Custom CSS classes

#### ToastIcon

Icon component based on toast variant.

```tsx
<ToastIcon
  variant="success"
  customIcon={<CustomIcon />}
  className="custom-class"
/>
```

**Props:**

- `variant: ToastType` - Toast variant
- `customIcon?: ReactNode` - Custom icon override
- `className?: string` - Custom CSS classes

### Types

```tsx
type ToastType = "default" | "success" | "error" | "warning" | "info";

type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

interface ToastConfig {
  variant?: ToastType;
  duration?: number;
  closable?: boolean;
  icon?: React.ReactNode;
  showProgress?: boolean;
  position?: ToastPosition;
  ariaLive?: "polite" | "assertive";
  ariaRole?: "alert" | "status";
}
```

## Styling

The toast feature uses Tailwind CSS with variant-specific colors:

- **Success**: Green (bg-green-50, border-green-200, text-green-900)
- **Error**: Red (bg-red-50, border-red-200, text-red-900)
- **Warning**: Amber (bg-amber-50, border-amber-200, text-amber-900)
- **Info**: Blue (bg-blue-50, border-blue-200, text-blue-900)
- **Default**: Background (bg-background, text-foreground)

Dark mode is fully supported with appropriate color adjustments.

## Accessibility

- **ARIA Roles**: Error toasts use `role="alert"`, others use `role="status"`
- **ARIA Live**: Error toasts use `aria-live="assertive"`, others use `aria-live="polite"`
- **Keyboard**: All toasts can be dismissed with keyboard
- **Screen Readers**: Proper announcement of toast content

## Testing

The toast feature has 93 comprehensive tests covering:

- Component rendering with all variants
- Icon display and customization
- Close button functionality
- Progress bar behavior
- Accessibility attributes
- Positioning and stacking
- Loading toast updates
- Edge cases and error handling

Run tests:

```bash
npm run test -- src/features/toast
```

## Architecture

```
src/features/toast/
├── types/
│   └── index.ts              # Type definitions
├── components/
│   ├── EnhancedToast.tsx     # Main toast component
│   ├── ToastContainer.tsx     # Container with positioning
│   ├── ToastIcon.tsx          # Icon based on variant
│   ├── index.ts
│   └── __tests__/            # Component tests (63 tests)
├── hooks/
│   ├── useToastActions.ts    # Convenience hooks
│   └── index.ts
├── utils/
│   └── toastHelpers.ts       # Helper functions
└── index.ts                   # Main export
```

## Examples

### Form Validation

```tsx
function MyForm() {
  const { showError, showSuccess } = useToastActions();

  const handleSubmit = async (data) => {
    try {
      await submitForm(data);
      showSuccess("Saved", "Your changes have been saved");
    } catch (error) {
      showError("Validation Error", error.message);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Async Operations

```tsx
function DataFetcher() {
  const { showLoading } = useToastActions();

  const fetchData = async () => {
    const loading = showLoading("Loading data...");

    try {
      const data = await fetch("/api/data");
      loading.success("Loaded", "Data fetched successfully");
      return data;
    } catch (error) {
      loading.error("Failed", "Could not fetch data");
    }
  };

  return <button onClick={fetchData}>Fetch</button>;
}
```

### Custom Configuration

```tsx
import { createToast } from "@/features/toast";

createToast({
  variant: "warning",
  title: "Custom Toast",
  description: "With custom configuration",
  duration: 10000,
  showProgress: true,
  closable: false,
  icon: <CustomIcon />,
});
```

## Contributing

When adding new features:

1. Add types to `types/index.ts`
2. Update components as needed
3. Add comprehensive tests
4. Update this README
5. Ensure TypeScript strict mode compliance
6. Run `npm run type-check` before committing

## License

Part of the Kaizen Studio project.
