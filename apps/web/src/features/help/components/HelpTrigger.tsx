import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useHelp } from "../hooks";

interface HelpTriggerProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function HelpTrigger({
  variant = "ghost",
  size = "icon",
  className,
}: HelpTriggerProps) {
  const { openHelp } = useHelp();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => openHelp()}
      className={className}
      aria-label="Open help"
      title="Help (F1)"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
