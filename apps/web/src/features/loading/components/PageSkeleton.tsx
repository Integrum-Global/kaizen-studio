import { cn } from "@/lib/utils";
import { PageSkeletonProps } from "../types";
import { Skeleton } from "./Skeleton";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonTable } from "./SkeletonTable";
import { SkeletonList } from "./SkeletonList";
import { SkeletonForm } from "./SkeletonForm";

export function PageSkeleton({
  variant = "dashboard",
  className,
  animate = true,
}: PageSkeletonProps) {
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="30%" height={32} animate={animate} />
        <Skeleton variant="text" width="50%" animate={animate} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-3">
            <Skeleton variant="text" width="60%" animate={animate} />
            <Skeleton
              variant="text"
              width="40%"
              height={28}
              animate={animate}
            />
            <Skeleton variant="text" width="80%" animate={animate} />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard
          showImage={false}
          showTitle={true}
          showDescription={false}
          showActions={false}
          animate={animate}
        />
        <SkeletonCard
          showImage={false}
          showTitle={true}
          showDescription={false}
          showActions={false}
          animate={animate}
        />
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width={200} height={32} animate={animate} />
          <Skeleton variant="text" width={300} animate={animate} />
        </div>
        <Skeleton variant="rounded" width={120} height={40} animate={animate} />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={200} height={40} animate={animate} />
        <Skeleton variant="rounded" width={120} height={40} animate={animate} />
        <Skeleton variant="rounded" width={120} height={40} animate={animate} />
      </div>

      {/* Table or List */}
      <SkeletonTable rows={8} columns={5} animate={animate} />
    </div>
  );

  const renderDetail = () => (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton variant="text" width={80} animate={animate} />
        <Skeleton variant="text" width={20} animate={animate} />
        <Skeleton variant="text" width={120} animate={animate} />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width={300} height={32} animate={animate} />
          <Skeleton variant="text" width={200} animate={animate} />
        </div>
        <div className="flex gap-2">
          <Skeleton
            variant="rounded"
            width={100}
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
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard
            showImage={false}
            showTitle={true}
            showDescription={false}
            showActions={false}
            animate={animate}
          />
          <SkeletonCard
            showImage={false}
            showTitle={true}
            showDescription={false}
            showActions={false}
            animate={animate}
          />
        </div>
        <div className="space-y-6">
          <SkeletonCard
            showImage={false}
            showTitle={true}
            showDescription={false}
            showActions={false}
            animate={animate}
          />
          <SkeletonList items={4} showAvatar={false} animate={animate} />
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width={250} height={32} animate={animate} />
        <Skeleton variant="text" width={400} animate={animate} />
      </div>

      {/* Form Card */}
      <div className="border rounded-lg p-6">
        <SkeletonForm
          fields={6}
          showLabels={true}
          showButton={true}
          animate={animate}
        />
      </div>
    </div>
  );

  const variants = {
    dashboard: renderDashboard,
    list: renderList,
    detail: renderDetail,
    form: renderForm,
  };

  return <div className={cn("w-full", className)}>{variants[variant]()}</div>;
}
