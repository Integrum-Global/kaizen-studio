import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, DollarSign } from "lucide-react";
import type { GovernanceStatus } from "../../types";

interface BudgetUsageWidgetProps {
  budgetUsage?: GovernanceStatus["budget_usage"];
}

export function BudgetUsageWidget({ budgetUsage }: BudgetUsageWidgetProps) {
  if (!budgetUsage) {
    return (
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          No budget configuration set
        </p>
      </div>
    );
  }

  const data = [
    {
      name: "Current Month",
      cost: budgetUsage.current_month_cost || 0,
    },
  ];

  const isOverBudget = budgetUsage.percentage_used > 90;
  const isNearLimit =
    budgetUsage.percentage_used > 80 && budgetUsage.percentage_used <= 90;

  const barColor = isOverBudget
    ? "#EF4444" // Red
    : isNearLimit
      ? "#F59E0B" // Yellow
      : "#3B82F6"; // Blue

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-semibold">Budget Usage</h4>
        </div>
        {isOverBudget && (
          <div className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Over 90% used</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Current Cost</p>
          <p className="text-2xl font-bold">
            ${budgetUsage.current_month_cost.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Budget Limit</p>
          <p className="text-2xl font-bold">
            {budgetUsage.max_monthly_cost
              ? `$${budgetUsage.max_monthly_cost.toFixed(2)}`
              : "Unlimited"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Percentage Used</p>
          <p
            className={`text-2xl font-bold ${
              isOverBudget
                ? "text-destructive"
                : isNearLimit
                  ? "text-yellow-600 dark:text-yellow-500"
                  : "text-green-600 dark:text-green-500"
            }`}
          >
            {budgetUsage.percentage_used.toFixed(1)}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-sm" />
          <YAxis className="text-sm" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
          <Legend />
          <Bar dataKey="cost" fill={barColor} name="Cost" />
          {budgetUsage.max_monthly_cost && (
            <ReferenceLine
              y={budgetUsage.max_monthly_cost}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{
                value: "Limit",
                position: "right",
                fill: "#EF4444",
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {isOverBudget && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
          <p className="text-sm text-destructive">
            <strong>Warning:</strong> Budget usage is above 90%. Consider
            increasing the budget limit or reducing invocations.
          </p>
        </div>
      )}

      {isNearLimit && !isOverBudget && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Notice:</strong> Budget usage is above 80%. You may reach
            the limit soon.
          </p>
        </div>
      )}
    </div>
  );
}
