import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RoleList } from "./RoleList";
import { RoleEditor } from "./RoleEditor";
import { PolicyList } from "./PolicyList";
import { PolicyEditor } from "./PolicyEditor";
import { RoleMembers } from "./RoleMembers";
import type { Role, Policy } from "../types";

export function GovernanceDashboard() {
  const [activeTab, setActiveTab] = useState("roles");
  const [roleEditorOpen, setRoleEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [viewingRoleMembers, setViewingRoleMembers] = useState<Role | null>(
    null
  );

  const [policyEditorOpen, setPolicyEditorOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | undefined>();

  const handleCreateRole = () => {
    setEditingRole(undefined);
    setRoleEditorOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleEditorOpen(true);
  };

  const handleViewMembers = (role: Role) => {
    setViewingRoleMembers(role);
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(undefined);
    setPolicyEditorOpen(true);
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setPolicyEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="roles">Roles (RBAC)</TabsTrigger>
            <TabsTrigger value="policies">Policies (ABAC)</TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTab === "roles" && !viewingRoleMembers && (
          <Button onClick={handleCreateRole}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        )}
        {activeTab === "policies" && (
          <Button onClick={handleCreatePolicy}>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="roles" className="mt-0">
          {viewingRoleMembers ? (
            <div className="space-y-4">
              <button
                onClick={() => setViewingRoleMembers(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to roles
              </button>
              <RoleMembers role={viewingRoleMembers} />
            </div>
          ) : (
            <RoleList
              onEditRole={handleEditRole}
              onViewMembers={handleViewMembers}
            />
          )}
        </TabsContent>

        <TabsContent value="policies" className="mt-0">
          <PolicyList onEditPolicy={handleEditPolicy} />
        </TabsContent>
      </Tabs>

      <RoleEditor
        role={editingRole}
        open={roleEditorOpen}
        onOpenChange={setRoleEditorOpen}
      />

      <PolicyEditor
        policy={editingPolicy}
        open={policyEditorOpen}
        onOpenChange={setPolicyEditorOpen}
      />
    </div>
  );
}
