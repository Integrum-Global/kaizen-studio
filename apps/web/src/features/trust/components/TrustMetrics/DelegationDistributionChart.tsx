/**
 * DelegationDistributionChart Component
 *
 * Pie/donut chart showing delegation distribution
 */

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DistributionItem } from "../../types";

interface DelegationDistributionChartProps {
  data: DistributionItem[];
  isLoading?: boolean;
  onSegmentClick?: (item: DistributionItem) => void;
}

interface ChartDataItem extends DistributionItem {
  [key: string]: string | number;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

export function DelegationDistributionChart({
  data,
  isLoading,
  onSegmentClick,
}: DelegationDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delegation Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleClick = (_: any, index: number) => {
    if (onSegmentClick && data[index]) {
      onSegmentClick(data[index]);
    }
  };

  const chartData: ChartDataItem[] = data.map((item) => ({
    ...item,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delegation Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) =>
                `${props.name}: ${props.percentage.toFixed(1)}%`
              }
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              onClick={handleClick}
              cursor={onSegmentClick ? "pointer" : "default"}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number, _name: string, props: any) => [
                `${value} (${props.payload.percentage.toFixed(1)}%)`,
                props.payload.name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, props: any) =>
                `${value} (${props.payload.percentage.toFixed(1)}%)`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
