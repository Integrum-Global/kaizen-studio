# Work Units

Work Units are the fundamental building blocks for defining automatable tasks in Kaizen Studio. They represent discrete pieces of work that can be executed, monitored, and composed into larger workflows.

## Concept

A Work Unit encapsulates:

- **What** the task does (capabilities)
- **Who** can execute it (trust)
- **Where** it belongs (workspace)
- **How** it's configured (parameters)

## Types

### Atomic Work Unit

A self-contained, indivisible task that performs a single operation.

**Use Cases:**
- Extract data from a document
- Validate an input against rules
- Send a notification
- Classify content

### Composite Work Unit

A work unit that orchestrates multiple child work units to accomplish a larger goal.

**Use Cases:**
- End-to-end document processing pipeline
- Multi-step approval workflow
- Data transformation with validation

## User Levels

Work Units are accessed differently based on user level:

| Level | Role | Access |
|-------|------|--------|
| 1 | Task Performer | Run assigned tasks, view status |
| 2 | Process Owner | Create work units, manage workflows |
| 3 | Value Chain Owner | Full control, establish trust directly |

## Feature Structure

```
src/features/work-units/
├── api/              # API functions
├── components/       # React components
│   ├── wizard/       # Creation wizard
│   └── __tests__/    # Component tests
├── hooks/            # React Query hooks
├── types/            # TypeScript types
└── index.ts          # Public exports
```

## Key Components

- **WorkUnitsPage** - Main page with level-aware views
- **WorkUnitCreateWizard** - Multi-step creation flow
- **WorkUnitCard** - Display component for work units
- **TaskList** - Level 1 task performer view

## Related Documentation

- [01-wizard.md](./01-wizard.md) - WorkUnitCreateWizard guide
- [02-types.md](./02-types.md) - Type definitions
