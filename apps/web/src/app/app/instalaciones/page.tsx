import { ComingSoon } from "@/components/panel/coming-soon";
import { requireStaff } from "@/lib/session";

export const metadata = { title: "Instalaciones · Tecnio" };

export default async function InstallationsPage() {
  await requireStaff();
  return (
    <ComingSoon
      title="Instalaciones"
      description="Aquí vas a ver todo lo que tu empresa ha dejado instalado en cada cliente, con su garantía y su próximo mantenimiento."
    />
  );
}
