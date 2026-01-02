# Design System

**Date**: 2025-12-11
**Status**: Planning

---

## Overview

This document defines the design system for Kaizen Studio, based on:
- **agentic_platform**: Comprehensive design tokens (WCAG 2.1 AA compliant)
- **kailash_workflow_studio**: Shadcn/ui integration patterns
- **Enterprise requirements**: Professional, accessible, themeable

---

## Design Tokens

### Color System

```css
/* styles/tokens.css */

:root {
  /* ============================================
     PRIMARY COLORS
     Brand identity - Kaizen blue
     ============================================ */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;  /* Main brand color */
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  /* ============================================
     SECONDARY COLORS
     Supporting accent - Slate
     ============================================ */
  --color-secondary-50: #f8fafc;
  --color-secondary-100: #f1f5f9;
  --color-secondary-200: #e2e8f0;
  --color-secondary-300: #cbd5e1;
  --color-secondary-400: #94a3b8;
  --color-secondary-500: #64748b;
  --color-secondary-600: #475569;
  --color-secondary-700: #334155;
  --color-secondary-800: #1e293b;
  --color-secondary-900: #0f172a;
  --color-secondary-950: #020617;

  /* ============================================
     SEMANTIC COLORS
     Success, Warning, Error, Info
     ============================================ */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;

  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;

  --color-error-50: #fef2f2;
  --color-error-100: #fee2e2;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  --color-error-700: #b91c1c;

  --color-info-50: #eff6ff;
  --color-info-100: #dbeafe;
  --color-info-500: #3b82f6;
  --color-info-600: #2563eb;
  --color-info-700: #1d4ed8;

  /* ============================================
     NEUTRAL COLORS
     Backgrounds, borders, text
     ============================================ */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f4f4f5;
  --color-neutral-200: #e4e4e7;
  --color-neutral-300: #d4d4d8;
  --color-neutral-400: #a1a1aa;
  --color-neutral-500: #71717a;
  --color-neutral-600: #52525b;
  --color-neutral-700: #3f3f46;
  --color-neutral-800: #27272a;
  --color-neutral-900: #18181b;
  --color-neutral-950: #09090b;

  /* ============================================
     NODE COLORS (Pipeline Canvas)
     Each node type has distinct color
     ============================================ */
  --color-node-agent: #3b82f6;        /* Blue */
  --color-node-supervisor: #8b5cf6;   /* Purple */
  --color-node-router: #f59e0b;       /* Amber */
  --color-node-synthesizer: #10b981;  /* Emerald */
  --color-node-connector: #6366f1;    /* Indigo */
  --color-node-tool: #ec4899;         /* Pink */

  /* ============================================
     LIGHT THEME (Default)
     ============================================ */
  --background: var(--color-neutral-0);
  --foreground: var(--color-neutral-900);
  --card: var(--color-neutral-0);
  --card-foreground: var(--color-neutral-900);
  --popover: var(--color-neutral-0);
  --popover-foreground: var(--color-neutral-900);
  --primary: var(--color-primary-600);
  --primary-foreground: var(--color-neutral-0);
  --secondary: var(--color-secondary-100);
  --secondary-foreground: var(--color-secondary-900);
  --muted: var(--color-neutral-100);
  --muted-foreground: var(--color-neutral-500);
  --accent: var(--color-primary-100);
  --accent-foreground: var(--color-primary-900);
  --destructive: var(--color-error-600);
  --destructive-foreground: var(--color-neutral-0);
  --border: var(--color-neutral-200);
  --input: var(--color-neutral-200);
  --ring: var(--color-primary-500);
}

/* ============================================
   DARK THEME
   ============================================ */
.dark {
  --background: var(--color-neutral-950);
  --foreground: var(--color-neutral-50);
  --card: var(--color-neutral-900);
  --card-foreground: var(--color-neutral-50);
  --popover: var(--color-neutral-900);
  --popover-foreground: var(--color-neutral-50);
  --primary: var(--color-primary-500);
  --primary-foreground: var(--color-neutral-900);
  --secondary: var(--color-secondary-800);
  --secondary-foreground: var(--color-secondary-100);
  --muted: var(--color-neutral-800);
  --muted-foreground: var(--color-neutral-400);
  --accent: var(--color-primary-900);
  --accent-foreground: var(--color-primary-100);
  --destructive: var(--color-error-500);
  --destructive-foreground: var(--color-neutral-50);
  --border: var(--color-neutral-800);
  --input: var(--color-neutral-800);
  --ring: var(--color-primary-400);
}
```

### Typography

```css
/* Typography tokens */
:root {
  /* Font families */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font sizes (based on 1rem = 16px) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Letter spacing */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
}
```

### Spacing

```css
/* Spacing tokens (4px base) */
:root {
  --spacing-0: 0;
  --spacing-1: 0.25rem;    /* 4px */
  --spacing-2: 0.5rem;     /* 8px */
  --spacing-3: 0.75rem;    /* 12px */
  --spacing-4: 1rem;       /* 16px */
  --spacing-5: 1.25rem;    /* 20px */
  --spacing-6: 1.5rem;     /* 24px */
  --spacing-8: 2rem;       /* 32px */
  --spacing-10: 2.5rem;    /* 40px */
  --spacing-12: 3rem;      /* 48px */
  --spacing-16: 4rem;      /* 64px */
  --spacing-20: 5rem;      /* 80px */
  --spacing-24: 6rem;      /* 96px */
}
```

### Borders & Shadows

```css
/* Border radius */
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-full: 9999px;
}

/* Shadows */
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

/* Transitions */
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## Component Library

### Button

```typescript
// components/ui/button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-md px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### Input

```typescript
// components/ui/input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

### Card

```typescript
// components/ui/card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### Status Badge

```typescript
// components/shared/StatusBadge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        active: 'bg-success-100 text-success-700',
        inactive: 'bg-neutral-100 text-neutral-600',
        pending: 'bg-warning-100 text-warning-700',
        error: 'bg-error-100 text-error-700',
        deployed: 'bg-primary-100 text-primary-700',
        draft: 'bg-secondary-100 text-secondary-700',
      },
    },
    defaultVariants: {
      status: 'inactive',
    },
  }
)

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  children?: React.ReactNode
}

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  const statusLabels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    error: 'Error',
    deployed: 'Deployed',
    draft: 'Draft',
  }

  return (
    <span className={cn(badgeVariants({ status }), className)}>
      {children || statusLabels[status || 'inactive']}
    </span>
  )
}
```

### Empty State

```typescript
// components/shared/EmptyState.tsx
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

### Loading State

```typescript
// components/shared/LoadingState.tsx
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
```

---

## Pipeline Node Components

### Base Node

```typescript
// features/pipelines/components/nodes/BaseNode.tsx
import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

export interface BaseNodeData {
  label: string
  description?: string
  status?: 'idle' | 'running' | 'success' | 'error'
}

interface BaseNodeProps extends NodeProps<BaseNodeData> {
  color: string
  icon: React.ReactNode
}

export const BaseNode = memo(function BaseNode({
  data,
  selected,
  color,
  icon,
}: BaseNodeProps) {
  const statusColors = {
    idle: 'border-neutral-300',
    running: 'border-primary-500 animate-pulse',
    success: 'border-success-500',
    error: 'border-error-500',
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-card shadow-md min-w-[180px]',
        statusColors[data.status || 'idle'],
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Header with icon and color accent */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-md"
        style={{ backgroundColor: `${color}20` }}
      >
        <div
          className="flex items-center justify-center w-6 h-6 rounded"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <span className="font-medium text-sm truncate">{data.label}</span>
      </div>

      {/* Description */}
      {data.description && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {data.description}
        </div>
      )}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-neutral-400 border-2 border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-neutral-400 border-2 border-background"
      />
    </div>
  )
})
```

### Agent Node

```typescript
// features/pipelines/components/nodes/AgentNode.tsx
import { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import { Bot } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

interface AgentNodeData extends BaseNodeData {
  provider?: string
  model?: string
}

export const AgentNode = memo(function AgentNode(props: NodeProps<AgentNodeData>) {
  return (
    <BaseNode
      {...props}
      color="var(--color-node-agent)"
      icon={<Bot className="w-4 h-4 text-white" />}
    />
  )
})
```

### Supervisor Node

```typescript
// features/pipelines/components/nodes/SupervisorNode.tsx
import { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import { Users } from 'lucide-react'
import { BaseNode, BaseNodeData } from './BaseNode'

interface SupervisorNodeData extends BaseNodeData {
  strategy?: 'round-robin' | 'load-balanced' | 'priority'
  workers?: string[]
}

export const SupervisorNode = memo(function SupervisorNode(props: NodeProps<SupervisorNodeData>) {
  return (
    <BaseNode
      {...props}
      color="var(--color-node-supervisor)"
      icon={<Users className="w-4 h-4 text-white" />}
    />
  )
})
```

### Router Node

```typescript
// features/pipelines/components/nodes/RouterNode.tsx
import { memo } from 'react'
import { NodeProps, Handle, Position } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RouterNodeData {
  label: string
  routes?: { condition: string; target: string }[]
  status?: 'idle' | 'running' | 'success' | 'error'
}

export const RouterNode = memo(function RouterNode({
  data,
  selected,
}: NodeProps<RouterNodeData>) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-card shadow-md min-w-[200px]',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-md"
        style={{ backgroundColor: 'var(--color-node-router)20' }}
      >
        <div
          className="flex items-center justify-center w-6 h-6 rounded"
          style={{ backgroundColor: 'var(--color-node-router)' }}
        >
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <span className="font-medium text-sm">{data.label}</span>
      </div>

      {/* Routes */}
      <div className="px-3 py-2">
        {data.routes?.map((route, i) => (
          <div key={i} className="flex items-center gap-2 text-xs py-1">
            <span className="text-muted-foreground">{route.condition}</span>
            <span className="text-primary">→ {route.target}</span>
          </div>
        ))}
      </div>

      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-neutral-400 border-2 border-background"
      />

      {/* Multiple output handles (bottom) */}
      {data.routes?.map((_, i) => (
        <Handle
          key={i}
          type="source"
          position={Position.Bottom}
          id={`route-${i}`}
          className="w-3 h-3 bg-neutral-400 border-2 border-background"
          style={{
            left: `${((i + 1) / (data.routes!.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  )
})
```

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## Utility Functions

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(date))
}

export function formatNumber(num: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', options).format(num)
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
```

---

## Icon Usage

```typescript
// Use Lucide React for all icons
import {
  // Navigation
  Home,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,

  // Actions
  Plus,
  Trash2,
  Edit,
  Copy,
  Download,
  Upload,
  Search,

  // Status
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,

  // Domain-specific
  Bot,           // Agents
  Workflow,      // Pipelines
  Rocket,        // Deploy
  Shield,        // Governance
  BarChart3,     // Metrics
  Users,         // Teams
  Key,           // API Keys
  Webhook,       // Webhooks
  GitBranch,     // Router
  Combine,       // Synthesizer
  Plug,          // Connector
} from 'lucide-react'

// Icon sizing convention
// sm: w-4 h-4
// md: w-5 h-5
// lg: w-6 h-6
// xl: w-8 h-8
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [02-architecture.md](02-architecture.md) | Component hierarchy |
| [04-state-management.md](04-state-management.md) | State patterns |
| [06-workflow-canvas.md](06-workflow-canvas.md) | Pipeline nodes |
