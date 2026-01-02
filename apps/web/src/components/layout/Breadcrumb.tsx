import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { useAgent } from "@/features/agents/hooks";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isLoading?: boolean;
}

// Check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function getBreadcrumbs(
  pathname: string,
  resourceName?: string
): BreadcrumbItem[] {
  // Remove leading slash and split
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  const breadcrumbs: BreadcrumbItem[] = [];

  // Build breadcrumbs from segments
  segments.forEach((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    // Check if this segment is a UUID (resource ID)
    if (isUUID(segment)) {
      // Use the resource name if available, otherwise show loading or truncated ID
      breadcrumbs.push({
        label: resourceName || segment.slice(0, 8) + "...",
        href: isLast ? undefined : href,
        isLoading: !resourceName,
      });
    } else {
      // Format label (capitalize and replace hyphens with spaces)
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href: isLast ? undefined : href,
      });
    }
  });

  return breadcrumbs;
}

export function Breadcrumb() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const segments = location.pathname.split("/").filter(Boolean);

  // Determine the resource type from the path
  const resourceType = segments[0]; // e.g., "agents", "pipelines"

  // Fetch resource name based on type - hooks are called unconditionally
  const isAgentPage = resourceType === "agents" && id;

  // Only fetch agent data when on agent detail page
  const { data: agent } = useAgent(isAgentPage ? id : "");

  // Get the resource name
  let resourceName: string | undefined;
  if (isAgentPage && agent) {
    resourceName = agent.name;
  }

  const breadcrumbs = getBreadcrumbs(location.pathname, resourceName);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {crumb.href ? (
            <Link
              to={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={`text-foreground font-medium ${crumb.isLoading ? "animate-pulse" : ""}`}
            >
              {crumb.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
