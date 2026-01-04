import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Workflow,
  Box,
  Boxes,
  Server,
  Shield,
  BarChart,
  Settings,
  Key,
  Webhook,
  FileText,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
      { label: "Work Units", href: "/build/work-units", icon: Boxes },
      { label: "Workspaces", href: "/build/workspaces", icon: FolderKanban },
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
    ],
  },
  {
    title: "ADMIN",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "API Keys", href: "/api-keys", icon: Key },
      { label: "Webhooks", href: "/webhooks", icon: Webhook },
    ],
  },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const location = useLocation();

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">K</span>
            </div>
            <span className="text-lg font-bold">Kaizen Studio</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col h-[calc(100vh-5rem)] overflow-y-auto py-4">
          <div className="flex-1">
            {/* Dashboard */}
            <div className="mb-4 px-3">
              <Link
                to="/dashboard"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  location.pathname === "/dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>Dashboard</span>
              </Link>
            </div>

            {/* Navigation Sections */}
            {navSections.map((section) => (
              <div key={section.title} className="mb-4">
                <h3 className="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h3>
                <div className="space-y-1 px-3">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* User Menu */}
          <div className="border-t p-4">
            <UserMenu />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
