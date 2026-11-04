export function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading overview" role="status">
      <span className="sr-only">Loading overview data...</span>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 rounded-2xl border border-border bg-card p-5"
          >
            <div className="size-12 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-24 rounded bg-muted" />
              <div className="h-7 w-12 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="size-8 shrink-0 rounded-full bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.85fr_1fr]">
        <div className="animate-pulse rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-3.5 w-64 rounded bg-muted" />
            </div>
            <div className="h-3.5 w-16 rounded bg-muted" />
          </div>

          <div className="mt-6 space-y-1">
            <div className="h-10 rounded-lg bg-muted/70" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 border-b border-border/70 px-4 py-4 last:border-b-0"
              >
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-6 w-24 rounded-full bg-muted" />
                <div className="ml-auto h-4 w-14 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        <div className="animate-pulse rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="size-10 shrink-0 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-36 rounded bg-muted" />
              <div className="h-3.5 w-44 rounded bg-muted" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3.5 w-24 rounded bg-muted" />
                  </div>
                  <div className="h-8 w-16 rounded-lg bg-muted" />
                </div>
                <div className="mt-3 h-3.5 w-48 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
