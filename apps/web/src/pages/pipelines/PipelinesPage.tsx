import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, GitBranch, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { pipelinesApi, type Pipeline } from "../../features/pipelines";
import { useAuthStore } from "../../store/auth";

export function PipelinesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setLoading(true);
        setError(null);
        // Pass organization_id from auth store - required by backend
        const response = await pipelinesApi.getAll({
          organization_id: user?.organization_id,
        });
        setPipelines(response.items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load pipelines"
        );
        setPipelines([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.organization_id) {
      fetchPipelines();
    }
  }, [user?.organization_id]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Pipelines
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage AI agent pipelines
          </p>
        </div>
        <Button onClick={() => navigate("/pipelines/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {pipelines.length === 0 && !error ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No pipelines yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first pipeline to orchestrate AI agents
          </p>
          <Button onClick={() => navigate("/pipelines/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Pipeline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/pipelines/${pipeline.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {pipeline.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pipeline.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  {pipeline.pattern}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    pipeline.status === "active"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {pipeline.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
