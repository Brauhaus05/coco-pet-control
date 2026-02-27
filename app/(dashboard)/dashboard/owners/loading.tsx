export default function OwnersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-9 w-32 bg-muted rounded-lg" />
          <div className="h-5 w-56 bg-muted/60 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-lg" />
      </div>
      <div className="h-10 w-72 bg-muted rounded-lg" />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted/60 rounded" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-5 bg-muted/40 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
