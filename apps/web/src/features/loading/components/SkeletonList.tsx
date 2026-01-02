import { cn } from "@/lib/utils";
import { SkeletonListProps } from "../types";
import { Skeleton } from "./Skeleton";

export function SkeletonList({
  items = 5,
  showAvatar = true,
  showSecondary = true,
  className,
  animate = true,
}: SkeletonListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-start gap-4">
          {showAvatar && (
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              animate={animate}
            />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" animate={animate} />
            {showSecondary && (
              <Skeleton variant="text" width="80%" animate={animate} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
