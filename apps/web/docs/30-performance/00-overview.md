# Performance Optimization

Code splitting and lazy loading implementation for optimal load times.

## Lazy Loading Routes

All page components are lazy loaded using React.lazy and Suspense:

```tsx
import { lazy, Suspense } from "react";

// Lazy load pages
const AgentsPage = lazy(() =>
  import("./pages/agents").then((m) => ({ default: m.AgentsPage }))
);

// Wrap routes in Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/agents" element={<AgentsPage />} />
  </Routes>
</Suspense>
```

## Code Splitting Results

The build produces multiple chunks instead of one monolithic bundle:

### Core Bundles
| Bundle | Size | Gzipped | Description |
|--------|------|---------|-------------|
| index.js (main) | 386 KB | 118 KB | Main application bundle |
| react.js | 12 KB | 4 KB | React core |
| router.js | 35 KB | 13 KB | React Router |
| query.js | 41 KB | 12 KB | React Query |
| reactflow.js | 54 KB | 19 KB | React Flow (canvas) |

### UI Bundles
| Bundle | Size | Gzipped | Description |
|--------|------|---------|-------------|
| ui-utils.js | 21 KB | 7 KB | UI utilities |
| icons.js | 29 KB | 6 KB | Lucide icons |
| schemas.js | 57 KB | 15 KB | Zod schemas |

### Page Bundles (Lazy Loaded)
| Bundle | Size | Gzipped | Description |
|--------|------|---------|-------------|
| LoginPage.js | 3 KB | 1.3 KB | Login page |
| RegisterPage.js | 4.7 KB | 1.6 KB | Registration |
| Dashboard.js | 3.4 KB | 1.2 KB | Dashboard |
| SSOCallbackPage.js | 1.8 KB | 0.8 KB | SSO callback |

## Loading States

### PageLoader Component

Used as Suspense fallback:

```tsx
function PageLoader() {
  return <LoadingScreen message="Loading..." />;
}
```

### LoadingScreen Component

Centered spinner with optional message:

```tsx
import { LoadingScreen } from "@/components/shared";

<LoadingScreen message="Loading agents..." />
```

## Performance Best Practices

### 1. Route-Based Splitting

Each route is a separate chunk:

```tsx
// Each import creates a separate chunk
const AgentsPage = lazy(() => import("./pages/agents"));
const PipelinesPage = lazy(() => import("./pages/pipelines"));
```

### 2. Heavy Components Split

React Flow (canvas) is isolated:

```tsx
const PipelineEditorPage = lazy(() =>
  import("./pages/pipelines").then((m) => ({ default: m.PipelineEditorPage }))
);
```

### 3. Named Exports

Use `.then()` to handle named exports:

```tsx
// Named export
const AgentsPage = lazy(() =>
  import("./pages/agents").then((m) => ({ default: m.AgentsPage }))
);

// Default export (simpler)
const Dashboard = lazy(() => import("./pages/Dashboard"));
```

### 4. Preloading Critical Routes

For frequently accessed routes, preload on hover:

```tsx
const handleMouseEnter = () => {
  import("./pages/agents"); // Preload
};

<Link to="/agents" onMouseEnter={handleMouseEnter}>
  Agents
</Link>
```

## CSS Optimization

### 1. CSS Variables for Theming

Uses CSS custom properties instead of @apply:

```css
* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

### 2. CSS Bundles

| Bundle | Size | Gzipped | Description |
|--------|------|---------|-------------|
| index.css | 16 KB | 2.7 KB | Base styles |
| index.css | 33 KB | 6.5 KB | Component styles |

## Measuring Performance

### Lighthouse Audit

```bash
# Run Lighthouse in Chrome DevTools
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Check "Performance"
4. Click "Analyze page load"
```

### Key Metrics

- **LCP (Largest Contentful Paint)**: Target < 2.5s
- **FID (First Input Delay)**: Target < 100ms
- **CLS (Cumulative Layout Shift)**: Target < 0.1

### Bundle Analysis

```bash
# Analyze bundle sizes
npm run build -- --report

# Or use source-map-explorer
npx source-map-explorer dist/assets/*.js
```

## Future Optimizations

### 1. Component-Level Splitting

Split heavy feature components:

```tsx
const MetricsDashboard = lazy(() =>
  import("@/features/metrics").then((m) => ({
    default: m.MetricsDashboard,
  }))
);
```

### 2. Image Optimization

- Use WebP format
- Implement lazy loading for images
- Use responsive images with srcset

### 3. Service Worker

Add offline support and caching:

```tsx
// Register service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
```

### 4. HTTP/2 Server Push

Configure server to push critical assets.

## Configuration

### Vite Build Config

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
          reactflow: ["@xyflow/react"],
        },
      },
    },
  },
});
```

### Query Client Settings

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```
