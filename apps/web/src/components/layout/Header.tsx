import { Menu, Bell, Search, HelpCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store/ui";
import { Breadcrumb } from "./Breadcrumb";
import { UserMenu } from "./UserMenu";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { useHelp } from "@/features/help";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { notifications, removeNotification, clearNotifications } =
    useUIStore();
  const unreadCount = notifications.length;
  const { openHelp } = useHelp();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 lg:px-8">
      {/* Mobile Menu Button */}
      {onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Breadcrumb - Hidden on mobile, shown on tablet+ */}
      <div className="hidden md:flex flex-1 items-center gap-4">
        <Breadcrumb />
        <OrganizationSwitcher />
      </div>

      {/* Mobile Title - Shown only on mobile */}
      <div className="md:hidden flex-1 flex items-center gap-2">
        <span className="text-lg font-semibold">Kaizen Studio</span>
        <OrganizationSwitcher />
      </div>

      {/* Search */}
      <div className="hidden lg:flex w-full max-w-sm items-center">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search..." className="pl-8" />
        </div>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Help Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openHelp()}
        aria-label="Open help (F1)"
        title="Help (F1)"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-4 py-2">
            <h3 className="font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="h-auto p-0 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 px-4 py-3"
                  onSelect={() => removeNotification(notification.id)}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <Badge
                      variant={
                        notification.type === "error"
                          ? "destructive"
                          : notification.type === "warning"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {notification.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu (Mobile Only) */}
      <div className="md:hidden">
        <UserMenu />
      </div>
    </header>
  );
}
