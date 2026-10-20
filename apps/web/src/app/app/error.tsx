"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

// Error inesperado dentro del panel: se muestra sin perder el menú lateral.
export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div role="alert" className="card mx-auto mt-10 max-w-lg text-center">
      <h1 className="font-display text-xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-sm text-muted">
        No pudimos cargar esta pantalla. Revisa tu conexión e intenta de nuevo. Si sigue pasando, escríbenos.
      </p>
      {error.digest && <p className="mt-2 font-display text-xs text-muted">Código: {error.digest}</p>}
      <button type="button" className="btn-primary mt-5" onClick={reset}>
        <RotateCcw size={16} aria-hidden /> Intentar de nuevo
      </button>
    </div>
  );
}
