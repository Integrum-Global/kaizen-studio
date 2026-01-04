# Kaizen Studio Frontend Documentation

## Directory Structure

| Directory | Description |
|-----------|-------------|
| [00-getting-started](./00-getting-started/) | Setup, installation, and initial configuration |
| [01-architecture](./01-architecture/) | Project structure and architectural decisions |
| [02-components](./02-components/) | UI component library and design system |
| [03-state-management](./03-state-management/) | Zustand stores and React Query patterns |
| [04-authentication](./04-authentication/) | Auth flows, SSO, and protected routes |
| [05-testing](./05-testing/) | Testing strategies (unit, integration) |
| [06-agents](./06-agents/) | Agent management feature |
| [07-pipelines](./07-pipelines/) | Pipeline editor and canvas |
| [08-execution](./08-execution/) | Workflow execution and monitoring |
| [09-teams](./09-teams/) | Team management |
| [10-api-keys](./10-api-keys/) | API key management |
| [11-audit](./11-audit/) | Audit logging |
| [12-settings](./12-settings/) | Application settings |
| [13-metrics](./13-metrics/) | Metrics visualization |
| [14-analytics](./14-analytics/) | Analytics dashboard |
| [15-alerts](./15-alerts/) | Alert management |
| [16-health](./16-health/) | Health monitoring |
| [17-gateways](./17-gateways/) | Gateway management |
| [18-governance](./18-governance/) | RBAC/ABAC governance |
| [19-billing](./19-billing/) | Billing and subscriptions |
| [20-responsive](./20-responsive/) | Responsive design system |
| [21-shortcuts](./21-shortcuts/) | Keyboard shortcuts |
| [22-onboarding](./22-onboarding/) | Onboarding and help |
| [23-e2e-testing](./23-e2e-testing/) | End-to-end testing with Playwright |
| [24-pages](./24-pages/) | Page components and routing |
| [25-connectors](./25-connectors/) | External service connectors |
| [26-webhooks](./26-webhooks/) | Webhook management |
| [27-users](./27-users/) | User management |
| [28-agents-testing](./28-agents-testing/) | Agents feature testing |
| [29-pipelines-testing](./29-pipelines-testing/) | Pipelines feature testing |
| [30-performance](./30-performance/) | Performance optimization |
| [31-accessibility](./31-accessibility/) | WCAG 2.1 accessibility utilities |
| [32-help](./32-help/) | In-app help system |
| [33-responsive](./33-responsive/) | Responsive utilities and hooks |
| [34-errors](./34-errors/) | Error handling and error boundary patterns |
| [35-loading](./35-loading/) | Skeleton loading components |
| [36-toast](./36-toast/) | Toast notifications with variants |
| [37-deployment](./37-deployment/) | Docker, Kubernetes, and static hosting |
| [38-performance](./38-performance/) | Web Vitals monitoring and metrics |
| [44-work-units](./44-work-units/) | Work units feature with creation wizard |

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Type check:
   ```bash
   npm run type-check
   ```

## Tech Stack

- **Framework**: React 19 + TypeScript 5.8
- **Build**: Vite 6
- **State**: Zustand + React Query
- **UI**: shadcn/ui + Tailwind CSS
- **Testing**: Vitest + Playwright
- **Routing**: React Router v6

## Feature Architecture

Each feature follows this structure:

```
src/features/{feature}/
├── types/          # TypeScript types
├── api/            # API functions
├── hooks/          # Custom hooks
├── components/     # React components
│   └── __tests__/  # Component tests
└── index.ts        # Public exports
```

## Key Patterns

- **Server State**: Use React Query for API data
- **Client State**: Use Zustand for UI/local state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS utility classes
- **Testing**: Vitest for unit, Playwright for E2E
