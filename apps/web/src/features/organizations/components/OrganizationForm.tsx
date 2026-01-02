import { useForm } from "react-hook-form";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  PlanTier,
  OrganizationStatus,
} from "../types";

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: CreateOrganizationInput | UpdateOrganizationInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  slug: string;
  plan_tier: PlanTier;
  status?: OrganizationStatus;
}

export function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
  isLoading,
}: OrganizationFormProps) {
  const isEdit = !!organization;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: organization?.name || "",
      slug: organization?.slug || "",
      plan_tier: organization?.plan_tier || "free",
      status: organization?.status || "active",
    },
  });

  const handleFormSubmit = (data: FormData) => {
    if (isEdit) {
      const updateData: UpdateOrganizationInput = {};
      if (data.name !== organization.name) updateData.name = data.name;
      if (data.slug !== organization.slug) updateData.slug = data.slug;
      if (data.plan_tier !== organization.plan_tier)
        updateData.plan_tier = data.plan_tier;
      if (data.status !== organization.status) updateData.status = data.status;
      onSubmit(updateData);
    } else {
      onSubmit({
        name: data.name,
        slug: data.slug,
        plan_tier: data.plan_tier,
      });
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEdit || organization?.slug === "") {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            {...register("name", { required: "Name is required" })}
            onChange={(e) => {
              register("name").onChange(e);
              handleNameChange(e);
            }}
            placeholder="Acme Corporation"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            {...register("slug", {
              required: "Slug is required",
              pattern: {
                value: /^[a-z0-9-]+$/,
                message: "Slug must be lowercase letters, numbers, and hyphens",
              },
            })}
            placeholder="acme-corp"
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            URL-friendly identifier (lowercase letters, numbers, hyphens only)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plan_tier">Plan</Label>
          <Select
            value={watch("plan_tier")}
            onValueChange={(value) => setValue("plan_tier", value as PlanTier)}
          >
            <SelectTrigger id="plan_tier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue("status", value as OrganizationStatus)
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Changes"
              : "Create Organization"}
        </Button>
      </div>
    </form>
  );
}
