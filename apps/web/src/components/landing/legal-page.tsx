import ui from "./landing.module.css";
import styles from "./legal-page.module.css";

// Plantilla de las páginas legales. El texto definitivo debe revisarlo un abogado.
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className={`${ui.light} ${styles.page}`}>
      <div className={`${ui.container} ${styles.body}`}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Última actualización: [fecha de publicación]</p>
        <p className={styles.draft}>[Borrador: revisar con un abogado antes de publicar.]</p>
        {children}
      </div>
    </article>
  );
}
