import type { MetadataRoute } from "next";
import { SECTORES } from "@/components/landing/sectores";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "monthly", priority: 1 },
    ...SECTORES.map((s) => ({ url: `${SITE}/para/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${SITE}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
