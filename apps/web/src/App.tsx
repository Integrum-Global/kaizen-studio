import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { AuthProvider } from "./features/auth/components/AuthProvider";
import { AppShell } from "./components/layout";
import { ErrorBoundary, LoadingScreen } from "./components/shared";
import { Toaster } from "./components/ui/toaster";

// Lazy load auth pages (small, load quickly)
const LoginPage = lazy(() =>
  import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const SSOCallbackPage = lazy(() =>
  import("./pages/auth/SSOCallbackPage").then((m) => ({
    default: m.SSOCallbackPage,
  }))
);

// Lazy load main pages
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);

// Lazy load agents pages
const AgentsPage = lazy(() =>
  import("./pages/agents").then((m) => ({ default: m.AgentsPage }))
);
const AgentDetailPage = lazy(() =>
  import("./pages/agents").then((m) => ({ default: m.AgentDetailPage }))
);

// Lazy load pipelines pages (heaviest - React Flow)
const PipelinesPage = lazy(() =>
  import("./pages/pipelines").then((m) => ({ default: m.PipelinesPage }))
);
const PipelineEditorPage = lazy(() =>
  import("./pages/pipelines").then((m) => ({ default: m.PipelineEditorPage }))
);

// Lazy load admin pages
const TeamsPage = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.TeamsPage }))
);
const TeamDetailPage = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.TeamDetailPage }))
);
const RolesPage = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.RolesPage }))
);
const PoliciesPage = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.PoliciesPage }))
);
const UsersPage = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.UsersPage }))
);
const OrganizationsPage = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.OrganizationsPage }))
);

// Lazy load observability pages
const MetricsPage = lazy(() =>
  import("./pages/observability").then((m) => ({ default: m.MetricsPage }))
);
const AuditPage = lazy(() =>
  import("./pages/observability").then((m) => ({ default: m.AuditPage }))
);
const LogsPage = lazy(() =>
  import("./pages/observability").then((m) => ({ default: m.LogsPage }))
);

// Lazy load settings pages
const SettingsPage = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.SettingsPage }))
);
const ApiKeysPage = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.ApiKeysPage }))
);
const WebhooksPage = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.WebhooksPage }))
);
const BillingPage = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.BillingPage }))
);

// Lazy load trust pages
const TrustDashboardPage = lazy(() =>
  import("./pages/trust").then((m) => ({ default: m.TrustDashboardPage }))
);
const TrustChainDetailPage = lazy(() =>
  import("./pages/trust").then((m) => ({ default: m.TrustChainDetailPage }))
);

// Lazy load infrastructure pages
const GatewaysPage = lazy(() =>
  import("./pages/infrastructure").then((m) => ({ default: m.GatewaysPage }))
);
const DeploymentsPage = lazy(() =>
  import("./pages/infrastructure").then((m) => ({ default: m.DeploymentsPage }))
);
const ConnectorsPage = lazy(() =>
  import("./pages/infrastructure").then((m) => ({ default: m.ConnectorsPage }))
);

// Lazy load health pages
const HealthPage = lazy(() =>
  import("./pages/health").then((m) => ({ default: m.HealthPage }))
);
const IncidentsPage = lazy(() =>
  import("./pages/health").then((m) => ({ default: m.IncidentsPage }))
);

// Lazy load alert pages
const AlertsPage = lazy(() =>
  import("./pages/alerts").then((m) => ({ default: m.AlertsPage }))
);
const AlertRulesPage = lazy(() =>
  import("./pages/alerts").then((m) => ({ default: m.AlertRulesPage }))
);
const AlertHistoryPage = lazy(() =>
  import("./pages/alerts").then((m) => ({ default: m.AlertHistoryPage }))
);
const AlertSettingsPage = lazy(() =>
  import("./pages/alerts").then((m) => ({ default: m.AlertSettingsPage }))
);

// Suspense fallback component
function PageLoader() {
  return <LoadingScreen message="Loading..." />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* SSO Callback Routes - Outside AuthProvider to prevent race conditions */}
            <Route
              path="/auth/callback/:provider"
              element={<SSOCallbackPage />}
            />
            <Route path="/auth/callback" element={<SSOCallbackPage />} />

            {/* All other routes wrapped in AuthProvider */}
            <Route path="/*" element={<AuthProviderRoutes />} />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/**
 * Routes wrapped in AuthProvider
 * Separated to avoid SSO callback race conditions
 */
function AuthProviderRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes with AppShell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Build */}
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/pipelines" element={<PipelinesPage />} />
          <Route path="/pipelines/new" element={<PipelineEditorPage />} />
          <Route path="/pipelines/:id" element={<PipelineEditorPage />} />
          <Route path="/connectors" element={<ConnectorsPage />} />

          {/* Deploy */}
          <Route path="/deployments" element={<DeploymentsPage />} />
          <Route path="/gateways" element={<GatewaysPage />} />

          {/* Admin */}
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />

          {/* Observability */}
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/logs" element={<LogsPage />} />

          {/* Health */}
          <Route path="/system-health" element={<HealthPage />} />
          <Route path="/system-health/incidents" element={<IncidentsPage />} />

          {/* Alerts */}
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/alerts/rules" element={<AlertRulesPage />} />
          <Route path="/alerts/history" element={<AlertHistoryPage />} />
          <Route path="/alerts/history/:id" element={<AlertHistoryPage />} />
          <Route path="/alerts/settings" element={<AlertSettingsPage />} />

          {/* Trust */}
          <Route path="/trust" element={<TrustDashboardPage />} />
          <Route path="/trust/:agentId" element={<TrustChainDetailPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/api-keys" element={<ApiKeysPage />} />
          <Route path="/webhooks" element={<WebhooksPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
