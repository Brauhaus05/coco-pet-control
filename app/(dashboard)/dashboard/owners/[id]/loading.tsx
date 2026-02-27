export default function PetProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-3 bg-muted/40 rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted" />
        <div>
          <div className="h-8 w-32 bg-muted rounded-lg" />
          <div className="h-5 w-48 bg-muted/60 rounded-lg mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-4"
          >
            <div className="h-5 w-28 bg-muted rounded" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 bg-muted/40 rounded w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
