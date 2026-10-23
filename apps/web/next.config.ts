import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Raíz del monorepo (incluye packages/db). Fija, para que no dependa de otros package.json fuera del repo.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // @react-pdf/renderer genera los PDF en el servidor; se carga tal cual, sin empaquetar.
  serverExternalPackages: ["@react-pdf/renderer"],
  // pdfkit (lo usa @react-pdf) carga sus fuentes con "#standard-fonts/...", un camino que el rastreo
  // de archivos no sigue. Sin esto, en Netlify faltan esas fuentes y el servidor se cae al azar.
  outputFileTracingIncludes: {
    "/**/*": ["../../node_modules/pdfkit/js/standard-fonts/**/*"],
  },
};

// Sentry: los source maps solo se suben si hay SENTRY_AUTH_TOKEN (en el build de producción).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  // Los errores del navegador pasan por el propio dominio (no los bloquean los bloqueadores de anuncios).
  tunnelRoute: "/monitoreo",
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
