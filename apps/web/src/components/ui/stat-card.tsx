export function StatCard({
  label,
  value,
  suffix,
  detail,
  progress,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: React.ReactNode;
  detail?: React.ReactNode;
  progress?: number; // 0..1
}) {
  return (
    <div className="card">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="font-display tabular mt-1.5 text-[34px] leading-tight font-bold tracking-[-0.02em] text-ink">
        {value}
        {suffix && <span className="ml-1 text-lg font-medium text-muted">{suffix}</span>}
      </p>
      {progress !== undefined && (
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E7ECEA]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Porcentaje completado"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, progress * 100)}%` }} />
        </div>
      )}
      {detail && <p className="mt-2.5 text-[13px] text-muted">{detail}</p>}
    </div>
  );
}
