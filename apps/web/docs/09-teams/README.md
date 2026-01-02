# Team Management

The Teams feature provides a complete team and member management system for Kaizen Studio organizations.

## Overview

Teams allow organizations to group users for collaborative work on agents, pipelines, and deployments. The feature includes:

- Team creation and management
- Member invitations and role assignments
- Resource permissions per team
- Team activity tracking

## Feature Structure

```
src/features/teams/
├── api.ts                 # API layer with teamsApi
├── hooks.ts               # React Query hooks
├── types.ts               # TypeScript interfaces
├── index.ts               # Barrel export
└── components/
    ├── TeamList.tsx       # Main list view
    ├── TeamCard.tsx       # Individual team card
    ├── TeamDialog.tsx     # Create/edit dialog
    ├── TeamForm.tsx       # Form component
    ├── MemberList.tsx     # Team members table
    └── __tests__/         # Component tests
```

## Types

```typescript
interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: TeamRole;
  joinedAt: string;
}

type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
```

## API Layer

```typescript
import { teamsApi } from '@/features/teams';

// List teams
const teams = await teamsApi.getAll({ page: 1, pageSize: 10 });

// Create team
const newTeam = await teamsApi.create({
  name: 'Engineering',
  description: 'Engineering team',
});

// Get team members
const members = await teamsApi.getMembers(teamId);

// Add member
await teamsApi.addMember(teamId, {
  email: 'user@example.com',
  role: 'member',
});

// Update member role
await teamsApi.updateMember(teamId, memberId, { role: 'admin' });

// Remove member
await teamsApi.removeMember(teamId, memberId);
```

## Hooks

```typescript
import {
  useTeams,
  useTeam,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useTeamMembers,
  useAddMember,
  useUpdateMember,
  useRemoveMember,
} from '@/features/teams';

// List teams with filters
const { data, isPending, error } = useTeams({ search: 'eng' });

// Single team
const { data: team } = useTeam(teamId);

// Mutations
const createTeam = useCreateTeam();
await createTeam.mutateAsync({ name: 'Marketing' });

// Team members
const { data: members } = useTeamMembers(teamId);
```

## Components

### TeamList

Main view displaying all teams in a grid layout with search and pagination.

```tsx
import { TeamList } from '@/features/teams';

function TeamsPage() {
  return <TeamList />;
}
```

### TeamDialog

Modal for creating or editing teams.

```tsx
import { TeamDialog } from '@/features/teams';

function CreateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Team</Button>
      <TeamDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### MemberList

Table component for managing team members.

```tsx
import { MemberList } from '@/features/teams';

function TeamMembers({ teamId }: { teamId: string }) {
  return <MemberList teamId={teamId} />;
}
```

## Testing

The feature includes 20 tests covering:

- Loading and error states
- Team CRUD operations
- Member management
- Form validation
- Search and pagination

Run tests:

```bash
npm run test -- teams
```

## Related Features

- [Authentication](../04-authentication/README.md) - User sessions
- [Audit Logs](../11-audit/README.md) - Team activity tracking
