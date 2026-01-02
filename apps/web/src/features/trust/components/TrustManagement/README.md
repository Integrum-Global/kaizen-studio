# Trust Management Components

Phase 2 implementation of the Enterprise Agent Trust Protocol (EATP) Frontend - Trust establishment and management forms.

## Components

### EstablishTrustForm

Main form component for establishing initial trust for an agent with comprehensive validation and user-friendly interface.

**Features:**

- Agent ID validation (UUID format)
- Authority selection with searchable dropdown
- Capability management with templates
- Constraint editor with drag-to-reorder
- Expiration date picker
- Metadata key-value editor
- Form validation using React Hook Form + Zod

**Usage:**

```tsx
import { EstablishTrustForm } from "@/features/trust";

function TrustManagementPage() {
  const handleSuccess = (trustChain: TrustChain) => {
    console.log("Trust established:", trustChain);
    // Navigate to trust chain view, etc.
  };

  return (
    <EstablishTrustForm
      onSuccess={handleSuccess}
      onCancel={() => navigate(-1)}
    />
  );
}
```

### AuthoritySelector

Searchable dropdown component for selecting organizational authorities with type badges and status indicators.

**Features:**

- Search authorities by name
- Authority type badges (ORG, SYS, USER)
- Color-coded by type (organization, system, human)
- Inactive authority warning
- Loading state with spinner

**Usage:**

```tsx
import { AuthoritySelector } from "@/features/trust";

function MyForm() {
  const [authorityId, setAuthorityId] = useState("");

  return (
    <AuthoritySelector
      value={authorityId}
      onValueChange={setAuthorityId}
      error={errors.authorityId?.message}
    />
  );
}
```

### CapabilityEditor

Component for managing agent capabilities with template gallery and per-capability constraints.

**Features:**

- Predefined capability templates:
  - Read Access (access:read:\*)
  - Write Access (access:write:\*)
  - Execute Action (action:execute:\*)
  - Query Database (action:query:database)
  - Delegate Trust (delegation:create:\*)
- Custom capability input
- Per-capability constraint editing
- Capability type badges (ACCESS, ACTION, DELEGATION)
- Add/remove capabilities

**Usage:**

```tsx
import { CapabilityEditor } from "@/features/trust";
import type { CapabilityFormData } from "@/features/trust";

function MyForm() {
  const [capabilities, setCapabilities] = useState<CapabilityFormData[]>([]);

  return (
    <CapabilityEditor
      capabilities={capabilities}
      onChange={setCapabilities}
      error={errors.capabilities?.message}
    />
  );
}
```

### ConstraintEditor

Component for managing constraints with templates, custom input, and priority ordering.

**Features:**

- Constraint templates:
  - Resource Limit (resource_limit:max_tokens:10000)
  - Time Window (time_window:start:09:00,end:17:00)
  - Data Scope (data_scope:org_id:123)
  - Action Restriction (action_restriction:deny:delete)
  - Audit Requirement (audit_requirement:level:high)
- Custom constraint input
- Drag-to-reorder for priority
- Priority indicators (P1, P2, etc.)
- Template preview

**Usage:**

```tsx
import { ConstraintEditor } from "@/features/trust";

function MyForm() {
  const [constraints, setConstraints] = useState<string[]>([]);

  return (
    <ConstraintEditor constraints={constraints} onChange={setConstraints} />
  );
}
```

## Validation Schema

The form uses Zod for validation with the following rules:

```typescript
{
  agentId: string (required, UUID format),
  authorityId: string (required),
  capabilities: array (min 1 capability),
  constraints: array (optional),
  expiresAt: ISO datetime string (optional),
  metadata: record of strings (optional)
}
```

## API Integration

The form uses the `useEstablishTrust` mutation hook which:

1. Calls `POST /api/v1/trust/establish`
2. Invalidates trust chains cache on success
3. Returns the created `TrustChain`

## Form Flow

1. User enters Agent ID (validated as UUID)
2. User selects Authority from dropdown
3. User adds capabilities:
   - Click template card to add predefined capability
   - OR click "Add Custom Capability" for custom URI
   - Click settings icon to add per-capability constraints
4. User adds global constraints (optional):
   - Select from template dropdown
   - OR enter custom constraint
   - Drag to reorder priority
5. User sets expiration date (optional)
6. User adds metadata fields (optional)
7. User clicks "Establish Trust"
8. Form validates and submits
9. Success: `onSuccess` callback with `TrustChain`
10. Error: Toast notification with error details

## Testing

Basic test coverage included in `__tests__/EstablishTrustForm.test.tsx`:

```bash
npm run test -- EstablishTrustForm
```

## Dependencies

- react-hook-form: Form state management
- zod: Schema validation
- @hookform/resolvers/zod: Zod integration with react-hook-form
- date-fns: Date formatting
- lucide-react: Icons
- @tanstack/react-query: API state management

## File Structure

```
TrustManagement/
├── EstablishTrustForm/
│   ├── index.tsx          # Main form component
│   └── schema.ts          # Zod validation schemas
├── AuthoritySelector/
│   └── index.tsx          # Authority dropdown
├── CapabilityEditor/
│   └── index.tsx          # Capability management
├── ConstraintEditor/
│   └── index.tsx          # Constraint management
├── __tests__/
│   └── EstablishTrustForm.test.tsx
└── README.md              # This file
```

## Future Enhancements

- [ ] Agent ID autocomplete from registry
- [ ] Capability URI validation against known patterns
- [ ] Constraint syntax highlighting
- [ ] Import/export form data as JSON
- [ ] Capability templates from backend
- [ ] Preview trust chain before submission
- [ ] Batch trust establishment
- [ ] Trust templates (save/load entire configurations)
