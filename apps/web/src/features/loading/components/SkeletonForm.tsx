import { cn } from "@/lib/utils";
import { SkeletonFormProps } from "../types";
import { Skeleton } from "./Skeleton";

export function SkeletonForm({
  fields = 4,
  showLabels = true,
  showButton = true,
  className,
  animate = true,
}: SkeletonFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          {showLabels && (
            <Skeleton variant="text" width="30%" animate={animate} />
          )}
          <Skeleton
            variant="rounded"
            height={40}
            width="100%"
            animate={animate}
          />
        </div>
      ))}
      {showButton && (
        <div className="flex gap-2 pt-4">
          <Skeleton
            variant="rounded"
            width={120}
            height={40}
            animate={animate}
          />
          <Skeleton
            variant="rounded"
            width={100}
            height={40}
            animate={animate}
          />
        </div>
      )}
    </div>
  );
}
