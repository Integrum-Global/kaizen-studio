import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Workflow,
  Box,
  Server,
  Shield,
  BarChart,
  Settings,
  Key,
  Webhook,
  FileText,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  AlertCircle,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "./UserMenu";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "BUILD",
    items: [
      { label: "Agents", href: "/agents", icon: Users },
      { label: "Pipelines", href: "/pipelines", icon: GitBranch },
      { label: "Connectors", href: "/connectors", icon: Box },
    ],
  },
  {
    title: "DEPLOY",
    items: [
      { label: "Deployments", href: "/deployments", icon: Server },
      { label: "Gateways", href: "/gateways", icon: Workflow },
    ],
  },
  {
    title: "GOVERN",
    items: [
      { label: "Teams", href: "/teams", icon: Users },
      { label: "Roles", href: "/roles", icon: Shield },
      { label: "Policies", href: "/policies", icon: FileText },
      { label: "Trust", href: "/trust", icon: ShieldCheck },
      { label: "Audit Logs", href: "/audit", icon: FileText },
    ],
  },
  {
    title: "OBSERVE",
    items: [
      { label: "Metrics", href: "/metrics", icon: BarChart },
      { label: "Logs", href: "/logs", icon: FileText },
      { label: "Health", href: "/system-health", icon: Activity },
      { label: "Alerts", href: "/alerts", icon: AlertCircle },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { label: "Organizations", href: "/organizations", icon: Building2 },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "API Keys", href: "/api-keys", icon: Key },
      { label: "Webhooks", href: "/webhooks", icon: Webhook },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        {sidebarCollapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">K</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">K</span>
            </div>
            <span className="text-lg font-bold">Kaizen Studio</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Dashboard */}
        <div className="mb-4 px-3">
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              location.pathname === "/dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            title={sidebarCollapsed ? "Dashboard" : undefined}
          >
            <Home className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Navigation Sections */}
        {navSections.map((section, idx) => (
          <div key={section.title} className="mb-4">
            {!sidebarCollapsed && (
              <h3 className="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
            )}
            {sidebarCollapsed && idx > 0 && <Separator className="mx-3 my-2" />}
            <div className="space-y-1 px-3">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Menu */}
      <div className="border-t p-4">
        <UserMenu collapsed={sidebarCollapsed} />
      </div>

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
