# Help System

Comprehensive in-app help system with search, categories, and keyboard shortcuts.

## Components

### HelpDialog

Main help modal with search and category navigation:

```tsx
import { HelpDialog } from "@/features/help";

function App() {
  return (
    <>
      <MainContent />
      <HelpDialog />
    </>
  );
}
```

Features:
- Search with fuzzy matching
- Category tabs (All, Getting Started, Agents, Pipelines, Deployments, Admin, Troubleshooting)
- Recent articles tracking
- Markdown content rendering
- Keyboard navigation (F1 to toggle, Escape to close)

### HelpTrigger

Button to open help dialog:

```tsx
import { HelpTrigger } from "@/features/help";

<header>
  <nav>...</nav>
  <HelpTrigger />
</header>
```

Props:
- `variant` - Button variant ('ghost' | 'outline'), default 'ghost'
- `size` - Button size ('sm' | 'default'), default 'sm'

### HelpSearchInput

Search input with keyboard hint:

```tsx
import { HelpSearchInput } from "@/features/help";

<HelpSearchInput
  value={query}
  onChange={setQuery}
  placeholder="Search help..."
/>
```

Props:
- `value` - Search query
- `onChange` - Change handler
- `placeholder` - Input placeholder

### HelpCategoryNav

Category navigation tabs:

```tsx
import { HelpCategoryNav } from "@/features/help";

<HelpCategoryNav
  value={category}
  onChange={setCategory}
/>
```

Categories:
- `all` - All articles
- `getting-started` - Onboarding content
- `agents` - Agent configuration
- `pipelines` - Pipeline building
- `deployments` - Deployment guides
- `admin` - Administration
- `troubleshooting` - Common issues

### HelpArticleList

Display list of articles:

```tsx
import { HelpArticleList } from "@/features/help";

<HelpArticleList
  articles={filteredArticles}
  onSelect={handleSelect}
/>
```

### HelpArticleView

Render single article with markdown:

```tsx
import { HelpArticleView } from "@/features/help";

<HelpArticleView
  article={selectedArticle}
  onBack={handleBack}
/>
```

## Hooks

### useHelp

Access help store state:

```tsx
import { useHelp } from "@/features/help";

function HelpButton() {
  const { isOpen, openHelp, closeHelp, recentArticles } = useHelp();

  return (
    <button onClick={() => openHelp()}>
      Help ({recentArticles.length} recent)
    </button>
  );
}
```

Returns:
- `isOpen` - Dialog open state
- `openHelp(articleId?)` - Open dialog, optionally to specific article
- `closeHelp()` - Close dialog
- `recentArticles` - Last 5 viewed articles
- `searchQuery` - Current search query
- `setSearchQuery` - Update search

### useHelpSearch

Search articles with fuzzy matching:

```tsx
import { useHelpSearch } from "@/features/help";

function SearchResults() {
  const results = useHelpSearch("pipeline");

  return (
    <ul>
      {results.map(({ article, score }) => (
        <li key={article.id}>
          {article.title} (score: {score})
        </li>
      ))}
    </ul>
  );
}
```

Scoring algorithm:
- Title match: 10 points
- Keywords match: 5 points
- Category match: 3 points
- Content match: 2 points

### useHelpArticle

Get article by ID:

```tsx
import { useHelpArticle } from "@/features/help";

function ArticlePage({ id }: { id: string }) {
  const article = useHelpArticle(id);

  if (!article) {
    return <NotFound />;
  }

  return <HelpArticleView article={article} />;
}
```

## Store

Zustand store with persistence:

```tsx
import { useHelpStore } from "@/features/help";

// State
interface HelpState {
  isOpen: boolean;
  searchQuery: string;
  selectedArticleId: string | null;
  recentArticles: string[];
}

// Actions
openHelp(articleId?: string): void
closeHelp(): void
setSearchQuery(query: string): void
selectArticle(id: string): void
clearSelection(): void
addRecentArticle(id: string): void
```

Persistence:
- Recent articles saved to localStorage
- Max 5 recent articles tracked

## Sample Articles

Included help articles:

| ID | Title | Category |
|----|-------|----------|
| getting-started-first-agent | Creating Your First Agent | Getting Started |
| getting-started-pipeline | Building Your First Pipeline | Getting Started |
| agents-configuration | Agent Configuration Guide | Agents |
| agents-tools | Using Tools with Agents | Agents |
| pipelines-node-types | Pipeline Node Types | Pipelines |
| pipelines-connecting | Connecting Pipeline Nodes | Pipelines |
| deployments-production | Deploying to Production | Deployments |
| troubleshooting-common | Common Errors and Solutions | Troubleshooting |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F1 | Toggle help dialog |
| Escape | Close dialog or go back |
| Arrow keys | Navigate articles |
| Enter | Select article |

## Integration

Add to AppShell:

```tsx
import { HelpDialog, HelpTrigger } from "@/features/help";

function AppShell() {
  return (
    <div>
      <header>
        <nav>...</nav>
        <div className="flex items-center gap-2">
          <HelpTrigger />
          <UserMenu />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <HelpDialog />
    </div>
  );
}
```

## Testing

Test utilities:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelpDialog } from "@/features/help";

describe("HelpDialog", () => {
  it("should open on F1 key", () => {
    render(<HelpDialog />);

    fireEvent.keyDown(window, { key: "F1" });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should search articles", async () => {
    render(<HelpDialog />);
    fireEvent.keyDown(window, { key: "F1" });

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "agent" } });

    expect(screen.getByText(/agent configuration/i)).toBeInTheDocument();
  });
});
```

## Adding Custom Articles

Extend the articles data:

```tsx
// src/features/help/data/articles.ts
import { HelpArticle } from "../types";

export const helpArticles: HelpArticle[] = [
  // ... existing articles
  {
    id: "custom-article",
    title: "Custom Help Article",
    category: "getting-started",
    keywords: ["custom", "example"],
    content: `
# Custom Article

Your markdown content here.

## Section 1

- Point 1
- Point 2

\`\`\`tsx
const example = "code";
\`\`\`
    `,
  },
];
```
