# Loading States Feature

## Overview

The loading feature provides a comprehensive set of skeleton loading components for displaying placeholder content while data is being fetched, improving perceived performance and user experience.

## Directory Structure

```
src/features/loading/
├── types/
│   └── index.ts         # Skeleton types and props
├── components/
│   ├── Skeleton.tsx         # Base skeleton component
│   ├── SkeletonText.tsx     # Multi-line text skeleton
│   ├── SkeletonCard.tsx     # Card skeleton with sections
│   ├── SkeletonTable.tsx    # Table skeleton with rows/columns
│   ├── SkeletonList.tsx     # List skeleton with avatars
│   ├── SkeletonForm.tsx     # Form skeleton with fields
│   └── PageSkeleton.tsx     # Full page skeleton layouts
├── __tests__/               # 112 tests total
│   ├── Skeleton.test.tsx
│   ├── SkeletonText.test.tsx
│   ├── SkeletonCard.test.tsx
│   ├── SkeletonTable.test.tsx
│   ├── SkeletonList.test.tsx
│   ├── SkeletonForm.test.tsx
│   ├── PageSkeleton.test.tsx
│   └── index.test.tsx
└── index.ts
```

## Types

### SkeletonProps

```typescript
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}
```

### SkeletonVariant

```typescript
type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";
```

### Component-Specific Props

```typescript
interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  spacing?: "sm" | "md" | "lg";
}

interface SkeletonCardProps extends SkeletonProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
}

interface SkeletonTableProps extends SkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

interface SkeletonListProps extends SkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showSecondary?: boolean;
}

interface SkeletonFormProps extends SkeletonProps {
  fields?: number;
  showLabels?: boolean;
  showButton?: boolean;
}

interface PageSkeletonProps extends SkeletonProps {
  variant?: "dashboard" | "list" | "detail" | "form";
}
```

## Components

### Skeleton

Base skeleton component with variants and animation.

```tsx
import { Skeleton } from "@/features/loading";

// Text line
<Skeleton variant="text" width="100%" />

// Circular avatar
<Skeleton variant="circular" width={40} height={40} />

// Rectangle
<Skeleton variant="rectangular" height={200} />

// Rounded card
<Skeleton variant="rounded" height={100} />
```

### SkeletonText

Multi-line text skeleton with configurable spacing.

```tsx
import { SkeletonText } from "@/features/loading";

<SkeletonText lines={3} spacing="md" />
```

### SkeletonCard

Card skeleton with image, title, description, and actions sections.

```tsx
import { SkeletonCard } from "@/features/loading";

<SkeletonCard
  showImage={true}
  showTitle={true}
  showDescription={true}
  showActions={true}
/>
```

### SkeletonTable

Table skeleton with header and configurable rows/columns.

```tsx
import { SkeletonTable } from "@/features/loading";

<SkeletonTable rows={5} columns={4} showHeader={true} />
```

### SkeletonList

List skeleton with avatars and secondary text.

```tsx
import { SkeletonList } from "@/features/loading";

<SkeletonList items={5} showAvatar={true} showSecondary={true} />
```

### SkeletonForm

Form skeleton with labels, inputs, and buttons.

```tsx
import { SkeletonForm } from "@/features/loading";

<SkeletonForm fields={4} showLabels={true} showButton={true} />
```

### PageSkeleton

Full page skeleton layouts for different page types.

```tsx
import { PageSkeleton } from "@/features/loading";

// Dashboard page with stats and charts
<PageSkeleton variant="dashboard" />

// List page with header and table
<PageSkeleton variant="list" />

// Detail page with sidebar
<PageSkeleton variant="detail" />

// Form page with inputs
<PageSkeleton variant="form" />
```

## Features

- **Animation Control** - Enable/disable pulse animation via `animate` prop
- **Accessibility** - Uses `role="status"` and `aria-busy="true"` for screen readers
- **Customization** - Custom className support for all components
- **Dark Mode** - Adapts to light/dark themes automatically
- **Responsive** - Layouts adapt to container width

## Testing

112 tests covering:
- Component rendering with default and custom props
- Animation behavior (enabled/disabled)
- Variant-specific rendering
- Accessibility attributes
- Layout and spacing
- Edge cases

Run tests:
```bash
npm run test src/features/loading
```

## Usage Example

```tsx
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonForm,
  PageSkeleton,
} from "@/features/loading";

function DataList() {
  const { data, isLoading } = useQuery(["items"], fetchItems);

  if (isLoading) {
    return <SkeletonList items={5} showAvatar />;
  }

  return <ItemList items={data} />;
}

function Dashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return <DashboardContent data={data} />;
}
```

## Best Practices

1. **Match Loading UI to Content** - Use skeletons that match the shape of loaded content
2. **Keep Animations Subtle** - Default pulse animation is subtle; avoid excessive motion
3. **Set Appropriate Sizes** - Size skeletons to match expected content dimensions
4. **Use PageSkeleton for Full Pages** - Provides consistent loading experience across pages
5. **Disable Animation When Needed** - Set `animate={false}` for static placeholders
