import { Skeleton } from "@/components/ui/skeleton";

// A prefetched loading boundary lets dynamic routes respond to clicks
// immediately while live inventory is fetched. It uses shared theme tokens.
export default function Loading() {
  return (
    <main
      className="mx-auto min-h-[55vh] w-full max-w-6xl px-4 py-10 sm:px-6"
      aria-busy="true"
    >
      <p role="status" className="mb-6 text-sm font-medium text-foreground">
        Loading page…
      </p>
      <div className="space-y-5" aria-hidden="true">
        <Skeleton className="h-9 w-2/3 max-w-sm motion-reduce:animate-none" />
        <Skeleton className="h-40 w-full rounded-2xl motion-reduce:animate-none sm:h-56" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-xl motion-reduce:animate-none sm:h-44" />
          <Skeleton className="h-32 rounded-xl motion-reduce:animate-none sm:h-44" />
          <Skeleton className="hidden h-44 rounded-xl motion-reduce:animate-none sm:block" />
        </div>
      </div>
    </main>
  );
}
