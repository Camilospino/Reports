// Esqueletos de carga: bloques grises con pulso suave (sin animación si el usuario la reduce).
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[8px] bg-line-soft motion-reduce:animate-none ${className}`} />;
}

// Envoltorio de cada pantalla mientras carga: anuncia "Cargando…" a lectores de pantalla.
export function LoadingPage({ children }: { children: React.ReactNode }) {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando…
      </p>
      {children}
    </div>
  );
}

export function SkeletonHeader({ actions = 1 }: { actions?: number }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="flex gap-2.5">
        {Array.from({ length: actions }, (_, i) => (
          <Skeleton key={i} className="h-11 w-36 rounded-[10px]" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card p-0">
      <div className="flex gap-6 border-b border-line-soft px-5 py-4">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-6 border-b border-line-soft px-5 py-4 last:border-0">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? "max-w-20" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i % 2 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
