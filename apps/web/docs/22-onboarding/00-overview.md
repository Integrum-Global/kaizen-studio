# Onboarding & Help System

The onboarding system provides guided tours, contextual hints, progress checklists, and help resources for new and existing users.

## Feature Location

```
src/features/onboarding/
├── types/
│   └── onboarding.ts          # Type definitions
├── hooks/
│   └── useOnboarding.ts       # Main onboarding hook
├── store/
│   └── onboarding.ts          # Zustand store with persistence
├── components/
│   ├── WelcomeDialog.tsx      # First-time welcome
│   ├── OnboardingTooltip.tsx  # Contextual hints
│   ├── OnboardingChecklist.tsx # Progress checklist
│   ├── HelpButton.tsx         # Floating help button
│   └── TourOverlay.tsx        # Guided tour overlay
└── index.ts                   # Barrel exports
```

## Types

### OnboardingStep

```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;           // CSS selector for highlight
  position?: Position;       // Tooltip position
  action?: OnboardingAction;
}

interface OnboardingTour {
  id: string;
  name: string;
  steps: OnboardingStep[];
}
```

### OnboardingChecklist

```typescript
interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  href?: string;
}

interface OnboardingChecklist {
  id: string;
  title: string;
  steps: ChecklistItem[];
}
```

## Hooks

### useOnboarding

Main hook for onboarding state management.

```tsx
import { useOnboarding } from '@/features/onboarding';

function MyComponent() {
  const {
    // Tour navigation
    currentStep,
    nextStep,
    previousStep,
    skipTour,

    // Progress tracking
    completedSteps,
    markStepComplete,

    // Hints
    dismissHint,
    isHintDismissed,

    // State
    hasCompletedOnboarding,
    resetOnboarding,
  } = useOnboarding();
}
```

## Components

### WelcomeDialog

First-time user welcome dialog.

```tsx
import { WelcomeDialog } from '@/features/onboarding';

const tour: OnboardingTour = {
  id: 'getting-started',
  name: 'Getting Started',
  steps: [
    { id: '1', title: 'Create Agent', description: 'Start by creating your first AI agent.' },
    { id: '2', title: 'Build Pipeline', description: 'Connect agents in a workflow.' },
    { id: '3', title: 'Test & Deploy', description: 'Test your pipeline and deploy it.' },
  ],
};

<WelcomeDialog tour={tour} />
```

Features:
- Shows only on first visit (persisted)
- Option to start tour
- Option to skip
- Customizable content

### OnboardingTooltip

Contextual hints attached to UI elements.

```tsx
import { OnboardingTooltip } from '@/features/onboarding';

const hint: OnboardingHint = {
  id: 'create-agent-hint',
  title: 'Create Your First Agent',
  description: 'Click here to start building your AI agent.',
  showOnce: true,
};

<OnboardingTooltip hint={hint} autoShow delay={500}>
  <Button>Create Agent</Button>
</OnboardingTooltip>
```

Props:
- `hint`: OnboardingHint
- `autoShow`: boolean (default: true)
- `delay`: number (ms before showing, default: 500)
- `children`: Element to attach tooltip to

### OnboardingChecklist

Progress checklist with visual completion tracking.

```tsx
import { OnboardingChecklist } from '@/features/onboarding';

const checklist: OnboardingChecklist = {
  id: 'getting-started',
  title: 'Getting Started',
  steps: [
    { id: 'create-agent', label: 'Create your first agent', completed: true, href: '/agents/new' },
    { id: 'build-pipeline', label: 'Build a pipeline', completed: false, href: '/pipelines/new' },
    { id: 'test-pipeline', label: 'Test your pipeline', completed: false },
    { id: 'deploy', label: 'Deploy to production', completed: false },
    { id: 'invite-team', label: 'Invite team members', completed: false, href: '/team' },
  ],
};

<OnboardingChecklist checklist={checklist} onDismiss={() => setDismissed(true)} />
```

Features:
- Checkbox indicators
- Progress percentage
- Clickable links
- Dismiss button

### HelpButton

Floating help button with expandable panel.

```tsx
import { HelpButton } from '@/features/onboarding';

// Floating (bottom-right)
<HelpButton variant="floating" />

// Fixed position
<HelpButton variant="fixed" />

// Inline
<HelpButton variant="inline" />
```

Panel contents:
- Documentation links
- Quick start guide
- Keyboard shortcuts link
- Contact support

### TourOverlay

Full-screen guided tour with step-by-step navigation.

```tsx
import { TourOverlay } from '@/features/onboarding';

<TourOverlay
  tour={tour}
  onComplete={() => markTourComplete()}
  onSkip={() => dismissTour()}
/>
```

Features:
- Highlights target element
- Shows step instructions
- Navigation (Previous/Next/Skip)
- Step progress indicator
- Keyboard navigation (Arrow keys, Escape)

## Store

The onboarding store persists to localStorage:

```typescript
interface OnboardingState {
  hasSeenWelcome: boolean;
  completedTours: string[];
  completedSteps: string[];
  dismissedHints: string[];
  checklistProgress: Record<string, boolean>;
}
```

Access store directly if needed:

```tsx
import { useOnboardingStore } from '@/store';

function MyComponent() {
  const hasSeenWelcome = useOnboardingStore((state) => state.hasSeenWelcome);
}
```

## Integration Example

```tsx
import {
  WelcomeDialog,
  TourOverlay,
  OnboardingChecklist,
  HelpButton,
  OnboardingTooltip,
} from '@/features/onboarding';

function App() {
  const gettingStartedTour = { /* ... */ };
  const checklist = { /* ... */ };

  return (
    <>
      {/* Welcome on first visit */}
      <WelcomeDialog tour={gettingStartedTour} />

      {/* Guided tour */}
      <TourOverlay tour={gettingStartedTour} />

      {/* Main app */}
      <Layout>
        {/* Contextual hint */}
        <OnboardingTooltip hint={createAgentHint}>
          <Button>Create Agent</Button>
        </OnboardingTooltip>

        {/* Progress checklist */}
        <Sidebar>
          <OnboardingChecklist checklist={checklist} />
        </Sidebar>
      </Layout>

      {/* Floating help */}
      <HelpButton variant="floating" />
    </>
  );
}
```

## Best Practices

1. **Don't overwhelm users** - Show hints one at a time
2. **Allow dismissal** - Always let users skip or dismiss
3. **Persist progress** - State is saved in localStorage
4. **Make it optional** - Power users can skip everything
5. **Keep tours short** - 5-7 steps maximum
6. **Provide context** - Hints should be relevant to current page

## Testing

The onboarding feature has comprehensive test coverage:

```
src/features/onboarding/__tests__/
├── useOnboarding.test.ts         # Main hook (tests)
├── WelcomeDialog.test.tsx        # Welcome dialog (tests)
├── OnboardingChecklist.test.tsx  # Checklist component (tests)
├── OnboardingTooltip.test.tsx    # Tooltip component (20 tests)
├── HelpButton.test.tsx           # Help button (37 tests)
└── TourOverlay.test.tsx          # Tour overlay (36 tests)
```

Run tests:
```bash
npm run test src/features/onboarding
```
