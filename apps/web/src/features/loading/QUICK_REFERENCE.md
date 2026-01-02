# Loading Skeleton Quick Reference

Quick copy-paste examples for common use cases.

## Import

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
```

## Common Patterns

### Basic Loading State

```tsx
const { isPending, data } = useQuery({...});
if (isPending) return <Skeleton className="h-32 w-full" />;
return <Content data={data} />;
```

### Card Grid

```tsx
if (isPending) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
```

### Table Loading

```tsx
if (isPending) return <SkeletonTable rows={10} columns={5} />;
```

### List Loading

```tsx
if (isPending) return <SkeletonList items={8} showAvatar={true} />;
```

### Form Loading

```tsx
if (isPending) return <SkeletonForm fields={5} showLabels={true} />;
```

### Full Page Loading

```tsx
if (isPending) return <PageSkeleton variant="dashboard" />;
```

## Component Sizes

### Avatar

```tsx
<Skeleton variant="circular" width={40} height={40} />
```

### Button

```tsx
<Skeleton variant="rounded" width={100} height={40} />
```

### Input Field

```tsx
<Skeleton variant="rounded" height={40} className="w-full" />
```

### Image

```tsx
<Skeleton variant="rectangular" width="100%" height={200} />
```

### Icon

```tsx
<Skeleton variant="circular" width={24} height={24} />
```

### Badge

```tsx
<Skeleton variant="rounded" width={60} height={24} />
```

## Responsive Layouts

### Stats Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="border rounded-lg p-6 space-y-3">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="40%" height={32} />
    </div>
  ))}
</div>
```

### Two-Column Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    <SkeletonCard />
  </div>
  <div>
    <SkeletonList items={5} />
  </div>
</div>
```

### Header with Actions

```tsx
<div className="flex items-center justify-between">
  <div className="space-y-2">
    <Skeleton variant="text" width={200} height={32} />
    <Skeleton variant="text" width={300} />
  </div>
  <Skeleton variant="rounded" width={120} height={40} />
</div>
```

## Custom Skeletons

### Profile Header

```tsx
<div className="flex items-start gap-4">
  <Skeleton variant="circular" width={80} height={80} />
  <div className="flex-1 space-y-2">
    <Skeleton variant="text" width="40%" height={24} />
    <Skeleton variant="text" width="60%" />
    <div className="flex gap-2">
      <Skeleton variant="rounded" width={100} height={32} />
      <Skeleton variant="rounded" width={100} height={32} />
    </div>
  </div>
</div>
```

### Stat Card

```tsx
<div className="border rounded-lg p-6 space-y-3">
  <Skeleton variant="text" width="50%" />
  <Skeleton variant="text" width="30%" height={36} />
  <Skeleton variant="text" width="70%" />
</div>
```

### Search Bar

```tsx
<div className="flex gap-2">
  <Skeleton variant="rounded" height={40} className="flex-1" />
  <Skeleton variant="rounded" width={100} height={40} />
</div>
```

### Breadcrumb

```tsx
<div className="flex items-center gap-2">
  <Skeleton variant="text" width={80} />
  <Skeleton variant="text" width={20} />
  <Skeleton variant="text" width={120} />
</div>
```

### Tab Bar

```tsx
<div className="flex gap-4 border-b pb-2">
  <Skeleton variant="text" width={80} />
  <Skeleton variant="text" width={100} />
  <Skeleton variant="text" width={90} />
</div>
```

## Animation Control

### Disable for Performance

```tsx
<PageSkeleton variant="list" animate={false} />
```

### Disable for Testing

```tsx
<SkeletonTable rows={5} columns={4} animate={false} />
```

### Conditional Animation

```tsx
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
<Skeleton animate={!prefersReducedMotion} />;
```

## Error State

```tsx
if (isPending) return <SkeletonCard />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

## Multiple Loading States

```tsx
const { isPending: isPendingUsers, data: users } = useQuery({...});
const { isPending: isPendingPosts, data: posts } = useQuery({...});

return (
  <div className="space-y-6">
    {isPendingUsers ? <SkeletonList items={5} /> : <UserList data={users} />}
    {isPendingPosts ? <SkeletonTable rows={8} /> : <PostTable data={posts} />}
  </div>
);
```

## Page Variants

```tsx
// Dashboard with stats and charts
<PageSkeleton variant="dashboard" />

// List with filters and table
<PageSkeleton variant="list" />

// Detail with breadcrumb and content
<PageSkeleton variant="detail" />

// Form with fields and buttons
<PageSkeleton variant="form" />
```

## Common Combinations

### Card with Image and Actions

```tsx
<SkeletonCard
  showImage={true}
  showTitle={true}
  showDescription={true}
  showActions={true}
/>
```

### Simple Card

```tsx
<SkeletonCard
  showImage={false}
  showTitle={true}
  showDescription={false}
  showActions={false}
/>
```

### List with Avatars

```tsx
<SkeletonList items={5} showAvatar={true} showSecondary={true} />
```

### Simple List

```tsx
<SkeletonList items={8} showAvatar={false} showSecondary={false} />
```

### Form with Everything

```tsx
<SkeletonForm fields={6} showLabels={true} showButton={true} />
```

### Form Fields Only

```tsx
<SkeletonForm fields={4} showLabels={false} showButton={false} />
```

## Testing Patterns

```tsx
import { render, screen } from "@testing-library/react";
import { SkeletonCard } from "@/features/loading";

it("shows loading state", () => {
  render(<SkeletonCard />);
  const skeletons = screen.getAllByRole("status");
  expect(skeletons.length).toBeGreaterThan(0);
});

it("disables animation", () => {
  render(<SkeletonCard animate={false} />);
  const skeletons = screen.getAllByRole("status");
  skeletons.forEach((s) => {
    expect(s).not.toHaveClass("animate-pulse");
  });
});
```

## Tips

1. **Match Layout**: Skeletons should match the actual content layout
2. **Consistent Sizing**: Use the same dimensions as loaded content
3. **Avoid Flash**: Skip skeleton for very fast loads (<200ms)
4. **Granular Loading**: Load sections independently when possible
5. **Test Accessibility**: All skeletons have proper ARIA attributes
