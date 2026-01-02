import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthApi } from "../api";
import type { ExportFormat } from "../types";

/**
 * Hook to fetch system health status
 */
export function useSystemHealth(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["health", "system"],
    queryFn: healthApi.getSystemHealth,
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled,
  });
}

/**
 * Hook to fetch incident history
 */
export function useIncidents() {
  return useQuery({
    queryKey: ["health", "incidents"],
    queryFn: healthApi.getIncidents,
  });
}

/**
 * Hook to fetch a single incident
 */
export function useIncident(id: string) {
  return useQuery({
    queryKey: ["health", "incidents", id],
    queryFn: () => healthApi.getIncident(id),
    enabled: !!id,
  });
}

/**
 * Hook to export health report
 */
export function useExportReport() {
  return useMutation({
    mutationFn: async (format: ExportFormat) => {
      const blob = await healthApi.exportReport(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString();
      a.download = `health-report-${timestamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}

/**
 * Hook to get full health report
 */
export function useHealthReport() {
  return useQuery({
    queryKey: ["health", "report"],
    queryFn: healthApi.getHealthReport,
  });
}

/**
 * Hook to manually refresh health data
 */
export function useRefreshHealth() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["health"] });
  };
}

/**
 * Hook to fetch services list with filters
 */
export function useServices(
  filters?: { search?: string; status?: string },
  refetchInterval?: number
) {
  return useQuery({
    queryKey: ["health", "services", filters],
    queryFn: async () => {
      const systemHealth = await healthApi.getSystemHealth();
      let services = systemHealth.services ?? [];

      // Apply filters
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        services = services.filter(
          (s) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower)
        );
      }
      if (filters?.status && filters.status !== "all") {
        services = services.filter((s) => s.status === filters.status);
      }

      return services;
    },
    refetchInterval,
  });
}

/**
 * Hook to fetch uptime data for charts
 */
export function useUptimeData(serviceId?: string, hours: number | string = 24) {
  // Convert hours to string format if needed
  const timeRange = typeof hours === "number" ? `${hours}h` : hours;

  return useQuery({
    queryKey: ["health", "uptime", serviceId, timeRange],
    queryFn: async () => {
      // Generate mock uptime data points based on time range
      const now = Date.now();
      const points: Array<{ timestamp: string; uptime: number; latency: number }> = [];

      const intervals: Record<string, { count: number; ms: number }> = {
        "1h": { count: 12, ms: 5 * 60 * 1000 },
        "24h": { count: 24, ms: 60 * 60 * 1000 },
        "7d": { count: 7, ms: 24 * 60 * 60 * 1000 },
        "30d": { count: 30, ms: 24 * 60 * 60 * 1000 },
      };

      // Handle numeric hours - get config or fallback to 24h
      const defaultConfig = { count: 24, ms: 60 * 60 * 1000 };
      const numericConfig = typeof hours === "number" ? { count: hours, ms: 60 * 60 * 1000 } : defaultConfig;
      const config = intervals[timeRange] ?? numericConfig;
      const { count, ms } = config;

      for (let i = count - 1; i >= 0; i--) {
        const timestamp = new Date(now - i * ms).toISOString();
        // Generate realistic uptime values (mostly 99-100%, occasional dips)
        const uptime = Math.random() > 0.1 ? 99 + Math.random() : 95 + Math.random() * 4;
        const latency = 50 + Math.random() * 150;
        points.push({ timestamp, uptime: Math.round(uptime * 100) / 100, latency: Math.round(latency) });
      }

      return points;
    },
    enabled: true,
  });
}
