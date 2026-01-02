import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: NavItem[];
  title?: string;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Mobile navigation using Sheet component for sidebar
 * Provides a slide-out navigation menu for mobile devices
 */
export function MobileNav({
  open,
  onOpenChange,
  items,
  title = "Navigation",
  logo,
  footer,
}: MobileNavProps) {
  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            {logo || <span>{title}</span>}
          </SheetTitle>
        </SheetHeader>

        <nav className="flex h-[calc(100vh-5rem)] flex-col overflow-y-auto py-4">
          <div className="flex-1 space-y-1 px-3">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    item.isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {footer && <div className="border-t p-4">{footer}</div>}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
