import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message, className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[400px] flex-col items-center justify-center",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
