# Loading Skeleton System

Comprehensive skeleton loading components for Kaizen Studio frontend with responsive design, accessibility, and consistent styling.

## Overview

The loading system provides pre-built skeleton components that match the application's design system, ensuring consistent loading states across all features. All components support animation toggling, custom styling, and accessibility best practices.

## Components

### Skeleton (Base Component)

The foundational skeleton component with multiple variants.

```tsx
import { Skeleton } from "@/features/loading";

// Basic usage
<Skeleton />

// With variants
<Skeleton variant="text" />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="rectangular" width={200} height={100} />
<Skeleton variant="rounded" width="100%" height={50} />

// Disable animation
<Skeleton animate={false} />
```

**Props:**

- `variant`: "text" | "circular" | "rectangular" | "rounded" (default: "rectangular")
- `width`: string | number (optional)
- `height`: string | number (optional)
- `className`: string (optional)
- `animate`: boolean (default: true)

**Accessibility:**

- `role="status"` for screen readers
- `aria-busy="true"` indicates loading state
- `aria-live="polite"` announces updates
- Hidden "Loading..." text for screen readers

### SkeletonText

Multiple text lines with realistic widths.

```tsx
import { SkeletonText } from "@/features/loading";

// Default 3 lines
<SkeletonText />

// Custom lines with spacing
<SkeletonText lines={5} spacing="lg" />
<SkeletonText lines={2} spacing="sm" />
```

**Props:**

- `lines`: number (default: 3)
- `spacing`: "sm" | "md" | "lg" (default: "md")
- `className`: string (optional)
- `animate`: boolean (default: true)

**Features:**

- Last line is 75% width for realistic appearance
- Configurable line spacing

### SkeletonCard

Card placeholder with optional sections.

```tsx
import { SkeletonCard } from "@/features/loading";

// Full card
<SkeletonCard />

// Customized sections
<SkeletonCard
  showImage={false}
  showTitle={true}
  showDescription={true}
  showActions={false}
/>
```

**Props:**

- `showImage`: boolean (default: true)
- `showTitle`: boolean (default: true)
- `showDescription`: boolean (default: true)
- `showActions`: boolean (default: true)
- `className`: string (optional)
- `animate`: boolean (default: true)

**Layout:**

- Image: 200px height
- Header: Title + Description
- Content: 3 text lines
- Footer: 2 action buttons

### SkeletonTable

Table placeholder with rows and columns.

```tsx
import { SkeletonTable } from "@/features/loading";

// Default 5x4 table
<SkeletonTable />

// Custom dimensions
<SkeletonTable rows={10} columns={6} showHeader={true} />

// Without header
<SkeletonTable rows={3} columns={3} showHeader={false} />
```

**Props:**

- `rows`: number (default: 5)
- `columns`: number (default: 4)
- `showHeader`: boolean (default: true)
- `className`: string (optional)
- `animate`: boolean (default: true)

**Features:**

- Uses shadcn Table components for consistency
- Bordered with rounded corners
- First column slightly wider (90% vs 70%)

### SkeletonList

List items with optional avatars and secondary text.

```tsx
import { SkeletonList } from "@/features/loading";

// Default 5 items with avatars
<SkeletonList />

// Custom items
<SkeletonList
  items={3}
  showAvatar={true}
  showSecondary={true}
/>

// Simple list without avatars
<SkeletonList items={5} showAvatar={false} />
```

**Props:**

- `items`: number (default: 5)
- `showAvatar`: boolean (default: true)
- `showSecondary`: boolean (default: true)
- `className`: string (optional)
- `animate`: boolean (default: true)

**Layout:**

- Avatar: 40x40 circular
- Primary text: 40% width
- Secondary text: 80% width

### SkeletonForm

Form fields placeholder with labels and buttons.

```tsx
import { SkeletonForm } from "@/features/loading";

// Default 4 fields
<SkeletonForm />

// Custom fields
<SkeletonForm
  fields={6}
  showLabels={true}
  showButton={true}
/>

// Without labels and buttons
<SkeletonForm fields={3} showLabels={false} showButton={false} />
```

**Props:**

- `fields`: number (default: 4)
- `showLabels`: boolean (default: true)
- `showButton`: boolean (default: true)
- `className`: string (optional)
- `animate`: boolean (default: true)

**Layout:**

- Labels: 30% width
- Inputs: 40px height
- Buttons: 2 buttons with 120px and 100px widths

### PageSkeleton

Full page layouts for common page types.

```tsx
import { PageSkeleton } from "@/features/loading";

// Dashboard layout
<PageSkeleton variant="dashboard" />

// List page layout
<PageSkeleton variant="list" />

// Detail page layout
<PageSkeleton variant="detail" />

// Form page layout
<PageSkeleton variant="form" />
```

**Props:**

- `variant`: "dashboard" | "list" | "detail" | "form" (default: "dashboard")
- `className`: string (optional)
- `animate`: boolean (default: true)

#### Variant Layouts

**Dashboard:**

- Page header with title and description
- 4-column stats grid (responsive: 1/2/4 columns)
- 2-column charts grid (responsive: 1/2 columns)

**List:**

- Header with title, description, and action button
- Filter controls (3 filters)
- Data table (8 rows × 5 columns)

**Detail:**

- Breadcrumb navigation
- Header with title and action buttons
- 3-column grid (responsive: 1/3 columns)
  - Main content (2 columns): 2 cards
  - Sidebar (1 column): 1 card + list

**Form:**

- Page header with title and description
- Form card with 6 fields, labels, and buttons

## Usage Examples

### Integration with React Query

```tsx
import { useQuery } from "@tanstack/react-query";
import { SkeletonTable } from "@/features/loading";

function UsersTable() {
  const { isPending, error, data } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (isPending) return <SkeletonTable rows={5} columns={4} />;
  if (error) return <div>Error: {error.message}</div>;

  return <Table data={data} />;
}
```

### Page-Level Loading

```tsx
import { PageSkeleton } from "@/features/loading";

function DashboardPage() {
  const { isPending, data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  if (isPending) return <PageSkeleton variant="dashboard" />;

  return <DashboardContent data={data} />;
}
```

### Conditional Sections

```tsx
import { SkeletonCard } from "@/features/loading";

function ProductCard({ productId }) {
  const { isPending, data } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });

  if (isPending) {
    return (
      <SkeletonCard
        showImage={true}
        showTitle={true}
        showDescription={true}
        showActions={true}
      />
    );
  }

  return <Product data={data} />;
}
```

### Custom Styling

```tsx
import { Skeleton } from "@/features/loading";

// Custom dimensions and colors
<Skeleton
  className="w-64 h-12 bg-primary-100 dark:bg-primary-900"
  animate={true}
/>

// Full width with custom height
<Skeleton className="w-full h-96" />
```

## Responsive Design

All components use responsive Tailwind classes:

- **Mobile-first**: Base styles for mobile
- **Tablet**: `md:` prefix (768px+)
- **Desktop**: `lg:` prefix (1024px+)

Example responsive grids:

```tsx
// 1 column on mobile, 2 on tablet, 4 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <SkeletonCard />
  <SkeletonCard />
  <SkeletonCard />
  <SkeletonCard />
</div>
```

## Dark Mode Support

All skeletons use `bg-muted` from the design system, which automatically adapts to dark mode:

```tsx
// Automatically supports dark mode
<Skeleton />

// Custom dark mode colors
<Skeleton className="bg-secondary-100 dark:bg-secondary-900" />
```

## Animation Control

Disable animation for:

- User preferences (reduced motion)
- Performance optimization
- Testing

```tsx
// Globally disable animation
<PageSkeleton variant="dashboard" animate={false} />

// Selectively disable
<SkeletonCard animate={false} />
<SkeletonTable animate={false} />
```

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

1. **ARIA Attributes:**
   - `role="status"` - Indicates loading status
   - `aria-busy="true"` - Signals active loading
   - `aria-live="polite"` - Announces completion

2. **Screen Reader Support:**
   - Hidden "Loading..." text
   - Semantic HTML structure
   - Proper heading hierarchy in PageSkeleton

3. **Reduced Motion:**
   - Respects `prefers-reduced-motion`
   - Animation can be disabled via `animate` prop

## Best Practices

1. **Match Content Layout:**
   - Use skeletons that match the actual content structure
   - Keep dimensions similar to loaded content

2. **Consistent Timing:**
   - Use same animation duration across components
   - Default Tailwind `animate-pulse` is consistent

3. **Granular Loading:**
   - Load sections independently when possible
   - Use smaller skeletons over full-page skeletons

4. **Error States:**
   - Replace skeleton with error message
   - Don't show skeleton during error state

5. **Avoid Skeleton Flash:**
   - For fast-loading content (<200ms), skip skeleton
   - Use suspense boundaries to prevent flashing

```tsx
// Good: Prevents flash for fast loads
const { isPending, data } = useQuery({
  queryKey: ["fast-data"],
  queryFn: fetchFastData,
});

if (isPending) {
  return (
    <Suspense fallback={<SkeletonCard />}>
      {/* Delay skeleton by 200ms */}
    </Suspense>
  );
}
```

## Testing

All components have comprehensive test coverage:

```bash
npm test -- src/features/loading/__tests__/
```

**Test Coverage:**

- ✅ Render variations (112 tests)
- ✅ Animation toggle
- ✅ Accessibility attributes
- ✅ Custom className merging
- ✅ Props validation
- ✅ Responsive behavior

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonCardProps,
  PageSkeletonProps,
} from "@/features/loading";

const MyComponent: React.FC<SkeletonCardProps> = (props) => {
  return <SkeletonCard {...props} />;
};
```

## Performance

- **Zero JavaScript**: Pure CSS animations
- **Small Bundle**: ~2KB gzipped
- **No Runtime Cost**: Static markup
- **Optimized Rendering**: React.memo where beneficial

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android 5+)

## Related Components

- `@/components/ui/skeleton` - Base shadcn skeleton
- `@/components/ui/card` - Card components
- `@/components/ui/table` - Table components

## Migration Guide

From shadcn skeleton to feature skeleton:

```tsx
// Before
import { Skeleton } from "@/components/ui/skeleton";
<Skeleton className="h-12 w-12 rounded-full" />;

// After
import { Skeleton } from "@/features/loading";
<Skeleton variant="circular" width={48} height={48} />;
```

## License

Part of Kaizen Studio frontend. See main LICENSE file.
