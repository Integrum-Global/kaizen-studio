import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { AuthProvider } from "./features/auth/components/AuthProvider";
import { UserLevelProvider } from "./contexts/UserLevelContext";
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

// Lazy load agents pages (only AgentDetailPage still used for direct agent navigation)
const AgentDetailPage = lazy(() =>
  import("./pages/agents").then((m) => ({ default: m.AgentDetailPage }))
);

// Lazy load pipelines pages (only PipelineEditorPage still used for new/edit)
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

// Lazy load work pages (EATP Ontology)
const MyTasksPage = lazy(() =>
  import("./pages/work").then((m) => ({ default: m.MyTasksPage }))
);
const MyProcessesPage = lazy(() =>
  import("./pages/work").then((m) => ({ default: m.MyProcessesPage }))
);
const ValueChainsPage = lazy(() =>
  import("./pages/work").then((m) => ({ default: m.ValueChainsPage }))
);

// Lazy load govern pages (EATP Ontology - Level 3)
const ComplianceDashboard = lazy(() =>
  import("./pages/govern").then((m) => ({ default: m.ComplianceDashboard }))
);
const EnterpriseAuditTrail = lazy(() =>
  import("./pages/govern").then((m) => ({ default: m.EnterpriseAuditTrail }))
);

// Lazy load build pages (EATP Ontology)
const WorkUnitsPage = lazy(() =>
  import("./pages/build").then((m) => ({ default: m.WorkUnitsPage }))
);
const WorkspacesPage = lazy(() =>
  import("./pages/build").then((m) => ({ default: m.WorkspacesPage }))
);
const WorkspaceDetailPage = lazy(() =>
  import("./pages/build").then((m) => ({ default: m.WorkspaceDetailPage }))
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
 * Routes wrapped in AuthProvider and UserLevelProvider
 * Separated to avoid SSO callback race conditions
 */
function AuthProviderRoutes() {
  return (
    <AuthProvider>
      <UserLevelProvider>
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

          {/* Work (EATP Ontology) */}
          <Route path="/work/tasks" element={<MyTasksPage />} />
          <Route path="/work/tasks/:id" element={<MyTasksPage />} />
          <Route path="/work/processes" element={<MyProcessesPage />} />
          <Route path="/work/processes/:id" element={<MyProcessesPage />} />
          <Route path="/work/value-chains" element={<ValueChainsPage />} />
          <Route path="/work/value-chains/:id" element={<ValueChainsPage />} />

          {/* Govern (EATP Ontology - Level 3) */}
          <Route path="/govern/compliance" element={<ComplianceDashboard />} />
          <Route path="/govern/audit-trail" element={<EnterpriseAuditTrail />} />

          {/* Build */}
          <Route path="/build/work-units" element={<WorkUnitsPage />} />
          <Route path="/build/workspaces" element={<WorkspacesPage />} />
          <Route path="/build/workspaces/:id" element={<WorkspaceDetailPage />} />

          {/* Legacy routes - redirect to new EATP ontology paths */}
          <Route path="/agents" element={<Navigate to="/build/work-units" replace />} />
          <Route path="/agents/new" element={<Navigate to="/build/work-units" replace />} />
          <Route path="/agents/:id" element={<AgentDetailPage />} />
          <Route path="/pipelines" element={<Navigate to="/build/work-units" replace />} />
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
      </UserLevelProvider>
    </AuthProvider>
  );
}

export default App;
