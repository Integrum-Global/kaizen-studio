import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Calendar, Pencil } from "lucide-react";
import { useState } from "react";
import {
  useTeam,
  TeamMembersEditor,
  TeamDialog,
} from "@/features/teams";

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: team, isLoading, error } = useTeam(teamId || "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/teams")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Team not found</h3>
            <p className="text-muted-foreground text-center">
              The team you're looking for doesn't exist or you don't have access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/teams")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
            {team.description && (
              <p className="text-muted-foreground mt-1">{team.description}</p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Team
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Team Name</p>
              <p className="font-medium">{team.name}</p>
            </div>
            {team.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{team.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created
              </p>
              <p className="font-medium">
                {new Date(team.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="font-medium">{team.members?.length || 0} members</p>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Editor */}
        <div className="lg:col-span-2">
          <TeamMembersEditor
            teamId={team.id}
            members={team.members || []}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <TeamDialog
        team={team}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}
