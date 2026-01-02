# Kaizen Studio Web

Modern AI Agent Development Platform built with React 19, Vite 6, TypeScript 5.8, and Tailwind CSS 4.

## Tech Stack

- **React 19** - Latest React with new hooks (`use`, `useOptimistic`, `useFormStatus`)
- **Vite 6** - Next-generation frontend tooling with Turbopack
- **TypeScript 5.8** - Strict type checking enabled
- **Tailwind CSS 4** - Utility-first CSS with design tokens
- **shadcn/ui** - Re-usable component library
- **React Query** - Powerful data fetching and caching
- **React Router 7** - Client-side routing
- **React Flow** - Workflow editor for visual programming
- **Zustand** - Lightweight state management

## Design Tokens

### Colors
- **Primary**: Indigo (#6366F1) - Main brand color
- **Secondary**: Slate (#64748B) - Supporting color
- **Success**: Emerald (#10B981) - Success states
- **Warning**: Amber (#F59E0B) - Warning states
- **Error**: Red (#EF4444) - Error states
- **Background**: White (light) / Slate-950 (dark)
- **Text**: Slate-900 (light) / Slate-50 (dark)

### Spacing
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

### Typography
- **Font Family**: Inter (sans-serif), JetBrains Mono (monospace)
- **Font Sizes**: xs (12px) to 4xl (36px)

## Project Structure

```
src/
├── api/           # API client and types
├── components/    # Reusable UI components
│   └── ui/        # shadcn/ui components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── pages/         # Route pages
├── store/         # Zustand stores
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
├── main.tsx       # Application entry point
└── index.css      # Global styles and design tokens
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Server runs at http://localhost:3000 with proxy to backend at http://localhost:8000

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Adding shadcn/ui Components

Use the shadcn/ui CLI to add components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
# etc.
```

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

## Architecture Patterns

### Component Structure
- **Index.tsx**: High-level orchestration + QueryClientProvider
- **elements/**: Low-level UI components with business logic
- **ONE API call per component**: Split multiple calls into separate components

### State Management Strategy
| Use Case | Solution |
|----------|----------|
| Server State | @tanstack/react-query |
| Local UI State | useState |
| Global App State | Zustand |
| Form State | React Hook Form |
| URL State | React Router searchParams |

### Performance Guidelines
1. Avoid premature memoization (React Compiler handles it)
2. Use `useTransition` for non-urgent updates
3. Lazy load heavy components with `React.lazy()`
4. Virtual scrolling for lists >100 items
5. React Flow: Only update changed nodes

## Code Quality

### TypeScript Rules
- Strict mode enabled
- No unused variables/parameters
- No implicit returns
- Checked indexed access

### ESLint Rules
- React 19 best practices
- TypeScript recommended rules
- React Hooks rules enforced

### Prettier Configuration
- Print width: 80 characters
- Tab width: 2 spaces
- Double quotes for strings
- Trailing commas (ES5)

## API Integration

All API calls use axios with the base URL configured in vite.config.ts proxy.

Example:

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function WorkflowList() {
  const { data, isPending, error } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => fetch('/api/workflows').then(res => res.json())
  });

  if (isPending) return <WorkflowListSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid gap-4">
      {data.workflows.map(workflow => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
}
```

## Dark Mode

Dark mode is built-in and uses the `class` strategy. Toggle with:

```typescript
document.documentElement.classList.toggle('dark');
```

## Contributing

1. Follow the existing code structure
2. Use TypeScript strict mode
3. Add proper types for all props and functions
4. Test responsive design (mobile 375px, tablet 768px, desktop 1024px+)
5. Run `npm run lint` and `npm run format` before committing

## License

Proprietary - Kaizen Studio
