import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-center min-h-[60vh] flex-col gap-4 px-4">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
