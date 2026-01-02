import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, UserMinus, Search, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRoleMembers, useRemoveRoleMember } from "../hooks";
import type { Role, RoleMember } from "../types";

interface RoleMembersProps {
  role: Role;
  onAddMember?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RoleMembers({ role, onAddMember }: RoleMembersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<RoleMember | null>(null);

  const { data: members, isLoading } = useRoleMembers(role.id);
  const removeMember = useRemoveRoleMember();

  const handleRemove = async () => {
    if (!removeConfirm) return;
    try {
      await removeMember.mutateAsync({
        roleId: role.id,
        userId: removeConfirm.userId,
      });
      setRemoveConfirm(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const filteredMembers = members?.filter(
    (m) =>
      m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {role.name} Members
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {members?.length || 0} members assigned to this role
            </p>
          </div>
          {!role.isSystem && (
            <Button onClick={onAddMember}>
              <UserPlus className="h-4 w-4 mr-1" />
              Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {!filteredMembers || filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No members match your search"
                    : "No members assigned to this role"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(member.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.userEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Assigned</p>
                        <p>{formatDate(member.assignedAt)}</p>
                      </div>
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveConfirm(member)}
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!removeConfirm}
        onOpenChange={(open) => !open && setRemoveConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeConfirm?.userName} from the{" "}
              {role.name} role?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
