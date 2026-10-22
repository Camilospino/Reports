import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Celular } from "@/components/landing/celular";
import { ClienteRecibe } from "@/components/landing/cliente-recibe";
import { Demo } from "@/components/landing/demo";
import { Equipo } from "@/components/landing/equipo";
import { Precios } from "@/components/landing/precios";
import { FAQ } from "@/components/landing/faq";
import { Preguntas } from "@/components/landing/preguntas";
import { SectorHero } from "@/components/landing/sector-hero";
import { SectorProblemas } from "@/components/landing/sector-problemas";
import { SECTORES, findSector } from "@/components/landing/sectores";

type Params = { params: Promise<{ sector: string }> };

// Una página por sector, generada al compilar. Un sector que no existe da 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return SECTORES.map((s) => ({ sector: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const sector = findSector((await params).sector);
  if (!sector) return {};
  const url = `/para/${sector.slug}`;
  return {
    title: sector.seoTitle,
    description: sector.seoDescription,
    alternates: { canonical: url },
    openGraph: { title: sector.seoTitle, description: sector.seoDescription, url, type: "website", locale: "es_CO", siteName: "Tecnio" },
    twitter: { card: "summary_large_image", title: sector.seoTitle, description: sector.seoDescription },
  };
}

// Preguntas generales que también aplican al sector, después de las suyas.
const GENERAL = FAQ.filter((f) => f.q === "¿El técnico tiene que instalar algo?" || f.q === "¿Cuánto cuesta?");

export default async function SectorPage({ params }: Params) {
  const sector = findSector((await params).sector);
  if (!sector) notFound();

  return (
    <>
      <SectorHero sector={sector} />
      <SectorProblemas sector={sector} />
      <Celular />
      <ClienteRecibe />
      <Equipo />
      <Precios />
      <Preguntas items={[...sector.faq, ...GENERAL]} />
      <Demo sector={sector.leadType} />
    </>
  );
}
