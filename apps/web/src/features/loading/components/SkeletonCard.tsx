import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { SkeletonCardProps } from "../types";
import { Skeleton } from "./Skeleton";

export function SkeletonCard({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = true,
  className,
  animate = true,
}: SkeletonCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {showImage && (
        <Skeleton
          variant="rectangular"
          height={200}
          animate={animate}
          className="rounded-none"
        />
      )}
      {showTitle && (
        <CardHeader className="space-y-2">
          <Skeleton variant="text" width="60%" animate={animate} />
          {showDescription && (
            <div className="space-y-2">
              <Skeleton variant="text" width="100%" animate={animate} />
              <Skeleton variant="text" width="80%" animate={animate} />
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        <Skeleton variant="text" width="100%" animate={animate} />
        <Skeleton variant="text" width="90%" animate={animate} />
        <Skeleton variant="text" width="75%" animate={animate} />
      </CardContent>
      {showActions && (
        <CardFooter className="gap-2">
          <Skeleton
            variant="rounded"
            width={100}
            height={36}
            animate={animate}
          />
          <Skeleton
            variant="rounded"
            width={100}
            height={36}
            animate={animate}
          />
        </CardFooter>
      )}
    </Card>
  );
}
