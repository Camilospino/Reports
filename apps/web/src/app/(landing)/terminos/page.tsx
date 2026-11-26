import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/components/landing/config";
import { LegalPage } from "@/components/landing/legal-page";
import { MAX_TECNICOS, PLANES, formatCOP } from "@/components/landing/planes";

// REVISAR CON ABOGADO: todo este texto es un borrador.

export const metadata: Metadata = {
  title: "Términos de servicio · Tecnio",
  description: "Condiciones de uso de Tecnio: el servicio, las cuentas, los pagos y las responsabilidades de cada parte.",
  alternates: { canonical: "/terminos" },
};

// Borrador: lo que va entre corchetes son decisiones del negocio que faltan.
export default function TermsPage() {
  return (
    <LegalPage title="Términos de servicio" updated="26 de noviembre de 2026">
      <h2>1. Quiénes somos</h2>
      <p>
        Tecnio es un servicio de [Razón social], identificada con NIT [pendiente], con domicilio en [ciudad], Colombia. Al crear una
        cuenta o usar el servicio aceptas estos términos.
      </p>

      <h2>2. El servicio</h2>
      <p>
        Tecnio permite a empresas de servicio técnico crear y asignar órdenes de trabajo; que sus técnicos marquen cada paso desde el
        celular, con fotos, firma del cliente y materiales; y ver todo en un panel.
      </p>
      <p>
        Todos los planes incluyen el panel web para el dueño y el despachador, la app del técnico (que funciona sin señal y envía todo
        cuando vuelve la conexión) y el reporte para el cliente con fotos, firma y PDF. Cada plan incluye:
      </p>
      <ul>
        {PLANES.map((p) => (
          <li key={p.name}>
            <strong>{p.name}</strong> ({formatCOP(p.price)} COP al mes): hasta {p.technicians} técnicos.{" "}
            {p.features.join(". ")}.
          </li>
        ))}
      </ul>
      <p>
        El servicio no incluye los celulares ni la conexión a internet de tu equipo, ni la ejecución de los trabajos. Si tienes más de{" "}
        {MAX_TECNICOS} técnicos, escríbenos y acordamos las condiciones.
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

      <h2>6. Precios y pagos</h2>
      <ul>
        <li>
          Los precios están en pesos colombianos y dependen del plan:{" "}
          {PLANES.map((p) => `${p.name} ${formatCOP(p.price)} COP al mes`).join(", ")}.
        </li>
        <li>El cobro es mensual y por adelantado. Cada mes pagado te da acceso al servicio hasta el final de ese mes.</li>
        <li>No hay prueba gratis.</li>
        <li>
          Puedes cancelar en cualquier momento. El servicio sigue activo hasta el final del mes que ya pagaste y no se vuelve a cobrar.
        </li>
        <li>No hay reembolsos de meses ya iniciados.</li>
      </ul>

      <h2>7. Disponibilidad y soporte</h2>
      <p>
        Trabajamos para que el servicio esté disponible siempre, pero pueden ocurrir interrupciones por mantenimiento o fallas de terceros.
        Soporte por {CONTACT_EMAIL} y WhatsApp en [horario].
      </p>

      <h2>8. Responsabilidad</h2>
      <p>
        Tecnio es una herramienta de registro y seguimiento: no ejecuta los trabajos ni responde por la labor de los técnicos.
      </p>
      {/* REVISAR CON ABOGADO: cláusula estándar de límite de responsabilidad (monto, plazo y excepciones). */}
      <p>
        En la medida en que lo permita la ley colombiana, Tecnio no responde por daños indirectos, lucro cesante, pérdida de negocios o
        pérdida de datos causados por el uso del servicio o por no poder usarlo. La responsabilidad total de Tecnio por cualquier reclamo
        relacionado con el servicio se limita al valor que hayas pagado en los tres (3) meses anteriores al hecho que lo origina. Esto no
        limita la responsabilidad que la ley no permite limitar, como la causada con dolo o culpa grave.
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
