import { LoadingPage, Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingPage>
      <SkeletonHeader />
      <div className="card mb-6 flex flex-wrap gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-11 min-w-40 flex-1 rounded-[10px]" />
        ))}
      </div>
      <SkeletonTable rows={10} cols={6} />
    </LoadingPage>
  );
}
