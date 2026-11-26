import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, WHATSAPP_HREF, WHATSAPP_NUMBER } from "@/components/landing/config";
import { LegalPage } from "@/components/landing/legal-page";
import { MAX_TECNICOS, PLANES, formatCOP } from "@/components/landing/planes";

// REVISAR CON ABOGADO: todo este texto es un borrador.

export const metadata: Metadata = {
  title: "Términos de servicio · Tecnio",
  description: "Condiciones de uso de Tecnio: el servicio, las cuentas, los pagos y las responsabilidades de cada parte.",
  alternates: { canonical: "/terminos" },
};

// "573002823551" → "+57 300 282 3551"
const WHATSAPP_DISPLAY = WHATSAPP_NUMBER.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, "+$1 $2 $3 $4");

// Borrador: lo que va entre corchetes son datos que faltan.
export default function TermsPage() {
  return (
    <LegalPage title="Términos de servicio" updated="26 de noviembre de 2026">
      <h2>1. Quiénes somos</h2>
      <p>
        Tecnio es un servicio operado por [Nombre completo], persona natural, identificada con NIT [número]-[DV], con domicilio en
        Dosquebradas, Risaralda, Colombia. Al crear una cuenta o usar el servicio aceptas estos términos.
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
        Los tratamos según la <Link href="/privacidad">Política de privacidad</Link>.
      </p>
      <p>
        <strong>Entrega y eliminación de datos.</strong> Cuando se cancele la suscripción, el cliente tendrá 30 días calendario para
        solicitar la exportación de su información (órdenes, reportes, fotos y clientes) en formato CSV/PDF. Pasado ese plazo, los datos
        se eliminarán de forma definitiva, salvo los que la ley obligue a conservar.
      </p>

      <h2>5. Consultas y reclamos</h2>
      <p>
        Las consultas y reclamos sobre datos personales se atienden según la Ley 1581 de 2012. Las consultas se responderán en máximo 10
        días hábiles y los reclamos en máximo 15 días hábiles, prorrogables según lo establece la ley.
      </p>

      <h2>6. Uso aceptable</h2>
      <p>
        No está permitido usar el servicio para subir contenido ilegal, fotos de personas sin su autorización, intentar acceder a datos de
        otras empresas ni afectar el funcionamiento del servicio.
      </p>

      <h2>7. Precios y pagos</h2>
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

      <h2>8. Disponibilidad y soporte</h2>
      <p>
        Trabajamos para que el servicio esté disponible siempre, pero pueden ocurrir interrupciones por mantenimiento o fallas de terceros.
      </p>
      <p>
        <strong>Horario de soporte:</strong> lunes a viernes de 8:00 a.m. a 6:00 p.m. y sábados de 8:00 a.m. a 12:00 m. (hora de
        Colombia), por WhatsApp <a href={WHATSAPP_HREF}>{WHATSAPP_DISPLAY}</a> y correo{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Las solicitudes recibidas fuera de ese horario se atenderán el siguiente
        día hábil.
      </p>

      <h2>9. Responsabilidad</h2>
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

      <h2>10. Terminación y cambios</h2>
      <p>
        Puedes cancelar cuando quieras. Podemos suspender una cuenta que incumpla estos términos. Si cambiamos los términos, avisaremos con
        anticipación en esta página y por correo.
      </p>

      <h2>11. Ley aplicable, jurisdicción y contacto</h2>
      <p>
        Jurisdicción: Dosquebradas, Risaralda, Colombia. Estos Términos se rigen por las leyes de la República de Colombia. Para cualquier
        duda escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
