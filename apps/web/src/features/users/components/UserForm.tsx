import { useForm } from "react-hook-form";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Button,
} from "@/components/ui";
import type { User, CreateUserRequest, UpdateUserRequest } from "../types";

interface UserFormProps {
  user?: User;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
  isPending?: boolean;
  mode?: "create" | "edit";
}

type FormData = {
  email: string;
  name: string;
  password?: string;
  role: string;
  status?: string;
  mfa_enabled?: boolean;
};

export function UserForm({
  user,
  onSubmit,
  isPending,
  mode = "create",
}: UserFormProps) {
  const form = useForm<FormData>({
    defaultValues: {
      email: user?.email || "",
      name: user?.name || "",
      password: "",
      role: user?.role || "viewer",
      status: user?.status || "active",
      mfa_enabled: user?.mfa_enabled || false,
    },
  });

  const handleSubmit = (data: FormData) => {
    if (mode === "create") {
      const createData: CreateUserRequest = {
        email: data.email,
        name: data.name,
        password: data.password!,
        role: data.role as any,
      };
      onSubmit(createData);
    } else {
      const updateData: UpdateUserRequest = {};
      if (data.name !== user?.name) updateData.name = data.name;
      if (data.email !== user?.email) updateData.email = data.email;
      if (data.role !== user?.role) updateData.role = data.role as any;
      if (data.status !== user?.status) updateData.status = data.status as any;
      if (data.mfa_enabled !== user?.mfa_enabled)
        updateData.mfa_enabled = data.mfa_enabled;

      onSubmit(updateData);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name *
            </label>
            <Input
              id="name"
              {...form.register("name", {
                required: "Name is required",
                minLength: {
                  value: 1,
                  message: "Name must be at least 1 character",
                },
                maxLength: {
                  value: 100,
                  message: "Name must be at most 100 characters",
                },
              })}
              placeholder="Enter name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              {...form.register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="Enter email"
              disabled={mode === "edit"}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>

        {mode === "create" && (
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password *
            </label>
            <Input
              id="password"
              type="password"
              {...form.register("password", {
                required: mode === "create" ? "Password is required" : false,
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              placeholder="Enter password"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role *
            </label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) => form.setValue("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {mode === "create" && (
                  <>
                    <SelectItem value="org_admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </>
                )}
                {mode === "edit" && (
                  <>
                    {user?.role === "org_owner" && (
                      <SelectItem value="org_owner">Owner</SelectItem>
                    )}
                    <SelectItem value="org_admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {mode === "edit" && (
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status *
              </label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {mode === "edit" && (
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <label htmlFor="mfa_enabled" className="text-sm font-medium">
                Multi-Factor Authentication
              </label>
              <p className="text-sm text-muted-foreground">
                Require MFA for this user
              </p>
            </div>
            <Switch
              id="mfa_enabled"
              checked={form.watch("mfa_enabled")}
              onCheckedChange={(checked) =>
                form.setValue("mfa_enabled", checked)
              }
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Create User"
              : "Update User"}
        </Button>
      </div>
    </form>
  );
}
