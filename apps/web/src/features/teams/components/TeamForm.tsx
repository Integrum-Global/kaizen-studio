import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label, Textarea } from "@/components/ui";
import type { CreateTeamInput, UpdateTeamInput } from "../types";

const teamFormSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  initialData?: UpdateTeamInput;
  onSubmit: (data: CreateTeamInput | UpdateTeamInput) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: "create" | "update";
}

export function TeamForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
}: TeamFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  const handleFormSubmit = (data: TeamFormData) => {
    if (mode === "create") {
      const createInput: CreateTeamInput = {
        name: data.name,
        description: data.description || undefined,
      };
      onSubmit(createInput);
    } else {
      const updateInput: UpdateTeamInput = {
        name: data.name,
        description: data.description || undefined,
      };
      onSubmit(updateInput);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Team Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Team Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Engineering Team"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe the purpose of this team..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Create Team"
              : "Update Team"}
        </Button>
      </div>
    </form>
  );
}
