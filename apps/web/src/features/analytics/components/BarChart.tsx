/**
 * Reusable Bar Chart component for comparisons
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartData, CategoryData } from "../types";

interface BarChartProps {
  data: ChartData | CategoryData[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: "horizontal" | "vertical";
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
}

export function BarChart({
  data,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = "vertical",
  formatYAxis,
  formatTooltip,
}: BarChartProps) {
  const defaultFormatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const defaultFormatTooltip = (value: number) => {
    return value.toLocaleString();
  };

  // Normalize data to common format
  const isChartData = "labels" in data;
  const chartData = isChartData
    ? (data as ChartData).labels.map((label, index) => {
        const point: any = { name: label };
        (data as ChartData).datasets.forEach((dataset) => {
          point[dataset.label] = dataset.data[index];
        });
        return point;
      })
    : (data as CategoryData[]);

  const datasets = isChartData
    ? (data as ChartData).datasets
    : [{ label: "value", color: "hsl(var(--primary))" }];

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={chartData}
        layout={layout}
        margin={{
          top: 5,
          right: 20,
          left: layout === "horizontal" ? 100 : 0,
          bottom: 5,
        }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted"
            horizontal={layout === "vertical"}
            vertical={layout === "horizontal"}
          />
        )}
        {layout === "vertical" ? (
          <>
            <XAxis
              dataKey="name"
              className="text-xs text-muted-foreground"
              stroke="currentColor"
            />
            <YAxis
              tickFormatter={formatYAxis || defaultFormatYAxis}
              className="text-xs text-muted-foreground"
              stroke="currentColor"
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tickFormatter={formatYAxis || defaultFormatYAxis}
              className="text-xs text-muted-foreground"
              stroke="currentColor"
            />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs text-muted-foreground"
              stroke="currentColor"
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          formatter={(value: number) =>
            (formatTooltip || defaultFormatTooltip)(value)
          }
        />
        {showLegend && <Legend />}
        {datasets.map((dataset, index) => (
          <Bar
            key={dataset.label}
            dataKey={dataset.label}
            fill={dataset.color || colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
