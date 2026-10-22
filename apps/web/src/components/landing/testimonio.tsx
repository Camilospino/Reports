import ui from "./landing.module.css";
import styles from "./testimonio.module.css";

// Solo se muestra cuando haya un testimonio real de un cliente. Mientras tanto, la sección no existe.
const SHOW_TESTIMONIAL = false;
const TESTIMONIAL = {
  quote: "[Testimonio real de un dueño o administrador que use Reportes.]",
  author: "[Nombre] · [Propiedad]",
};

export function Testimonio() {
  if (!SHOW_TESTIMONIAL) return null;

  return (
    <section aria-label="Testimonio" className={ui.section}>
      <div className={ui.container}>
        <figure className={styles.box}>
          <span className={styles.mark} aria-hidden="true">
            “
          </span>
          <blockquote className={styles.quote}>{TESTIMONIAL.quote}</blockquote>
          <figcaption className={styles.author}>{TESTIMONIAL.author}</figcaption>
        </figure>
      </div>
    </section>
  );
}
