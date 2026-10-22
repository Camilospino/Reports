import type { Metadata } from "next";
import { Celular } from "@/components/landing/celular";
import { DejasDeHacer } from "@/components/landing/dejas-de-hacer";
import { Demo } from "@/components/landing/demo";
import { Equipo } from "@/components/landing/equipo";
import { HeroScroll } from "@/components/landing/hero-scroll";
import { KpiStrip } from "@/components/landing/kpi-strip";
import { Precios } from "@/components/landing/precios";
import { Preguntas } from "@/components/landing/preguntas";
import { Problema } from "@/components/landing/problema";
import { Recorrido } from "@/components/landing/recorrido";
import { Testimonio } from "@/components/landing/testimonio";

const TITLE = "Reportes · De la foto del daño al panel del dueño";
const DESCRIPTION =
  "Quien reporta toma una foto del daño, el técnico marca cada paso y tú lo ves todo en tu panel: tiempos, ubicaciones, responsables y evidencia.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es_CO", siteName: "Reportes" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function LandingPage() {
  return (
    <>
      <HeroScroll />
      <KpiStrip />
      <Problema />
      <Recorrido />
      <Celular />
      <DejasDeHacer />
      <Equipo />
      <Testimonio />
      <Precios />
      <Preguntas />
      <Demo />
    </>
  );
}
