import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  onClick: () => void;
  className?: string;
}

/**
 * Hamburger menu button for mobile navigation
 * Only visible on mobile screens (< 768px)
 */
export function MobileMenu({ onClick, className }: MobileMenuProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
