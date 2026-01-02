# Users Feature

Complete user management feature for Kaizen Studio frontend.

## Structure

```
users/
├── types/
│   └── user.ts              # Type definitions
├── api/
│   └── users.ts             # API client functions
├── hooks/
│   └── useUsers.ts          # React Query hooks
├── components/
│   ├── UserCard.tsx         # User display card
│   ├── UserList.tsx         # User list with filters
│   ├── UserDialog.tsx       # Create/edit dialog
│   ├── UserForm.tsx         # User form component
│   ├── UserRoleBadge.tsx    # Role badge display
│   └── index.ts             # Component exports
└── index.ts                 # Feature barrel exports
```

## Types

### UserRole

- `org_owner` - Organization owner
- `org_admin` - Administrator
- `developer` - Developer
- `viewer` - Viewer (read-only)

### UserStatus

- `active` - Active user
- `suspended` - Suspended user
- `deleted` - Soft-deleted user

### User Interface

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

## API Functions

Located in `api/users.ts`:

- `getAll(filters?)` - Get all users with optional filters
- `getById(id)` - Get user by ID
- `getCurrentUser()` - Get current user profile
- `create(input)` - Create a new user
- `update(id, input)` - Update user
- `delete(id)` - Delete user (soft delete)

## Hooks

Located in `hooks/useUsers.ts`:

### Query Hooks

- `useUsers(filters?)` - List users with filters
- `useUser(id)` - Get single user
- `useCurrentUser()` - Get current user profile

### Mutation Hooks

- `useCreateUser()` - Create user
- `useUpdateUser()` - Update user
- `useDeleteUser()` - Delete user

## Components

### UserList

Main list component with filtering and CRUD operations.

```tsx
import { UserList } from "@/features/users";

function UsersPage() {
  return <UserList />;
}
```

Features:

- Role filter (Owner, Admin, Developer, Viewer)
- Status filter (Active, Suspended)
- Create button (admin only)
- Edit/Delete actions (with permissions)
- Loading skeletons
- Empty states
- Responsive grid layout

### UserCard

Display component for individual users.

```tsx
import { UserCard } from "@/features/users";

<UserCard
  user={user}
  onEdit={handleEdit}
  onDelete={handleDelete}
  canEdit={isAdmin || isSelf}
  canDelete={isAdmin && !isSelf}
/>;
```

Features:

- Avatar with initials
- Role badge with color coding
- Status badge
- MFA indicator
- Edit/Delete dropdown
- Created/Last login dates

### UserDialog

Create/edit dialog with form validation.

```tsx
import { UserDialog } from "@/features/users";

<UserDialog
  user={selectedUser} // Optional - omit for create mode
  open={isOpen}
  onOpenChange={setIsOpen}
/>;
```

Features:

- Create/Edit modes
- Form validation
- Loading states
- Error handling with toasts
- Auto-closes on success

### UserForm

Reusable form component.

```tsx
import { UserForm } from "@/features/users";

<UserForm
  user={user} // Optional - omit for create mode
  onSubmit={handleSubmit}
  isPending={isLoading}
  mode="create" // or "edit"
/>;
```

Features:

- Create mode: email, name, password, role
- Edit mode: name, email, role, status, MFA toggle
- React Hook Form validation
- Responsive layout

### UserRoleBadge

Simple badge for displaying roles.

```tsx
import { UserRoleBadge } from "@/features/users";

<UserRoleBadge role={user.role} />;
```

## Permissions

The feature respects backend permissions:

### Create User

- Only `org_owner` and `org_admin` can create users
- Cannot create `org_owner` users

### Update User

- Users can update themselves (name, email, MFA)
- Admins can update any user
- Only admins can change role/status

### Delete User

- Only `org_owner` and `org_admin` can delete
- Cannot delete yourself
- Cannot delete `org_owner`

## Usage Example

```tsx
import { UserList } from "@/features/users";

export function UsersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage your organization's users
        </p>
      </div>
      <UserList />
    </div>
  );
}
```

## API Integration

The feature uses `@/api/index.ts` (apiClient) for all API calls. The apiClient includes:

- Automatic JWT token attachment
- Token refresh on 401 errors
- Error handling
- TypeScript types

## Query Key Management

Uses centralized query keys from `@/lib/queryKeys.ts`:

- `queryKeys.users.lists()` - All user lists
- `queryKeys.users.list(filters)` - Specific filtered list
- `queryKeys.users.detail(id)` - Individual user
- `queryKeys.auth.current()` - Current user profile

## Styling

All components use Shadcn UI components with Tailwind CSS:

- Responsive design (mobile/tablet/desktop)
- Dark mode support
- Consistent spacing and typography
- Accessible components

## Error Handling

All mutations include error handling with toast notifications:

- Success toasts on create/update/delete
- Error toasts with backend error messages
- Automatic query invalidation on success
