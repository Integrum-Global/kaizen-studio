import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { MetricSeries } from "../types";

interface MetricChartProps {
  series: MetricSeries;
  height?: number;
}

/**
 * Time series chart component for metrics
 * Uses a simple line chart visualization
 */
export function MetricChart({ series, height = 300 }: MetricChartProps) {
  if (!series.dataPoints || series.dataPoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{series.metricName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height: `${height}px` }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const values = series.dataPoints.map((dp) => dp.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // Calculate chart dimensions
  const padding = 40;
  const chartWidth = 800;
  const chartHeight = height - padding * 2;

  // Generate path for line chart
  const points = series.dataPoints.map((dp, i) => {
    const x =
      padding +
      (i / (series.dataPoints.length - 1)) * (chartWidth - padding * 2);
    const y = padding + chartHeight - ((dp.value - min) / range) * chartHeight;
    return { x, y, value: dp.value, timestamp: dp.timestamp };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  // Generate area path (for fill under line)
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = [
    linePath,
    `L ${lastPoint?.x ?? 0},${padding + chartHeight}`,
    `L ${firstPoint?.x ?? 0},${padding + chartHeight}`,
    "Z",
  ].join(" ");

  // Format value for display
  const formatValue = (value: number) => {
    if (series.unit === "%") {
      return `${value.toFixed(1)}${series.unit}`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ${series.unit}`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K ${series.unit}`;
    }
    return `${value.toFixed(0)} ${series.unit}`;
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Y-axis labels
  const yAxisLabels = [
    { value: max, y: padding },
    { value: (max + min) / 2, y: padding + chartHeight / 2 },
    { value: min, y: padding + chartHeight },
  ];

  // X-axis labels (show first, middle, last)
  const firstDataPoint = series.dataPoints[0];
  const middleDataPoint =
    series.dataPoints[Math.floor(series.dataPoints.length / 2)];
  const lastDataPoint = series.dataPoints[series.dataPoints.length - 1];
  const xAxisLabels = [
    { timestamp: firstDataPoint?.timestamp ?? "", x: padding },
    {
      timestamp: middleDataPoint?.timestamp ?? "",
      x: chartWidth / 2,
    },
    {
      timestamp: lastDataPoint?.timestamp ?? "",
      x: chartWidth - padding,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{series.metricName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${chartWidth} ${height}`}
            className="text-primary"
          >
            {/* Grid lines */}
            <g className="text-gray-200 dark:text-gray-800">
              {yAxisLabels.map((label, i) => (
                <line
                  key={i}
                  x1={padding}
                  y1={label.y}
                  x2={chartWidth - padding}
                  y2={label.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
            </g>

            {/* Area under line */}
            <path
              d={areaPath}
              fill="currentColor"
              fillOpacity="0.1"
              className="text-primary"
            />

            {/* Line chart */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            />

            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="currentColor"
                  className="text-primary"
                />
                <title>
                  {formatTime(p.timestamp)}: {formatValue(p.value)}
                </title>
              </g>
            ))}

            {/* Y-axis labels */}
            <g className="text-xs text-muted-foreground">
              {yAxisLabels.map((label, i) => (
                <text
                  key={i}
                  x={padding - 10}
                  y={label.y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="currentColor"
                >
                  {formatValue(label.value)}
                </text>
              ))}
            </g>

            {/* X-axis labels */}
            <g className="text-xs text-muted-foreground">
              {xAxisLabels.map((label, i) => (
                <text
                  key={i}
                  x={label.x}
                  y={height - 10}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {formatTime(label.timestamp)}
                </text>
              ))}
            </g>
          </svg>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Min: {formatValue(min)}</span>
          <span>Max: {formatValue(max)}</span>
          <span>
            Avg:{" "}
            {formatValue(values.reduce((a, b) => a + b, 0) / values.length)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
