import type { Metadata } from "next";
import { Geist_Mono, Onest } from "next/font/google";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Umami } from "@/components/landing/umami";
import { WhatsappButton } from "@/components/landing/whatsapp";
import ui from "@/components/landing/landing.module.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["500", "700"] });

// Base de las URL absolutas (imagen para redes, enlace canónico). En producción: el dominio real.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000"),
};

// Página pública de Tecnio. Fuentes y colores propios: no se mezclan con el panel.
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${onest.variable} ${geistMono.variable} ${ui.root}`}>
      <Navbar />
      <main id="contenido">{children}</main>
      <Footer />
      <WhatsappButton />
      <Umami />
    </div>
  );
}
