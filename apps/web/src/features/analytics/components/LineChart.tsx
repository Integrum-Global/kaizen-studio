/**
 * Reusable Line Chart component for time series data
 */

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { TimeSeriesData } from "../types";

interface LineChartProps {
  data: TimeSeriesData[];
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number) => string;
  label?: string;
}

export function LineChart({
  data,
  dataKey = "value",
  xAxisKey = "timestamp",
  color = "hsl(var(--primary))",
  height = 300,
  showGrid = true,
  showLegend = false,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  label = "Value",
}: LineChartProps) {
  const defaultFormatXAxis = (value: string) => {
    try {
      return format(parseISO(value), "MMM dd");
    } catch {
      return value;
    }
  };

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

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted"
            vertical={false}
          />
        )}
        <XAxis
          dataKey={xAxisKey}
          tickFormatter={formatXAxis || defaultFormatXAxis}
          className="text-xs text-muted-foreground"
          stroke="currentColor"
        />
        <YAxis
          tickFormatter={formatYAxis || defaultFormatYAxis}
          className="text-xs text-muted-foreground"
          stroke="currentColor"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          labelFormatter={formatXAxis || defaultFormatXAxis}
          formatter={(value: number) =>
            (formatTooltip || defaultFormatTooltip)(value)
          }
        />
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name={label}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
