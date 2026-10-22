import Link from "next/link";
import { BRAND, CONTACT_EMAIL, DEMO_HREF, LOGIN_HREF, NAV_LINKS } from "./config";
import { SECTORES } from "./sectores";
import { WhatsappLink } from "./whatsapp";
import ui from "./landing.module.css";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={ui.container}>
        <div className={styles.grid}>
          <div>
            <p className={styles.brandName}>{BRAND}</p>
            <p className={styles.tagline}>Cada trabajo, con evidencia.</p>
          </div>

          <nav aria-labelledby="pie-producto">
            <h2 id="pie-producto" className={styles.title}>Producto</h2>
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={styles.link}>{l.label}</a>
                </li>
              ))}
              <li>
                <Link href={LOGIN_HREF} className={styles.link}>Entrar</Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="pie-sectores">
            <h2 id="pie-sectores" className={styles.title}>Sectores</h2>
            <ul>
              {SECTORES.map((s) => (
                <li key={s.slug}>
                  <Link href={`/para/${s.slug}`} className={styles.link}>{s.name}</Link>
                </li>
              ))}
              <li>
                <a href={DEMO_HREF} className={styles.link}>Otros sectores</a>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="pie-empresa">
            <h2 id="pie-empresa" className={styles.title}>Empresa</h2>
            <ul>
              <li>
                <a href={DEMO_HREF} className={styles.link}>Agendar demo</a>
              </li>
              <li>
                <WhatsappLink className={styles.link} lugar="pie">WhatsApp</WhatsappLink>
              </li>
              <li className={styles.plain}>
                Correo:&nbsp;<a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>{CONTACT_EMAIL}</a>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="pie-legal">
            <h2 id="pie-legal" className={styles.title}>Legal</h2>
            <ul>
              <li>
                <Link href="/terminos" className={styles.link}>Términos</Link>
              </li>
              <li>
                <Link href="/privacidad" className={styles.link}>Privacidad</Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className={styles.bottom}>© 2026 {BRAND}</p>
      </div>
    </footer>
  );
}
