import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { UserForm } from "./UserForm";
import { useCreateUser, useUpdateUser } from "../hooks";
import type { User, CreateUserRequest, UpdateUserRequest } from "../types";
import { useToast } from "@/hooks/use-toast";

interface UserDialogProps {
  user?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const isEdit = !!user;

  const handleSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
    try {
      if (isEdit) {
        await updateUser.mutateAsync({
          id: user.id,
          input: data as UpdateUserRequest,
        });
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        await createUser.mutateAsync(data as CreateUserRequest);
        toast({
          title: "Success",
          description: "User created successfully",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save user",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!open) {
      createUser.reset();
      updateUser.reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update user details and permissions"
              : "Add a new user to your organization"}
          </DialogDescription>
        </DialogHeader>

        <UserForm
          user={user}
          onSubmit={handleSubmit}
          isPending={createUser.isPending || updateUser.isPending}
          mode={isEdit ? "edit" : "create"}
        />
      </DialogContent>
    </Dialog>
  );
}
