export interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded";

export interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  spacing?: "sm" | "md" | "lg";
}

export interface SkeletonCardProps extends SkeletonProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
}

export interface SkeletonTableProps extends SkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export interface SkeletonListProps extends SkeletonProps {
  items?: number;
  showAvatar?: boolean;
  showSecondary?: boolean;
}

export interface SkeletonFormProps extends SkeletonProps {
  fields?: number;
  showLabels?: boolean;
  showButton?: boolean;
}

export interface PageSkeletonProps extends SkeletonProps {
  variant?: "dashboard" | "list" | "detail" | "form";
}
