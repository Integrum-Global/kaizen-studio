import React from "react";
import { cn } from "@/lib/utils";
import { SkeletonProps, SkeletonVariant } from "../types";

interface ExtendedSkeletonProps extends SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className,
  animate = true,
  ...props
}: ExtendedSkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  const variantStyles = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
    rounded: "rounded-lg",
  };

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "bg-muted",
        animate && "animate-pulse",
        variantStyles[variant],
        className
      )}
      style={style}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
