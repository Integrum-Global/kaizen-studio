# Users Feature

User management for organization members.

## Feature Location

```
src/features/users/
├── types/
│   └── user.ts              # Type definitions
├── api/
│   └── users.ts             # API functions
├── hooks/
│   └── useUsers.ts          # React Query hooks
├── components/
│   ├── UserCard.tsx         # User display card
│   ├── UserList.tsx         # List with filtering
│   ├── UserDialog.tsx       # Create/edit modal
│   ├── UserForm.tsx         # Form with validation
│   ├── UserRoleBadge.tsx    # Role badge component
│   └── __tests__/           # Component tests
└── index.ts                 # Barrel exports
```

## Types

### UserRole

```typescript
type UserRole = "org_owner" | "org_admin" | "developer" | "viewer";
```

### UserStatus

```typescript
type UserStatus = "active" | "suspended" | "deleted";
```

### User

```typescript
interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  status: UserStatus;
  role: UserRole;
  mfa_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}
```

## Hooks

### useUsers

```tsx
import { useUsers } from "@/features/users";

function MyComponent() {
  const { data, isPending, error } = useUsers({
    status: "active",
    role: "developer",
  });

  if (isPending) return <Loading />;
  return <UserList users={data.records} />;
}
```

### useCreateUser

```tsx
import { useCreateUser } from "@/features/users";

function CreateForm() {
  const createUser = useCreateUser();

  const handleSubmit = async (data) => {
    await createUser.mutateAsync({
      name: "John Doe",
      email: "john@example.com",
      password: "securePassword123",
      role: "developer",
    });
  };
}
```

### useUpdateUser

```tsx
import { useUpdateUser } from "@/features/users";

function EditForm({ userId }) {
  const updateUser = useUpdateUser();

  const handleSubmit = async (data) => {
    await updateUser.mutateAsync({
      id: userId,
      data: {
        role: "org_admin",
        status: "active",
      },
    });
  };
}
```

## Components

### UserList

Main list with filtering and pagination.

```tsx
import { UserList } from "@/features/users";

<UserList />
```

Features:
- Role filter dropdown
- Status filter dropdown
- Pagination
- Empty state
- Loading skeletons
- Card grid layout

### UserCard

Individual user display.

```tsx
import { UserCard } from "@/features/users";

<UserCard
  user={user}
  onEdit={(u) => openEditDialog(u)}
  onDelete={(id) => deleteUser(id)}
/>
```

### UserDialog

Create/edit modal.

```tsx
import { UserDialog } from "@/features/users";

<UserDialog
  mode="create"
  open={isOpen}
  onOpenChange={setIsOpen}
/>

<UserDialog
  mode="edit"
  user={selectedUser}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### UserRoleBadge

Role badge with styling.

```tsx
import { UserRoleBadge } from "@/features/users";

<UserRoleBadge role="org_admin" />
// Renders: Badge with "Admin" text
```

Role display mappings:
- `org_owner` → "Owner" (default variant)
- `org_admin` → "Admin" (default variant)
- `developer` → "Developer" (secondary variant)
- `viewer` → "Viewer" (outline variant)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users | List users |
| GET | /api/v1/users/:id | Get user |
| POST | /api/v1/users | Create user |
| PUT | /api/v1/users/:id | Update user |
| DELETE | /api/v1/users/:id | Delete user |

## Usage Example

```tsx
import {
  UserList,
  UserDialog,
  useUsers,
} from "@/features/users";

function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1>Users</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          Add User
        </Button>
      </div>

      <UserList />

      <UserDialog
        mode="create"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
```

## Role Permissions

| Role | Description |
|------|-------------|
| org_owner | Full access to all organization resources |
| org_admin | Administrative access, can manage users |
| developer | Can create and manage agents/pipelines |
| viewer | Read-only access to organization resources |
