import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gauge } from "lucide-react";
import { QuotaProgress } from "./QuotaProgress";
import { useQuotas } from "../hooks";

interface QuotaListProps {
  showDetails?: boolean;
}

export function QuotaList({ showDetails = false }: QuotaListProps) {
  const { data: quotas, isLoading } = useQuotas();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!quotas || quotas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Gauge className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No quota information available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort quotas by percent used (descending)
  const sortedQuotas = [...quotas].sort((a, b) => {
    const percentA = a.limit > 0 ? (a.current / a.limit) * 100 : 0;
    const percentB = b.limit > 0 ? (b.current / b.limit) * 100 : 0;
    return percentB - percentA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Resource Quotas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedQuotas.map((quota) => (
          <QuotaProgress
            key={quota.id}
            quota={quota}
            showDetails={showDetails}
          />
        ))}
      </CardContent>
    </Card>
  );
}
