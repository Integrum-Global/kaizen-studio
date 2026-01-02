# Authority Management Components

Complete UI implementation for managing authorities in the Enterprise Agent Trust Protocol (EATP).

## Quick Start

```tsx
import { AuthorityManager } from "@/features/trust/components/AuthorityManagement";

// Drop-in authority management interface
export function AuthoritiesPage() {
  return <AuthorityManager />;
}
```

## Components

### 1. AuthorityManager
Main authority management interface with list, filters, search, and dialogs.

**Features**:
- Responsive grid (1/2/3 columns)
- Real-time search
- Type and status filters
- Multi-criteria sorting
- Create/Edit/Deactivate actions
- Detail view navigation
- Empty states with CTAs

### 2. AuthorityCard
Individual authority card for list display.

**Features**:
- Type-specific icons and colors
- Status badges
- Agent count
- Certificate hash preview
- Quick actions menu
- Click to view details

### 3. AuthorityDetailView
Full detail view with tabbed interface.

**Tabs**:
- **Overview**: Metadata, IDs, certificates, timestamps
- **Agents**: List of agents established by authority
- **Activity**: Timeline (placeholder)
- **Settings**: Advanced config (placeholder)

### 4. CreateAuthorityDialog
Modal form for creating new authorities.

**Fields**:
- Name (required)
- Type (ORGANIZATION/SYSTEM/HUMAN)
- Description (optional)
- Parent Authority ID (optional)

### 5. EditAuthorityDialog
Modal form for editing existing authorities.

**Fields**:
- Name
- Description
- Active Status (toggle)

### 6. DeactivateAuthorityDialog
Confirmation dialog for deactivating authorities.

**Features**:
- Impact warning
- Affected agents count
- Reason field (required for audit)
- Confirmation flow

## Hooks

Located in `/src/features/trust/hooks/authority.ts`:

```tsx
// List with filters
const { data, isPending } = useAuthoritiesFiltered({
  type: AuthorityType.ORGANIZATION,
  isActive: true,
  search: "acme",
  sortBy: "name",
  sortOrder: "asc",
});

// Get single authority
const { data: authority } = useAuthorityById(id);

// Create authority
const { mutate: create } = useCreateAuthority();

// Update authority
const { mutate: update } = useUpdateAuthority();

// Deactivate authority
const { mutate: deactivate } = useDeactivateAuthority();

// Get authority agents
const { data: agents } = useAuthorityAgents(id);
```

## Types

Located in `/src/features/trust/types/authority.ts`:

```tsx
import { AuthorityType } from "@/features/trust/types";

// Authority object
type Authority = {
  id: string;
  name: string;
  type: AuthorityType; // "organization" | "system" | "human"
  description?: string;
  parentAuthorityId?: string;
  isActive: boolean;
  agentCount: number;
  certificateHash?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};

// Create input
type CreateAuthorityInput = {
  name: string;
  type: AuthorityType;
  description?: string;
  parentAuthorityId?: string;
};

// Update input
type UpdateAuthorityInput = {
  name?: string;
  description?: string;
  isActive?: boolean;
};

// Filter options
type AuthorityFilters = {
  type?: AuthorityType;
  isActive?: boolean;
  search?: string;
  sortBy?: "name" | "createdAt" | "agentCount";
  sortOrder?: "asc" | "desc";
};
```

## API Endpoints

Backend must implement:

```
GET    /api/v1/trust/authorities/ui              # List with filters
GET    /api/v1/trust/authorities/ui/:id          # Get single
POST   /api/v1/trust/authorities                 # Create
PATCH  /api/v1/trust/authorities/:id             # Update
POST   /api/v1/trust/authorities/:id/deactivate  # Deactivate
GET    /api/v1/trust/authorities/:id/agents      # Get agents
```

## Usage Examples

### Example 1: Basic Usage

```tsx
import { AuthorityManager } from "@/features/trust/components/AuthorityManagement";

export function AuthoritiesPage() {
  return (
    <div className="container mx-auto p-6">
      <AuthorityManager />
    </div>
  );
}
```

### Example 2: Custom Layout with Individual Components

```tsx
import { useState } from "react";
import {
  AuthorityCard,
  CreateAuthorityDialog,
} from "@/features/trust/components/AuthorityManagement";
import { useAuthoritiesFiltered } from "@/features/trust/hooks";
import type { Authority } from "@/features/trust/types";

export function CustomAuthoritiesView() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: authorities } = useAuthoritiesFiltered({
    isActive: true,
    sortBy: "name",
    sortOrder: "asc",
  });

  return (
    <div className="space-y-6">
      <button onClick={() => setCreateOpen(true)}>
        Create Authority
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {authorities?.map((authority) => (
          <AuthorityCard
            key={authority.id}
            authority={authority}
            onEdit={(auth) => console.log("Edit", auth)}
            onDeactivate={(auth) => console.log("Deactivate", auth)}
            onViewDetails={(auth) => console.log("View", auth)}
          />
        ))}
      </div>

      <CreateAuthorityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
```

### Example 3: Using Hooks Directly

```tsx
import { useCreateAuthority } from "@/features/trust/hooks";
import { AuthorityType } from "@/features/trust/types";
import { useToast } from "@/hooks/use-toast";

export function CreateAuthorityButton() {
  const { toast } = useToast();
  const { mutate: createAuthority, isPending } = useCreateAuthority();

  const handleCreate = () => {
    createAuthority(
      {
        name: "My Organization",
        type: AuthorityType.ORGANIZATION,
        description: "Main organizational authority",
      },
      {
        onSuccess: (authority) => {
          toast({
            title: "Success",
            description: `Created authority: ${authority.name}`,
          });
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? "Creating..." : "Create Authority"}
    </button>
  );
}
```

### Example 4: Detail View with Edit

```tsx
import { useState } from "react";
import {
  AuthorityDetailView,
  EditAuthorityDialog,
} from "@/features/trust/components/AuthorityManagement";
import type { Authority } from "@/features/trust/types";

export function AuthorityDetailPage({ authorityId }: { authorityId: string }) {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(
    null
  );

  return (
    <>
      <AuthorityDetailView
        authorityId={authorityId}
        onEdit={(authority) => {
          setSelectedAuthority(authority);
          setEditOpen(true);
        }}
      />

      <EditAuthorityDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        authority={selectedAuthority}
      />
    </>
  );
}
```

## Styling & Theming

All components use Shadcn/ui and support dark mode automatically.

**Type-specific colors**:
- **Organization**: Blue theme
- **System**: Purple theme
- **Human**: Green theme

**Status colors**:
- **Active**: Green
- **Inactive**: Gray

## Responsive Behavior

- **Mobile (< 768px)**: Single column
- **Tablet (768px - 1024px)**: Two columns
- **Desktop (> 1024px)**: Three columns

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management in dialogs
- Screen reader friendly

## Performance

- React Query caching
- Optimistic updates
- Skeleton loaders
- Proper memoization
- Efficient re-renders

## Error Handling

- Toast notifications for all actions
- Detailed error messages
- Graceful degradation
- Empty states

## Testing (To Be Implemented)

Tests not included per requirements. Recommended test coverage:

- Unit tests for hooks
- Component rendering tests
- User interaction tests
- API integration tests
- E2E workflows

## Roadmap / Future Enhancements

1. Certificate upload/management
2. Activity timeline with real data
3. Advanced settings panel
4. Parent authority dropdown selector
5. Bulk operations
6. Visual trust hierarchy
7. Authority metrics/analytics
8. Export functionality

## Dependencies

- React 18+
- @tanstack/react-query
- react-hook-form
- zod
- lucide-react
- date-fns
- Shadcn/ui components

## File Structure

```
/src/features/trust/
├── components/
│   └── AuthorityManagement/
│       ├── AuthorityManager.tsx          # Main interface
│       ├── AuthorityCard.tsx             # List item
│       ├── AuthorityDetailView.tsx       # Detail page
│       ├── CreateAuthorityDialog.tsx     # Create form
│       ├── EditAuthorityDialog.tsx       # Edit form
│       ├── DeactivateAuthorityDialog.tsx # Deactivate confirmation
│       ├── index.ts                      # Barrel exports
│       ├── USAGE_EXAMPLE.tsx             # Usage examples
│       ├── README.md                     # This file
│       └── IMPLEMENTATION_SUMMARY.md     # Technical summary
├── hooks/
│   ├── authority.ts                      # Authority hooks
│   ├── index.ts                          # Hook exports
│   └── useAuthorities.ts                 # Additional hooks
├── types/
│   ├── authority.ts                      # Authority types
│   └── index.ts                          # Type exports
└── api/
    └── index.ts                          # API client functions
```

## Troubleshooting

### Components not rendering
- Ensure React Query `QueryClientProvider` is set up
- Check API endpoint configuration
- Verify environment variables

### Type errors
- Update TypeScript to latest version
- Check import paths are correct
- Ensure all types are exported

### Styling issues
- Verify Tailwind CSS is configured
- Check dark mode setup
- Ensure Shadcn/ui is properly installed

## Support

For questions or issues:
1. Check IMPLEMENTATION_SUMMARY.md for technical details
2. Review USAGE_EXAMPLE.tsx for implementation patterns
3. Consult the main EATP documentation

## License

Part of Kaizen Studio - Enterprise Agent Trust Protocol implementation.
