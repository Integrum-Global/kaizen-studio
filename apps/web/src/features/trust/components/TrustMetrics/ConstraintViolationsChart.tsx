/**
 * ConstraintViolationsChart Component
 *
 * Stacked bar chart showing constraint violations over time
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ViolationDataPoint } from "../../types";

interface ConstraintViolationsChartProps {
  data: ViolationDataPoint[];
  isLoading?: boolean;
}

const VIOLATION_TYPES = [
  { key: "resourceLimit", label: "Resource Limit", color: "#ef4444" },
  { key: "timeWindow", label: "Time Window", color: "#f97316" },
  { key: "dataScope", label: "Data Scope", color: "#f59e0b" },
  { key: "actionRestriction", label: "Action Restriction", color: "#8b5cf6" },
  { key: "auditRequirement", label: "Audit Requirement", color: "#3b82f6" },
];

export function ConstraintViolationsChart({
  data,
  isLoading,
}: ConstraintViolationsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Constraint Violations</CardTitle>
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
        <CardTitle>Constraint Violations</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
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
            {VIOLATION_TYPES.map((violationType) => (
              <Bar
                key={violationType.key}
                dataKey={violationType.key}
                stackId="violations"
                fill={violationType.color}
                name={violationType.label}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
