export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-9 w-40 bg-muted rounded-lg" />
        <div className="h-5 w-64 bg-muted/60 rounded-lg mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="w-9 h-9 rounded-lg bg-muted" />
            </div>
            <div className="h-8 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
