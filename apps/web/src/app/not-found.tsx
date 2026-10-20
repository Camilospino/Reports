import Link from "next/link";

export const metadata = { title: "Página no encontrada · Tecnio", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="font-display text-sm font-bold text-accent">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-muted">
          El enlace puede estar mal escrito o ya no está disponible. Si te lo enviaron por WhatsApp, pide que te lo reenvíen.
        </p>
        <Link href="/" className="btn-dark mt-6">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
