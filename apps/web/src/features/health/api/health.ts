import type {
  SystemHealth,
  Incident,
  HealthReport,
  ExportFormat,
  ServiceStatus,
  HealthMetrics,
  DependencyStatus,
} from "../types";

// Mock data for health status (no backend endpoint yet)
const mockServices: ServiceStatus[] = [
  {
    id: "api-server",
    name: "API Server",
    status: "healthy",
    uptime: 99.95,
    latency: 45,
    lastCheck: new Date().toISOString(),
    description: "Main backend API service",
  },
  {
    id: "database",
    name: "PostgreSQL Database",
    status: "healthy",
    uptime: 99.99,
    latency: 12,
    lastCheck: new Date().toISOString(),
    description: "Primary database",
  },
  {
    id: "redis",
    name: "Redis Cache",
    status: "healthy",
    uptime: 99.98,
    latency: 3,
    lastCheck: new Date().toISOString(),
    description: "In-memory cache",
  },
];

const mockMetrics: HealthMetrics = {
  responseTime: {
    avg: 45,
    p95: 120,
    p99: 250,
  },
  errorRate: 0.1,
  requestCount: 125000,
  cpu: 35,
  memory: 62,
};

const mockDependencies: DependencyStatus[] = [
  {
    name: "External Auth Provider",
    type: "external",
    status: "healthy",
    lastCheck: new Date().toISOString(),
  },
  {
    name: "Storage Service",
    type: "external",
    status: "healthy",
    lastCheck: new Date().toISOString(),
  },
];

const mockIncidents: Incident[] = [
  {
    id: "inc-001",
    title: "API Latency Spike",
    severity: "medium",
    status: "resolved",
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    resolvedAt: new Date(Date.now() - 1800000).toISOString(),
    duration: 30,
    affectedServices: ["api-server"],
    description: "Brief latency increase due to database connection pool exhaustion",
  },
  {
    id: "inc-002",
    title: "Scheduled Maintenance",
    severity: "low",
    status: "resolved",
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    resolvedAt: new Date(Date.now() - 82800000).toISOString(),
    duration: 60,
    affectedServices: ["database"],
    description: "Planned database maintenance window",
  },
];

export const healthApi = {
  /**
   * Get current system health status
   * Using mock data since no backend endpoint exists yet
   */
  getSystemHealth: async (): Promise<SystemHealth> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      status: "healthy",
      overallStatus: "healthy",
      timestamp: new Date().toISOString(),
      totalServices: mockServices.length,
      healthyServices: mockServices.filter((s) => s.status === "healthy").length,
      degradedServices: mockServices.filter((s) => s.status === "degraded").length,
      downServices: mockServices.filter((s) => s.status === "down").length,
      averageLatency: Math.round(
        mockServices.reduce((sum, s) => sum + s.latency, 0) / mockServices.length
      ),
      averageUptime:
        mockServices.reduce((sum, s) => sum + s.uptime, 0) / mockServices.length,
      lastUpdated: new Date().toISOString(),
      services: mockServices,
      metrics: mockMetrics,
      dependencies: mockDependencies,
    };
  },

  /**
   * Get incident history
   */
  getIncidents: async (): Promise<Incident[]> => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mockIncidents;
  },

  /**
   * Get incident by ID
   */
  getIncident: async (id: string): Promise<Incident> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const incident = mockIncidents.find((i) => i.id === id);
    if (!incident) {
      throw new Error(`Incident ${id} not found`);
    }
    return incident;
  },

  /**
   * Export health report
   */
  exportReport: async (format: ExportFormat): Promise<Blob> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const report = {
      timestamp: new Date().toISOString(),
      systemHealth: await healthApi.getSystemHealth(),
      incidents: mockIncidents,
    };

    if (format === "json") {
      return new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
    } else if (format === "csv") {
      const csv = [
        "Service,Status,Uptime,Latency",
        ...mockServices.map(
          (s) => `${s.name},${s.status},${s.uptime}%,${s.latency}ms`
        ),
      ].join("\n");
      return new Blob([csv], { type: "text/csv" });
    } else {
      // PDF not implemented - return JSON
      return new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
    }
  },

  /**
   * Get full health report
   */
  getHealthReport: async (): Promise<HealthReport> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      timestamp: new Date().toISOString(),
      systemHealth: await healthApi.getSystemHealth(),
      incidents: mockIncidents,
      uptime24h: 99.95,
      uptime7d: 99.92,
      uptime30d: 99.89,
    };
  },
};

export default healthApi;
