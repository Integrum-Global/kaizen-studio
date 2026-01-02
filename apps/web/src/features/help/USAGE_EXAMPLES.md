# Help Feature Usage Examples

## Basic Integration

### Add to Layout

```tsx
// src/components/layout/MainLayout.tsx
import { HelpDialog, HelpTrigger } from "@/features/help";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <nav className="flex items-center justify-between p-4">
          <h1>Kaizen Studio</h1>
          <div className="flex items-center gap-4">
            {/* Other nav items */}
            <HelpTrigger />
          </div>
        </nav>
      </header>

      <main>{children}</main>

      {/* Place HelpDialog at root level */}
      <HelpDialog />
    </div>
  );
}
```

### Add to App.tsx

```tsx
// src/App.tsx
import { HelpDialog, HelpTrigger } from "@/features/help";
import { Dashboard } from "./pages/Dashboard";

function App() {
  return (
    <>
      <div className="app">
        <header>
          <HelpTrigger variant="ghost" size="icon" />
        </header>
        <Dashboard />
      </div>
      <HelpDialog />
    </>
  );
}

export default App;
```

## Advanced Usage

### Open Specific Article

```tsx
// src/pages/agents/CreateAgent.tsx
import { useHelp } from "@/features/help";
import { Button } from "@/components/ui";

export function CreateAgent() {
  const { openHelp } = useHelp();

  return (
    <div>
      <h1>Create New Agent</h1>

      <Button
        variant="outline"
        onClick={() => openHelp("getting-started-first-agent")}
      >
        Need help? Learn how to create your first agent
      </Button>

      {/* Agent form */}
    </div>
  );
}
```

### Show Contextual Help

```tsx
// src/pages/pipelines/PipelineCanvas.tsx
import { useHelp } from "@/features/help";
import { InfoIcon } from "lucide-react";

export function PipelineCanvas() {
  const { openHelp } = useHelp();

  return (
    <div className="pipeline-canvas">
      <div className="toolbar">
        <button
          onClick={() => openHelp("pipelines-node-types")}
          className="help-button"
        >
          <InfoIcon className="h-4 w-4" />
          Node Types
        </button>

        <button
          onClick={() => openHelp("pipelines-connecting-nodes")}
          className="help-button"
        >
          <InfoIcon className="h-4 w-4" />
          Connecting Nodes
        </button>
      </div>

      {/* Canvas content */}
    </div>
  );
}
```

### Custom Help Trigger

```tsx
// src/components/CustomHelpButton.tsx
import { useHelp } from "@/features/help";
import { HelpCircle } from "lucide-react";

export function CustomHelpButton({ articleId }: { articleId?: string }) {
  const { openHelp } = useHelp();

  return (
    <button
      onClick={() => openHelp(articleId)}
      className="rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600"
      title="Get Help"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
```

### Recent Articles Display

```tsx
// src/pages/Dashboard.tsx
import { useHelp, useHelpArticle } from "@/features/help";

export function Dashboard() {
  const { recentArticles, openHelp } = useHelp();

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h3>Recently Viewed Help</h3>
        <ul>
          {recentArticles.map((articleId) => {
            const { article } = useHelpArticle(articleId);
            return article ? (
              <li key={articleId}>
                <button onClick={() => openHelp(articleId)}>
                  {article.title}
                </button>
              </li>
            ) : null;
          })}
        </ul>
      </aside>

      {/* Dashboard content */}
    </div>
  );
}
```

### Search-Specific Category

```tsx
// src/pages/Troubleshooting.tsx
import { useHelp } from "@/features/help";
import { Button } from "@/components/ui";

export function Troubleshooting() {
  const { openHelp, setSelectedCategory } = useHelp();

  const openTroubleshootingHelp = () => {
    setSelectedCategory("troubleshooting");
    openHelp();
  };

  return (
    <div>
      <h1>Troubleshooting</h1>
      <Button onClick={openTroubleshootingHelp}>
        View Troubleshooting Guides
      </Button>
    </div>
  );
}
```

### Inline Help Tooltip

```tsx
// src/components/FormFieldWithHelp.tsx
import { useHelp } from "@/features/help";
import { HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

interface FormFieldWithHelpProps {
  label: string;
  helpArticleId: string;
  children: React.ReactNode;
}

export function FormFieldWithHelp({
  label,
  helpArticleId,
  children,
}: FormFieldWithHelpProps) {
  const { openHelp } = useHelp();

  return (
    <div className="form-field">
      <label className="flex items-center gap-2">
        {label}
        <Tooltip content="Click for detailed help">
          <button
            type="button"
            onClick={() => openHelp(helpArticleId)}
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </Tooltip>
      </label>
      {children}
    </div>
  );
}
```

### Error Page with Help

```tsx
// src/pages/ErrorPage.tsx
import { useHelp } from "@/features/help";
import { Button } from "@/components/ui";

export function ErrorPage({ error }: { error: Error }) {
  const { openHelp } = useHelp();

  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>

      <div className="actions">
        <Button
          variant="outline"
          onClick={() => openHelp("troubleshooting-common-errors")}
        >
          View Common Errors
        </Button>
        <Button variant="outline" onClick={() => openHelp()}>
          Browse Help Center
        </Button>
      </div>
    </div>
  );
}
```

## Testing Examples

### Test Component with Help

```tsx
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useHelpStore } from "@/features/help";
import { MyComponent } from "../MyComponent";

describe("MyComponent", () => {
  beforeEach(() => {
    useHelpStore.setState({
      isOpen: false,
      searchQuery: "",
      selectedCategory: "all",
      selectedArticleId: null,
      recentArticles: [],
    });
  });

  it("should open help when help button is clicked", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const helpButton = screen.getByRole("button", { name: /help/i });
    await user.click(helpButton);

    expect(useHelpStore.getState().isOpen).toBe(true);
  });
});
```

### Mock Help Store in Tests

```tsx
// src/test/helpers/mockHelpStore.ts
import { useHelpStore } from "@/features/help";

export function mockHelpStore(overrides = {}) {
  useHelpStore.setState({
    isOpen: false,
    searchQuery: "",
    selectedCategory: "all",
    selectedArticleId: null,
    recentArticles: [],
    ...overrides,
  });
}

export function resetHelpStore() {
  mockHelpStore();
}
```

## Keyboard Shortcuts

Users can press **F1** anywhere in the app to toggle the help dialog.

```tsx
// Already handled by HelpDialog component
// No additional setup needed
```

## Styling Customization

### Custom Trigger Button

```tsx
import { useHelp } from "@/features/help";

function CustomTrigger() {
  const { openHelp } = useHelp();

  return (
    <button onClick={() => openHelp()} className="your-custom-classes">
      Help & Support
    </button>
  );
}
```

### Themed Help Dialog

The HelpDialog uses shadcn/ui components, so it automatically adapts to your theme (light/dark mode).

## Performance Tips

1. **Lazy Load**: HelpDialog is already optimized to only render when open
2. **Article Memoization**: useHelpSearch memoizes results
3. **Store Persistence**: Only recent articles are persisted to localStorage

## Common Patterns

### Feature-Specific Help Sections

```tsx
// src/features/agents/components/AgentHelp.tsx
import { useHelp } from "@/features/help";

export function AgentHelp() {
  const { openHelp } = useHelp();

  const agentArticles = [
    { id: "agents-configuration", label: "Configuration" },
    { id: "agents-tools", label: "Using Tools" },
  ];

  return (
    <div className="help-section">
      <h3>Agent Help</h3>
      <ul>
        {agentArticles.map((article) => (
          <li key={article.id}>
            <button onClick={() => openHelp(article.id)}>
              {article.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Onboarding Flow with Help

```tsx
// src/features/onboarding/OnboardingWizard.tsx
import { useHelp } from "@/features/help";
import { useEffect } from "react";

export function OnboardingWizard() {
  const { openHelp, setSelectedCategory } = useHelp();

  useEffect(() => {
    // Open getting started help on first load
    setSelectedCategory("getting-started");
    openHelp("getting-started-first-agent");
  }, []);

  return <div className="onboarding-wizard">{/* Wizard steps */}</div>;
}
```
