import { cn } from "@/lib/utils";
import { SkeletonTextProps } from "../types";
import { Skeleton } from "./Skeleton";

const spacingStyles = {
  sm: "space-y-2",
  md: "space-y-3",
  lg: "space-y-4",
};

export function SkeletonText({
  lines = 3,
  spacing = "md",
  className,
  animate = true,
}: SkeletonTextProps) {
  return (
    <div className={cn(spacingStyles[spacing], className)}>
      {Array.from({ length: lines }).map((_, index) => {
        // Make last line shorter for more realistic look
        const isLast = index === lines - 1;
        const width = isLast ? "75%" : "100%";

        return (
          <Skeleton
            key={index}
            variant="text"
            width={width}
            animate={animate}
          />
        );
      })}
    </div>
  );
}
