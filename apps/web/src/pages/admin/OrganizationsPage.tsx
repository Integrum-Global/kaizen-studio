import { OrganizationList } from "@/features/organizations";

export function OrganizationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-1">
          Manage tenants and organizations across the platform
        </p>
      </div>

      {/* Organization List */}
      <OrganizationList />
    </div>
  );
}
