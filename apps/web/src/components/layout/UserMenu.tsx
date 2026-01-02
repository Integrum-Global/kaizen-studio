import { Link } from "react-router-dom";
import { LogOut, Settings, Sun, Moon, Monitor } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();

  if (!user) return null;

  const emailPart = (user.email || "U").split("@")[0] || "U";
  const userInitials =
    emailPart
      .split(".")
      .map((part) => part[0] || "")
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-full focus:outline-none"
        data-testid="user-menu"
        aria-label="user menu"
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col items-start overflow-hidden text-left">
              <span className="truncate text-sm font-medium">
                {(user.email || "").split("@")[0]}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email || ""}
              </span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {(user.email || "").split("@")[0]}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ThemeIcon className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
              {theme === "light" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
              {theme === "dark" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
              {theme === "system" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="text-red-600 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
