export default function AppointmentDetailLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-4 w-3 bg-muted/40 rounded" />
        <div className="h-4 w-40 bg-muted rounded" />
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-64 bg-muted rounded-lg" />
            <div className="h-6 w-20 bg-muted rounded-full" />
          </div>
          <div className="h-5 w-56 bg-muted/60 rounded-lg mt-2" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-44 bg-muted rounded-lg" />
          <div className="h-10 w-44 bg-muted rounded-lg" />
        </div>
      </div>
      {/* Three cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="h-5 w-28 bg-muted rounded" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-12 bg-muted/30 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Notes section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="h-5 w-64 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-28 bg-muted/30 rounded-lg" />
          <div className="h-28 bg-muted/30 rounded-lg" />
        </div>
      </div>
      {/* Prescriptions section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="h-5 w-72 bg-muted rounded" />
        </div>
        <div className="h-32 bg-muted/30 rounded-lg" />
      </div>
    </div>
  );
}
