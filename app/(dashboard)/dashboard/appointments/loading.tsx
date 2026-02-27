export default function AppointmentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-9 w-40 bg-muted rounded-lg" />
          <div className="h-5 w-72 bg-muted/60 rounded-lg mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted rounded-lg" />
          <div className="h-10 w-24 bg-muted rounded-lg" />
          <div className="h-10 w-40 bg-muted rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted/60 rounded mx-auto w-10" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-muted/30 rounded-lg border border-border/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
