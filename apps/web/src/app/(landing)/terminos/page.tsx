import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/landing/config";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Términos de servicio · Tecnio",
  description: "Condiciones de uso de Tecnio: el servicio, las cuentas, los pagos y las responsabilidades de cada parte.",
  alternates: { canonical: "/terminos" },
};

// Borrador: lo que va entre corchetes son decisiones del negocio que faltan.
export default function TermsPage() {
  return (
    <LegalPage title="Términos de servicio">
      <h2>1. Quiénes somos</h2>
      <p>
        Tecnio es un servicio de [Razón social], identificada con NIT [pendiente], con domicilio en [ciudad], Colombia. Al crear una
        cuenta o usar el servicio aceptas estos términos.
      </p>

      <h2>2. El servicio</h2>
      <p>
        Tecnio permite a empresas de servicio técnico crear y asignar órdenes de trabajo; que sus técnicos marquen cada paso desde el
        celular, con fotos, firma del cliente y materiales; y ver todo en un panel. [Pendiente: qué incluye cada plan y qué no incluye.]
      </p>

      <h2>3. Cuentas y usuarios</h2>
      <ul>
        <li>Quien contrata (el dueño de la empresa) es responsable de las personas que invita y de los permisos que les da.</li>
        <li>Cada usuario debe cuidar su contraseña y avisarnos si sospecha un acceso indebido.</li>
        <li>Quien invita a otras personas debe contar con su autorización para registrar sus datos.</li>
      </ul>

      <h2>4. Tu información</h2>
      <p>
        Las órdenes, fotos y datos que registras, incluidos los de tus clientes, son tuyos. Nos das permiso para guardarlos y procesarlos solo para prestarte el servicio.
        Los tratamos según la <Link href="/privacidad">Política de privacidad</Link>. Al terminar el servicio puedes pedir una copia de tu
        información dentro de [plazo].
      </p>

      <h2>5. Uso aceptable</h2>
      <p>
        No está permitido usar el servicio para subir contenido ilegal, fotos de personas sin su autorización, intentar acceder a datos de
        otras empresas ni afectar el funcionamiento del servicio.
      </p>

      <h2>6. Precios, pagos y prueba</h2>
      <p>[Pendiente: precio de cada plan, periodo de cobro, prueba gratis, renovación, cancelación y reembolsos.]</p>

      <h2>7. Disponibilidad y soporte</h2>
      <p>
        Trabajamos para que el servicio esté disponible siempre, pero pueden ocurrir interrupciones por mantenimiento o fallas de terceros.
        Soporte por {CONTACT_EMAIL} y WhatsApp en [horario].
      </p>

      <h2>8. Responsabilidad</h2>
      <p>
        Tecnio es una herramienta de registro y seguimiento: no ejecuta los trabajos ni responde por la labor de los técnicos.
        [Pendiente: límite de responsabilidad, revisado por un abogado.]
      </p>

      <h2>9. Terminación y cambios</h2>
      <p>
        Puedes cancelar cuando quieras. Podemos suspender una cuenta que incumpla estos términos. Si cambiamos los términos, avisaremos con
        anticipación en esta página y por correo.
      </p>

      <h2>10. Ley aplicable y contacto</h2>
      <p>
        Estos términos se rigen por las leyes de Colombia. Para cualquier duda escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
