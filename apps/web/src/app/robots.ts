import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000").replace(/\/$/, "");

// Solo la página pública se indexa. El panel, la app del técnico y los enlaces privados
// del cliente final (/r/, /c/) quedan fuera de los buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api", "/r/", "/c/", "/tecnico", "/onboarding", "/crear-contrasena", "/auth"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
