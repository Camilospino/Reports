import { LoadingPage, Skeleton, SkeletonCard, SkeletonHeader, SkeletonTable } from "@/components/ui/skeleton";

// Inicio (y respaldo para cualquier pantalla del panel sin esqueleto propio).
export default function Loading() {
  return (
    <LoadingPage>
      <SkeletonHeader />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[1_1_560px]">
          <SkeletonTable rows={6} cols={4} />
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 xl:max-w-[320px]">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={2} />
        </div>
      </div>
    </LoadingPage>
  );
}
