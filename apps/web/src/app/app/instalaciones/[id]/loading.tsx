import { LoadingPage, Skeleton, SkeletonCard, SkeletonHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingPage>
      <SkeletonHeader actions={2} />
      <Skeleton className="mb-6 h-14 w-full rounded-[14px]" />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <div className="card space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-20 rounded-full" />
              ))}
            </div>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-6 border-t border-line-soft pt-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
          <div className="card space-y-4">
            <Skeleton className="h-5 w-48" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="mt-1 size-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 xl:max-w-[340px]">
          <div className="card space-y-3">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-11 w-full rounded-[10px]" />
          </div>
          <SkeletonCard lines={5} />
          <SkeletonCard lines={3} />
          <div className="card space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="aspect-[16/9] w-full rounded-[10px]" />
          </div>
        </div>
      </div>
    </LoadingPage>
  );
}
