import { Logo } from "./logo";

// Pantallas de entrada: fondo --bg, tarjeta blanca centrada, logo arriba.
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Logo dark />
      </div>
      <div className="card w-full max-w-[420px] p-6 sm:p-7">
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
