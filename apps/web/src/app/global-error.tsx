"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Último recurso: si falla el layout raíz. Debe traer su propio <html> y <body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="es-CO">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F3F5F4", color: "#10211C", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div role="alert" style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 22 }}>Algo salió mal</h1>
            <p style={{ color: "#55645F", fontSize: 14 }}>Ya nos llegó el aviso del error. Intenta de nuevo en un momento.</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 16, height: 44, padding: "0 16px", borderRadius: 10, border: 0, background: "#0E5A4A", color: "#fff", fontWeight: 600, cursor: "pointer" }}
            >
              Intentar de nuevo
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
