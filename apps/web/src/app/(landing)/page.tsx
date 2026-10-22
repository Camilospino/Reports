import type { Metadata } from "next";
import { Celular } from "@/components/landing/celular";
import { ClienteRecibe } from "@/components/landing/cliente-recibe";
import { DejasDeHacer } from "@/components/landing/dejas-de-hacer";
import { Demo } from "@/components/landing/demo";
import { Equipo } from "@/components/landing/equipo";
import { HeroScroll } from "@/components/landing/hero-scroll";
import { KpiStrip } from "@/components/landing/kpi-strip";
import { ParaQuien } from "@/components/landing/para-quien";
import { Precios } from "@/components/landing/precios";
import { Preguntas } from "@/components/landing/preguntas";
import { Problema } from "@/components/landing/problema";
import { Recorrido } from "@/components/landing/recorrido";
import { Testimonio } from "@/components/landing/testimonio";

const TITLE = "Tecnio · Órdenes de trabajo con foto, hora y firma";
const DESCRIPTION =
  "Órdenes de trabajo para empresas de servicio técnico: agenda, app del técnico sin señal, fotos y firma del cliente, y reporte por WhatsApp.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es_CO", siteName: "Tecnio" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// Secciones alternadas oscuro / claro: problema → lo que dejas de hacer → para quién → cómo funciona
// (panel, app del técnico, lo que recibe el cliente) → equipo → precios → preguntas → demo.
export default function LandingPage() {
  return (
    <>
      <HeroScroll />
      <KpiStrip />
      <Problema />
      <DejasDeHacer />
      <ParaQuien />
      <Recorrido />
      <Celular />
      <ClienteRecibe />
      <Equipo />
      <Testimonio />
      <Precios />
      <Preguntas />
      <Demo />
    </>
  );
}
