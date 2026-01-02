import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { MoreVertical, Trash2, Edit, Users } from "lucide-react";
import type { Team } from "../types";

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (id: string) => void;
}

export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or dropdown
    if (
      (e.target as HTMLElement).closest('[role="menu"]') ||
      (e.target as HTMLElement).closest("button")
    ) {
      return;
    }
    navigate(`/teams/${team.id}`);
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
      onClick={handleCardClick}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-lg">{team.name}</CardTitle>
          </div>
          <CardDescription>
            {team.description || "No description provided"}
          </CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(team);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(team.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>View members</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
          {team.updated_at !== team.created_at && (
            <>
              <span>•</span>
              <span>
                Updated {new Date(team.updated_at).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
