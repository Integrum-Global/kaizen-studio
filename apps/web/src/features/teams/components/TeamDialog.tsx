import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { TeamForm } from "./TeamForm";
import { useCreateTeam, useUpdateTeam } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type { Team, CreateTeamInput, UpdateTeamInput } from "../types";

interface TeamDialogProps {
  team?: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamDialog({ team, open, onOpenChange }: TeamDialogProps) {
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const { toast } = useToast();

  const handleSubmit = async (data: CreateTeamInput | UpdateTeamInput) => {
    try {
      if (team) {
        await updateTeam.mutateAsync({
          id: team.id,
          input: data as UpdateTeamInput,
        });
        toast({
          title: "Success",
          description: "Team updated successfully",
        });
      } else {
        await createTeam.mutateAsync(data as CreateTeamInput);
        toast({
          title: "Success",
          description: "Team created successfully",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to save team",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team ? "Edit Team" : "Create New Team"}</DialogTitle>
          <DialogDescription>
            {team
              ? "Update the team information"
              : "Create a new team for your organization"}
          </DialogDescription>
        </DialogHeader>
        <TeamForm
          initialData={
            team
              ? {
                  name: team.name,
                  description: team.description,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createTeam.isPending || updateTeam.isPending}
          mode={team ? "update" : "create"}
        />
      </DialogContent>
    </Dialog>
  );
}
