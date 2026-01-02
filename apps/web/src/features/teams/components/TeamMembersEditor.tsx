import { useState, useMemo } from "react";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
} from "@/components/ui";
import {
  useAddTeamMember,
  useRemoveTeamMember,
  useUpdateTeamMemberRole,
} from "../hooks";
import { useUsers } from "@/features/users/hooks";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, UserCircle, Users } from "lucide-react";
import type { TeamMember, TeamRole } from "../types";
import type { User } from "@/features/users/types";

interface TeamMembersEditorProps {
  teamId: string;
  members: TeamMember[];
}

export function TeamMembersEditor({ teamId, members }: TeamMembersEditorProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState<TeamRole>("member");

  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const updateMemberRole = useUpdateTeamMemberRole();
  const { toast } = useToast();

  // Fetch all users from the organization
  const { data: usersData, isPending: usersLoading } = useUsers({ limit: 100 });

  // Filter out users who are already team members
  const availableUsers = useMemo(() => {
    if (!usersData?.records) return [];
    const memberUserIds = new Set(members.map((m) => m.user_id));
    return usersData.records.filter((user) => !memberUserIds.has(user.id));
  }, [usersData?.records, members]);

  // Create a map for quick user lookup
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    usersData?.records?.forEach((user) => map.set(user.id, user));
    return map;
  }, [usersData?.records]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    try {
      await addMember.mutateAsync({
        teamId,
        input: {
          user_id: selectedUserId,
          role: newUserRole,
        },
      });
      toast({
        title: "Success",
        description: "Member added successfully",
      });
      setSelectedUserId("");
      setNewUserRole("member");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to add member",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      await removeMember.mutateAsync({ teamId, userId });
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, role: TeamRole) => {
    try {
      await updateMemberRole.mutateAsync({
        teamId,
        userId,
        input: { role },
      });
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Member Form */}
        <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
          <h4 className="text-sm font-medium">Add Member</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">Select User</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={usersLoading}
              >
                <SelectTrigger id="userId">
                  <SelectValue
                    placeholder={
                      usersLoading ? "Loading users..." : "Select a user"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="py-2 px-2 text-sm text-muted-foreground">
                      {usersLoading
                        ? "Loading..."
                        : "No available users to add"}
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({user.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUserRole}
                onValueChange={(value) => setNewUserRole(value as TeamRole)}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="team_lead">Team Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleAddMember}
            disabled={addMember.isPending || !selectedUserId}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {addMember.isPending ? "Adding..." : "Add Member"}
          </Button>
        </div>

        {/* Members List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Members</h4>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserCircle className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No members yet. Add members to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const user = userMap.get(member.user_id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 border rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user ? getInitials(user.name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.name || member.user_id}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email ||
                            `Added ${new Date(member.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(member.user_id, value as TeamRole)
                        }
                        disabled={updateMemberRole.isPending}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="team_lead">Team Lead</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
