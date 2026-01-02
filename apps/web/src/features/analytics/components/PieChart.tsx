/**
 * Reusable Pie/Donut Chart component for distributions
 */

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { CategoryData } from "../types";

interface PieChartProps {
  data: CategoryData[];
  height?: number;
  innerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function PieChart({
  data,
  height = 300,
  innerRadius = 0,
  showLegend = true,
  showLabels = true,
  colors = DEFAULT_COLORS,
}: PieChartProps) {
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius: ir,
    outerRadius,
    percent,
  }: any) => {
    if (!showLabels || percent < 0.05) return null; // Don't show label for small slices

    const RADIAN = Math.PI / 180;
    const radius = ir + (outerRadius - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data as any}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={height / 3}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          formatter={(value: number, name: string, entry: any) => [
            `${value} (${entry.payload.percentage}%)`,
            name,
          ]}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, _entry: any) =>
              `${value} (${_entry.payload.percentage}%)`
            }
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
