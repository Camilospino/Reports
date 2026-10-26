export function SectionCard({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`min-w-0 rounded-[14px] border border-line bg-surface ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-b border-line px-5 py-4">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {action}
      </header>
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
