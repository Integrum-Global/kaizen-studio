/**
 * TrustActivityChart Component
 *
 * Line chart showing trust activity over time
 */

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ActivityDataPoint } from "../../types";

interface TrustActivityChartProps {
  data: ActivityDataPoint[];
  isLoading?: boolean;
}

const SERIES_CONFIG = [
  { key: "establishments", label: "Establishments", color: "#10b981" },
  { key: "delegations", label: "Delegations", color: "#3b82f6" },
  { key: "revocations", label: "Revocations", color: "#ef4444" },
  { key: "verifications", label: "Verifications", color: "#8b5cf6" },
];

export function TrustActivityChart({
  data,
  isLoading,
}: TrustActivityChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    new Set(SERIES_CONFIG.map((s) => s.key))
  );

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trust Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Activity Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Series toggles */}
          <div className="flex flex-wrap gap-4">
            {SERIES_CONFIG.map((series) => (
              <div key={series.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`series-${series.key}`}
                  checked={visibleSeries.has(series.key)}
                  onCheckedChange={() => toggleSeries(series.key)}
                />
                <Label
                  htmlFor={`series-${series.key}`}
                  className="text-sm font-normal cursor-pointer"
                  style={{ color: series.color }}
                >
                  {series.label}
                </Label>
              </div>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              {SERIES_CONFIG.map(
                (series) =>
                  visibleSeries.has(series.key) && (
                    <Line
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      stroke={series.color}
                      strokeWidth={2}
                      name={series.label}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
