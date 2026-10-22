import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/components/landing/config";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidad · Tecnio",
  description: "Cómo Tecnio recoge, usa y protege los datos personales, y cómo ejercer tus derechos (Ley 1581 de 2012).",
  alternates: { canonical: "/privacidad" },
};

// Política de tratamiento de datos personales (Ley 1581 de 2012 y Decreto 1377 de 2013,
// compilado en el Decreto 1074 de 2015). Borrador: lo que va entre corchetes falta por llenar.
export default function PrivacyPage() {
  const email = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

  return (
    <LegalPage title="Política de privacidad">
      <h2>1. Responsable del tratamiento</h2>
      <p>
        [Razón social], identificada con NIT [pendiente], con domicilio en [dirección], [ciudad], Colombia. Correo de contacto: {email}.
      </p>

      <h2>2. Datos que recogemos</h2>
      <ul>
        <li>
          <strong>Formulario de demo:</strong> nombre, correo o número de WhatsApp, tipo de empresa y número de técnicos.
        </li>
        <li>
          <strong>Usuarios del servicio</strong> (dueños, despachadores y técnicos): nombre, correo, teléfono y rol.
        </li>
        <li>
          <strong>Órdenes de trabajo:</strong> fotos del trabajo, firma de quien recibe, materiales usados y la hora de cada paso. Si el
          técnico da permiso en su celular, también la ubicación del dispositivo al marcar cada paso.
        </li>
        <li>
          <strong>Datos técnicos:</strong> tipo de navegador y una huella cifrada de la dirección IP, que solo se usa para evitar envíos
          automáticos. La analítica de la página no usa cookies ni identifica a las personas.
        </li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Responder tu solicitud de demo y contactarte por el medio que elegiste.</li>
        <li>Prestar el servicio: registrar las órdenes, mostrarlas en el panel y guardar la evidencia de cada trabajo.</li>
        <li>Dar soporte, avisarte de cambios en el servicio y cumplir obligaciones legales.</li>
        <li>Proteger el servicio contra fraude y abuso.</li>
        <li>Medir el uso de la página con estadísticas agregadas, sin identificar a nadie.</li>
      </ul>
      <p>No vendemos ni alquilamos datos personales.</p>

      <h2>4. Datos de los clientes de cada empresa</h2>
      <p>
        Las empresas que usan Tecnio registran datos de sus propios clientes: nombre, teléfono, dirección y la firma de quien recibe el
        trabajo. De esos datos la empresa es la responsable y Tecnio los trata solo por encargo suyo, para prestarle el servicio. Quien
        quiera ejercer sus derechos sobre ellos puede acudir a la empresa que lo atendió o escribirnos.
      </p>
      <p>
        Las fotos deben mostrar el trabajo, no a las personas. Si una foto incluye a alguien, se trata como dato personal y puede pedirse
        su eliminación. Nadie está obligado a autorizar el tratamiento de datos sensibles.
      </p>

      <h2>5. Tus derechos</h2>
      <p>Como titular de los datos puedes:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos.</li>
        <li>Pedir prueba de la autorización que nos diste.</li>
        <li>Saber, si lo pides, cómo hemos usado tus datos.</li>
        <li>Revocar la autorización o pedir que se borren tus datos, cuando no exista un deber legal o contractual de conservarlos.</li>
        <li>Consultar tus datos de forma gratuita.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) después de haber acudido a nosotros.</li>
      </ul>

      <h2>6. Cómo ejercerlos</h2>
      <p>
        Escribe a {email} indicando tu nombre, tu solicitud y un dato de contacto. El área responsable de atenderla es [nombre o cargo].
      </p>
      <ul>
        <li>
          <strong>Consultas:</strong> respondemos en máximo diez (10) días hábiles. Si no es posible, te avisamos el motivo y respondemos dentro
          de los cinco (5) días hábiles siguientes.
        </li>
        <li>
          <strong>Reclamos</strong> (corrección, actualización, supresión o revocatoria): respondemos en máximo quince (15) días hábiles,
          prorrogables por ocho (8) días hábiles más con aviso previo. Si al reclamo le falta información, te pediremos completarlo dentro de
          los cinco (5) días siguientes.
        </li>
      </ul>

      <h2>7. Proveedores y transferencias</h2>
      <p>
        Usamos proveedores de alojamiento y bases de datos que pueden guardar la información fuera de Colombia ([proveedores: confirmar]).
        Solo tratan los datos por encargo nuestro, para prestar el servicio, y con medidas de seguridad equivalentes a las de esta política.
      </p>

      <h2>8. Seguridad y conservación</h2>
      <p>
        La información viaja cifrada y cada empresa solo puede ver sus propios datos. Conservamos los datos mientras dure la relación y
        hasta [plazo] después, o el tiempo que exija la ley.
      </p>

      <h2>9. Vigencia y cambios</h2>
      <p>
        Esta política rige desde el [fecha]. Si cambia de forma importante, lo avisaremos en esta página y por correo a los usuarios del
        servicio.
      </p>
    </LegalPage>
  );
}
