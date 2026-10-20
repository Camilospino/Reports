import { LoadingPage, Skeleton, SkeletonCard, SkeletonHeader } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingPage>
      <SkeletonHeader actions={3} />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <div className="card grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
          <SkeletonCard lines={4} />
          <div className="card space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-[10px]" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 xl:max-w-[320px]">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </LoadingPage>
  );
}
