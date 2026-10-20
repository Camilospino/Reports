import { LoadingPage, Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <LoadingPage>
      <SkeletonHeader />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <SkeletonTable rows={8} cols={6} />
    </LoadingPage>
  );
}
