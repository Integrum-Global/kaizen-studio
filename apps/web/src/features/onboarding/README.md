# Onboarding System

A comprehensive help and onboarding system for the Kaizen Studio frontend with guided tours, contextual tooltips, progress checklists, and help resources.

## Features

- **Welcome Dialog**: First-time user welcome with optional tour
- **Guided Tours**: Step-by-step interactive overlays with highlights
- **Contextual Tooltips**: On-demand guidance for UI elements
- **Progress Checklist**: Track onboarding completion
- **Help Panel**: Resources, documentation, and support links
- **Persistent State**: All progress saved to localStorage

## Quick Start

### 1. Welcome Dialog

Show a welcome dialog to first-time users:

```tsx
import { WelcomeDialog } from "@/features/onboarding";

function App() {
  return (
    <>
      <WelcomeDialog />
      {/* Rest of your app */}
    </>
  );
}
```

### 2. Guided Tour

Create an interactive tour with step-by-step guidance:

```tsx
import { TourOverlay } from "@/features/onboarding";
import type { OnboardingTour } from "@/features/onboarding";

const tour: OnboardingTour = {
  id: "getting-started",
  title: "Getting Started Tour",
  description: "Learn the basics of Kaizen Studio",
  steps: [
    {
      id: "step-1",
      title: "Create an Agent",
      description: "Click here to create your first AI agent",
      target: "#create-agent-button", // CSS selector
      position: "bottom",
    },
    {
      id: "step-2",
      title: "Design Canvas",
      description: "Use the visual canvas to build pipelines",
      target: "#pipeline-canvas",
      position: "right",
    },
  ],
};

function Dashboard() {
  return (
    <>
      <TourOverlay tour={tour} />
      <button id="create-agent-button">Create Agent</button>
      <div id="pipeline-canvas">Canvas</div>
    </>
  );
}
```

### 3. Onboarding Checklist

Track user progress through key tasks:

```tsx
import { OnboardingChecklist } from "@/features/onboarding";
import type { OnboardingChecklist as ChecklistType } from "@/features/onboarding";

const checklist: ChecklistType = {
  id: "getting-started",
  title: "Getting Started",
  description: "Complete these steps to get started",
  steps: [
    {
      id: "create-agent",
      label: "Create your first agent",
      completed: false,
      href: "/agents/new",
    },
    {
      id: "build-pipeline",
      label: "Build a pipeline",
      completed: false,
      href: "/pipelines/new",
    },
    {
      id: "deploy",
      label: "Deploy to environment",
      completed: false,
      action: () => console.log("Deploy clicked"),
    },
  ],
};

function Sidebar() {
  return <OnboardingChecklist checklist={checklist} />;
}
```

### 4. Contextual Tooltips

Show helpful hints for specific UI elements:

```tsx
import { OnboardingTooltip } from "@/features/onboarding";
import type { OnboardingHint } from "@/features/onboarding";

const hint: OnboardingHint = {
  id: "agent-designer-hint",
  target: "#agent-designer",
  title: "Agent Designer",
  description: "Design your agent signatures here",
  position: "right",
  showOnce: true,
};

function AgentDesigner() {
  return (
    <OnboardingTooltip hint={hint}>
      <div id="agent-designer">{/* Your component */}</div>
    </OnboardingTooltip>
  );
}
```

### 5. Help Button

Add a floating help button with resources:

```tsx
import { HelpButton } from "@/features/onboarding";

function App() {
  return (
    <>
      {/* Your app */}
      <HelpButton variant="floating" />
    </>
  );
}
```

## Hook Usage

Use the `useOnboarding` hook for advanced control:

```tsx
import { useOnboarding } from "@/features/onboarding";

function MyComponent() {
  const {
    // Tour state
    isTourActive,
    currentStep,
    progress,

    // Tour actions
    start,
    next,
    previous,
    skip,

    // Checklist
    markChecklistItemCompleted,
    isChecklistItemCompleted,
    getChecklistProgress,

    // General
    completeOnboarding,
    resetOnboarding,
  } = useOnboarding({ tour });

  return (
    <div>
      <button onClick={start}>Start Tour</button>
      <p>Progress: {progress}%</p>
    </div>
  );
}
```

## Complete Example

Here's a full example combining multiple features:

```tsx
import { useState } from "react";
import {
  WelcomeDialog,
  TourOverlay,
  OnboardingChecklist,
  OnboardingTooltip,
  HelpButton,
  useOnboarding,
} from "@/features/onboarding";
import type {
  OnboardingTour,
  OnboardingChecklist as ChecklistType,
  OnboardingHint,
} from "@/features/onboarding";

const tour: OnboardingTour = {
  id: "main-tour",
  title: "Getting Started with Kaizen Studio",
  description: "A quick tour of the main features",
  steps: [
    {
      id: "welcome",
      title: "Welcome!",
      description: "Let's explore Kaizen Studio together",
    },
    {
      id: "agents",
      title: "Agent Designer",
      description: "Create and manage your AI agents here",
      target: "#agent-section",
      position: "bottom",
    },
    {
      id: "pipelines",
      title: "Pipeline Canvas",
      description: "Build multi-agent workflows visually",
      target: "#pipeline-section",
      position: "bottom",
    },
  ],
};

const checklist: ChecklistType = {
  id: "getting-started",
  title: "Getting Started",
  description: "Complete these steps to unlock the full potential",
  steps: [
    { id: "agent", label: "Create your first agent", completed: false },
    { id: "pipeline", label: "Build a pipeline", completed: false },
    { id: "test", label: "Test your pipeline", completed: false },
    { id: "deploy", label: "Deploy to production", completed: false },
  ],
};

const hints: OnboardingHint[] = [
  {
    id: "agent-hint",
    target: "#create-agent-btn",
    title: "Create Agent",
    description: "Start by creating your first AI agent",
    position: "right",
    showOnce: true,
  },
];

function App() {
  return (
    <>
      {/* Welcome dialog - shows once on first visit */}
      <WelcomeDialog tour={tour} />

      {/* Guided tour overlay */}
      <TourOverlay tour={tour} />

      {/* Main content */}
      <div className="flex">
        <aside className="w-80 p-4">
          <OnboardingChecklist checklist={checklist} />
        </aside>

        <main className="flex-1">
          <section id="agent-section">
            <OnboardingTooltip hint={hints[0]}>
              <button id="create-agent-btn">Create Agent</button>
            </OnboardingTooltip>
          </section>

          <section id="pipeline-section">{/* Pipeline canvas */}</section>
        </main>
      </div>

      {/* Floating help button */}
      <HelpButton variant="floating" />
    </>
  );
}
```

## Type Definitions

### OnboardingTour

```typescript
interface OnboardingTour {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  autoStart?: boolean;
}
```

### OnboardingStep

```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: "top" | "bottom" | "left" | "right";
  action?: OnboardingAction;
  order?: number;
}
```

### OnboardingChecklist

```typescript
interface OnboardingChecklist {
  id: string;
  title: string;
  description?: string;
  steps: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  href?: string;
  action?: () => void;
}
```

### OnboardingHint

```typescript
interface OnboardingHint {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  showOnce?: boolean;
  priority?: number;
}
```

## Persistence

All onboarding state is automatically persisted to localStorage under the key `kaizen-onboarding-storage`:

- Welcome seen status
- Completed tours
- Completed steps
- Dismissed hints
- Checklist progress
- Onboarding completion status

## Customization

### Custom Tour Positions

Control where tooltips appear relative to highlighted elements:

```tsx
const step: OnboardingStep = {
  id: "custom-position",
  title: "Custom Position",
  description: "This tooltip appears on the left",
  target: "#my-element",
  position: "left", // 'top' | 'bottom' | 'left' | 'right'
};
```

### Custom Actions

Add custom actions to tour steps:

```tsx
const step: OnboardingStep = {
  id: "custom-action",
  title: "Custom Action",
  description: "This step triggers a custom action",
  action: {
    type: "custom",
    payload: { customData: "value" },
  },
};
```

### Programmatic Control

Control tours programmatically:

```tsx
const { start, next, previous, skip, complete } = useOnboarding({ tour });

// Start tour from code
start();

// Navigate
next();
previous();

// End tour
skip(); // Exit without completing
complete(); // Mark as completed
```

## Best Practices

1. **Keep tours short**: 3-5 steps maximum for better engagement
2. **Use clear targets**: Ensure CSS selectors are unique and stable
3. **Test on different screen sizes**: Tours should work on mobile and desktop
4. **Provide skip options**: Always allow users to skip tours
5. **Don't interrupt workflows**: Show hints at appropriate times
6. **Track completion**: Use analytics to see which steps users complete
7. **Update for new features**: Add new tour steps when features change

## Testing

The onboarding system includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test files
npm test useOnboarding.test.ts
npm test WelcomeDialog.test.tsx
npm test OnboardingChecklist.test.tsx
```

## Accessibility

All components follow accessibility best practices:

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader compatibility
- High contrast support

## Migration Guide

If you have an existing onboarding system, here's how to migrate:

1. Replace existing welcome dialogs with `<WelcomeDialog />`
2. Convert tour steps to `OnboardingTour` format
3. Use `useOnboarding` hook instead of custom state management
4. Replace tooltip components with `<OnboardingTooltip />`
5. Update checklist components to use `<OnboardingChecklist />`

## Support

For questions or issues:

- Check the documentation at `/docs`
- Contact support at support@kaizen.ai
- Visit the community forum at https://community.kaizen.ai
