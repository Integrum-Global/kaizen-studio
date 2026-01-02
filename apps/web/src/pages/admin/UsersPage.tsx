import { UserList } from "@/features/users";
import { ResponsiveContainer } from "@/components/layout";

export function UsersPage() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <UserList />
    </ResponsiveContainer>
  );
}
