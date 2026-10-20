import { LoadingPage, Skeleton, SkeletonHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingPage>
      <SkeletonHeader actions={2} />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="card w-full space-y-3 lg:w-[260px]">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-[10px]" />
          ))}
        </div>
        <div className="card min-w-0 flex-1 space-y-4">
          <Skeleton className="h-4 w-full" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <Skeleton className="h-12 flex-1 rounded-[10px]" />
            </div>
          ))}
        </div>
      </div>
    </LoadingPage>
  );
}
