/**
 * InviteMemberDialog
 *
 * Dialog for inviting members to a workspace with role selection.
 * Shows a searchable list of users and allows role assignment.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Badge import removed - not currently used
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Search,
  Users,
  Crown,
  Shield,
  User,
  Eye,
  Check,
} from 'lucide-react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAddWorkspaceMember } from '../hooks';
import type { WorkspaceMember, WorkspaceMemberRole } from '../types';
import { cn } from '@/lib/utils';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  /** Members already in the workspace - to filter them out */
  existingMembers: WorkspaceMember[];
}

const ROLE_OPTIONS: Array<{
  value: WorkspaceMemberRole;
  label: string;
  description: string;
  icon: typeof Crown;
}> = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can manage members and work units',
    icon: Shield,
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Can run work units',
    icon: User,
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access',
    icon: Eye,
  },
];

interface UserOption {
  id: string;
  name: string;
  email: string;
  department?: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  existingMembers,
}: InviteMemberDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<WorkspaceMemberRole>('member');

  // Fetch users for search
  const { data: usersData, isLoading } = useUsers({ search });

  // Add member mutation
  const addMember = useAddWorkspaceMember();

  // Filter out users already in workspace
  const existingUserIds = useMemo(
    () => new Set(existingMembers.map((m) => m.userId)),
    [existingMembers]
  );

  const availableUsers = useMemo(() => {
    if (!usersData?.records) return [];
    return usersData.records
      .filter((user) => !existingUserIds.has(user.id))
      .map((user) => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        department: undefined, // User type doesn't include department
      }));
  }, [usersData, existingUserIds]);

  // Handle invite
  const handleInvite = async () => {
    if (!selectedUser) return;

    try {
      await addMember.mutateAsync({
        workspaceId,
        userId: selectedUser.id,
        role: selectedRole,
      });
      handleOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearch('');
      setSelectedUser(null);
      setSelectedRole('member');
    }
    onOpenChange(newOpen);
  };

  const isSubmitting = addMember.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg"
        aria-labelledby="invite-member-title"
        aria-describedby="invite-member-description"
      >
        <DialogHeader>
          <DialogTitle id="invite-member-title">Invite Member</DialogTitle>
          <DialogDescription id="invite-member-description">
            Invite a user to &quot;{workspaceName}&quot;.
            They will receive delegated access within this workspace.
          </DialogDescription>
        </DialogHeader>

        {/* User Selection */}
        <div className="space-y-3">
          <Label>Select User</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedUser(null); // Clear selection when searching
              }}
              className="pl-9"
            />
          </div>

          {/* User List */}
          {(search || selectedUser) && (
            <ScrollArea className="h-[160px] border rounded-lg">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                  <Users className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm text-center">
                    {search ? 'No users found' : 'Start typing to search users'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className={cn(
                        'flex items-center gap-3 w-full p-3 text-left transition-colors',
                        selectedUser?.id === user.id
                          ? 'bg-primary/10'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedUser(user)}
                      data-testid={`user-option-${user.id}`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>

                      {selectedUser?.id === user.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {/* Selected User Display */}
          {selectedUser && !search && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {selectedUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                Change
              </Button>
            </div>
          )}
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <Label>Select Role</Label>
          <RadioGroup
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as WorkspaceMemberRole)}
            className="space-y-2"
          >
            {ROLE_OPTIONS.map((role) => {
              const Icon = role.icon;
              return (
                <label
                  key={role.value}
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    selectedRole === role.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <RadioGroupItem value={role.value} />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Trust Note */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p>
            <strong>Note:</strong> Adding a member creates a trust delegation.
            They will receive access to work units within this workspace scope.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!selectedUser || isSubmitting}
          >
            {isSubmitting ? 'Inviting...' : 'Invite Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InviteMemberDialog;
